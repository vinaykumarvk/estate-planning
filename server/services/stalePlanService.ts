import { prisma } from "../db";
import { audit } from "./auditService";

export async function checkStalePlans(thresholdDays: number = 180) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - thresholdDays);

  const staleMatters = await prisma.matter.findMany({
    where: {
      status: { in: ["draft", "intake"] },
      updatedAt: { lt: cutoff }
    },
    orderBy: { updatedAt: "asc" }
  });

  return staleMatters.map((m) => ({
    matterId: m.id,
    matterNumber: m.matterNumber,
    title: m.title,
    status: m.status,
    lastUpdated: m.updatedAt,
    daysSinceUpdate: Math.floor((Date.now() - m.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
  }));
}

export async function flagStalePlans(thresholdDays: number = 180) {
  const stalePlans = await checkStalePlans(thresholdDays);
  const flagged: string[] = [];

  // Batch-fetch all matters to avoid N+1
  const matterIds = stalePlans.map((p) => p.matterId);
  const matters = matterIds.length > 0
    ? await prisma.matter.findMany({ where: { id: { in: matterIds } } })
    : [];
  const matterMap = new Map(matters.map((m) => [m.id, m]));

  for (const plan of stalePlans) {
    const matter = matterMap.get(plan.matterId);
    if (!matter) continue;

    await prisma.task.create({
      data: {
        tenantId: matter.tenantId,
        matterId: plan.matterId,
        title: `Stale plan review: ${plan.matterNumber}`,
        description: `Matter has not been updated in ${plan.daysSinceUpdate} days. Review and decide whether to continue or archive.`,
        ownerRole: "solicitor",
        status: "pending",
        sourceRuleCode: "STALE_PLAN"
      }
    });

    await prisma.notification.create({
      data: {
        tenantId: matter.tenantId,
        matterId: plan.matterId,
        channel: "in_app",
        subject: `Stale plan: ${plan.matterNumber}`,
        body: `Matter "${plan.title}" has not been updated in ${plan.daysSinceUpdate} days.`,
        status: "pending"
      }
    });

    flagged.push(plan.matterId);
  }

  if (flagged.length > 0) {
    await audit({
      tenantId: "platform",
      actorRole: "system",
      eventType: "stale_plans.flagged",
      entityType: "Matter",
      metadata: { flaggedCount: flagged.length, thresholdDays, requirementRefs: ["CR-015"] }
    });
  }

  return { flaggedCount: flagged.length, matterIds: flagged, requirementRefs: ["CR-015"] };
}
