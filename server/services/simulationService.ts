import { prisma } from "../db";
import type { RuleIssue } from "../../shared/types";
import { decode, stableHash } from "./json";
import { getActivePack } from "./configurationService";
import { calculatePTReservedSharePct } from "./ruleEngine";
import { audit } from "./auditService";

export async function runWhatIfSimulation(
  matterId: string,
  scenarioId: string,
  hypothetical: { adjustedDispositions?: Array<{ beneficiaryLabel: string; percentage?: number; giftType?: string }> }
) {
  const matter = await prisma.matter.findUniqueOrThrow({ where: { id: matterId } });
  const pack = await getActivePack(matter.primaryJurisdictionCode);
  const [relationships, assets, dispositions, people] = await Promise.all([
    prisma.relationship.findMany({ where: { matterId } }),
    prisma.asset.findMany({ where: { matterId } }),
    prisma.disposition.findMany({ where: { matterId, scenarioId } }),
    prisma.person.findMany({ where: { matterId } })
  ]);

  // Apply hypothetical adjustments in-memory
  const simulatedDispositions = dispositions.map((d) => {
    const adjustment = hypothetical.adjustedDispositions?.find((a) => a.beneficiaryLabel === d.beneficiaryLabel);
    if (adjustment) {
      return {
        ...d,
        percentage: adjustment.percentage ?? d.percentage,
        giftType: adjustment.giftType ?? d.giftType
      };
    }
    return d;
  });

  // Run simplified rule evaluation in-memory
  const issues: RuleIssue[] = [];
  const estateValueByCurrency = assets.reduce<Record<string, number>>((acc, a) => {
    acc[a.currency] = (acc[a.currency] ?? 0) + a.valuation;
    return acc;
  }, {});

  if (pack.jurisdictionCode === "PT") {
    const hasSpouse = relationships.some((r) => r.relationshipType === "spouse");
    const childCount = relationships.filter((r) => r.relationshipType === "child").length;
    const hasParents = relationships.some((r) => r.relationshipType === "parent");
    const reservedPct = calculatePTReservedSharePct(hasSpouse, childCount, hasParents);
    const freeQuota = 1 - reservedPct;

    const nonProtectedPct = simulatedDispositions
      .filter((d) => d.beneficiaryPersonId)
      .filter((d) => {
        const rel = relationships.find((r) => r.toPersonId === d.beneficiaryPersonId);
        return !rel || !["spouse", "child", "parent"].includes(rel.relationshipType);
      })
      .reduce((sum, d) => sum + (d.percentage ?? 0), 0);

    if (nonProtectedPct > freeQuota * 100) {
      issues.push({
        code: "RESERVED_SHARE_CONFLICT",
        severity: "blocker",
        message: `Simulated: non-protected heirs receive ${nonProtectedPct}% but free quota is ${Math.round(freeQuota * 100)}%.`,
        ruleCode: "PT-RESERVED-SHARE",
        sourceCode: "S4",
        professionalReview: true
      });
    }
  }

  if (pack.jurisdictionCode === "EW" && (estateValueByCurrency.GBP ?? 0) > 325000) {
    issues.push({
      code: "TAX_THRESHOLD_TRIGGER",
      severity: "warning",
      message: "Simulated: estate value exceeds UK IHT threshold.",
      ruleCode: "EW-IHT-THRESHOLD",
      sourceCode: "S6",
      professionalReview: true
    });
  }

  await audit({
    tenantId: matter.tenantId,
    matterId,
    actorRole: "system",
    eventType: "simulation.executed",
    entityType: "Scenario",
    entityId: scenarioId,
    metadata: { hypothetical, issueCount: issues.length, requirementRefs: ["FR-025"] }
  });

  return {
    matterId,
    scenarioId,
    hypothetical,
    projectedIssues: issues,
    blocked: issues.some((i) => i.severity === "blocker"),
    persisted: false
  };
}
