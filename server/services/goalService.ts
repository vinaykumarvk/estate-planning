import { prisma } from "../db";
import { encode, decode } from "./json";
import { audit } from "./auditService";
import type { GoalGapAnalysis } from "../../shared/types";

export async function createGoal(data: {
  tenantId: string;
  matterId: string;
  goalText: string;
  category: string;
  priority: string;
  linkedScenarioIds?: string[];
  notes?: string;
}) {
  const goal = await prisma.clientGoal.create({
    data: {
      tenantId: data.tenantId,
      matterId: data.matterId,
      goalText: data.goalText,
      category: data.category,
      priority: data.priority ?? "medium",
      status: "pending",
      linkedScenarioIds: encode(data.linkedScenarioIds ?? []),
      notes: data.notes ?? null,
    },
  });

  await audit({
    tenantId: data.tenantId,
    matterId: data.matterId,
    actorRole: "solicitor",
    eventType: "goal_created",
    entityType: "ClientGoal",
    entityId: goal.id,
    metadata: { category: data.category },
  });

  return { ...goal, linkedScenarioIds: decode<string[]>(goal.linkedScenarioIds as string, []) };
}

export async function updateGoal(id: string, tenantId: string, data: {
  goalText?: string;
  category?: string;
  priority?: string;
  status?: string;
  linkedScenarioIds?: string[];
  notes?: string;
}) {
  const updateData: Record<string, unknown> = {};
  if (data.goalText !== undefined) updateData.goalText = data.goalText;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.linkedScenarioIds !== undefined) updateData.linkedScenarioIds = encode(data.linkedScenarioIds);
  if (data.notes !== undefined) updateData.notes = data.notes;

  const goal = await prisma.clientGoal.update({
    where: { id },
    data: updateData,
  });

  return { ...goal, linkedScenarioIds: decode<string[]>(goal.linkedScenarioIds as string, []) };
}

export async function deleteGoal(id: string, tenantId: string) {
  const existing = await prisma.clientGoal.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error("Goal not found or access denied");

  return prisma.clientGoal.delete({ where: { id } });
}

export async function listGoals(matterId: string, tenantId: string) {
  const goals = await prisma.clientGoal.findMany({
    where: { matterId, tenantId },
    orderBy: { createdAt: "desc" },
  });
  return goals.map(g => ({ ...g, linkedScenarioIds: decode<string[]>(g.linkedScenarioIds as string, []) }));
}

export async function getGoal(id: string, tenantId: string) {
  const goal = await prisma.clientGoal.findFirst({
    where: { id, tenantId },
  });
  if (!goal) return null;
  return { ...goal, linkedScenarioIds: decode<string[]>(goal.linkedScenarioIds as string, []) };
}

export async function analyzeGoalGaps(matterId: string, tenantId: string): Promise<GoalGapAnalysis> {
  const goals = await listGoals(matterId, tenantId);
  const gaps: GoalGapAnalysis["gaps"] = [];

  // Fetch related data for gap analysis
  const scenarios = await prisma.scenario.findMany({ where: { matterId, tenantId } });
  const wills = await prisma.willCoordination.findMany({ where: { matterId, tenantId } });

  // Check if faraid calculations exist
  let hasFaraid = false;
  try {
    const faraidCalcs = await prisma.faraidCalculation.findMany({ where: { matterId, tenantId } });
    hasFaraid = faraidCalcs.length > 0;
  } catch {
    // Table may not exist yet
  }

  for (const goal of goals) {
    let addressed = false;
    let reason = "";

    switch (goal.category) {
      case "minimize_iht":
        // Addressed if any linked scenario exists for IHT review
        addressed = goal.linkedScenarioIds.length > 0 && scenarios.length >= 1;
        reason = addressed ? "" : "No IHT optimization scenarios linked";
        break;
      case "protect_family_home":
        // Addressed if RNRB is claimed (any scenario with residential property)
        addressed = goal.linkedScenarioIds.length > 0;
        reason = addressed ? "" : "No scenario linked for family home protection";
        break;
      case "cross_border_coordination":
        // Addressed if will coordination covers multiple jurisdictions
        {
          const jurisdictions = new Set(wills.map(w => w.jurisdictionCode));
          addressed = jurisdictions.size >= 2;
          reason = addressed ? "" : "Will coordination does not cover all asset jurisdictions";
        }
        break;
      case "islamic_compliance":
        addressed = hasFaraid;
        reason = addressed ? "" : "No Faraid calculation has been performed";
        break;
      case "provide_for_dependants":
        addressed = goal.linkedScenarioIds.length > 0;
        reason = addressed ? "" : "No scenario linked for dependant provision";
        break;
      case "business_succession":
        addressed = goal.linkedScenarioIds.length > 0;
        reason = addressed ? "" : "No business succession scenario linked";
        break;
      case "charitable_giving":
        addressed = goal.linkedScenarioIds.length > 0;
        reason = addressed ? "" : "No charitable giving scenario linked";
        break;
      case "asset_protection":
        addressed = goal.linkedScenarioIds.length > 0;
        reason = addressed ? "" : "No asset protection strategy linked";
        break;
      case "tax_efficiency":
        addressed = goal.linkedScenarioIds.length > 0 && scenarios.length >= 1;
        reason = addressed ? "" : "No tax efficiency scenarios linked";
        break;
      default:
        reason = "Unknown goal category";
    }

    if (!addressed) {
      gaps.push({
        goalId: goal.id,
        goalText: goal.goalText,
        category: goal.category as GoalGapAnalysis["gaps"][number]["category"],
        reason,
      });
    }

    // Update goal status in database
    const newStatus = addressed ? "addressed" : "pending";
    if (goal.status !== newStatus) {
      await prisma.clientGoal.update({
        where: { id: goal.id },
        data: { status: newStatus },
      });
    }
  }

  const addressedCount = goals.length - gaps.length;
  return {
    totalGoals: goals.length,
    addressedCount,
    unaddressedCount: gaps.length,
    completionPercent: goals.length > 0 ? Math.round((addressedCount / goals.length) * 100) : 0,
    gaps,
  };
}
