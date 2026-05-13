import { prisma } from "../db";
import { audit } from "./auditService";

export async function evaluateRetention(tenantId: string) {
  const policies = await prisma.retentionPolicy.findMany({
    where: { OR: [{ tenantId }, { tenantId: null }], status: "active" }
  });

  const now = new Date();
  const expired: Array<{ recordType: string; retentionYears: number; expiredCount: number }> = [];

  for (const policy of policies) {
    const cutoff = new Date(now);
    cutoff.setFullYear(cutoff.getFullYear() - policy.retentionYears);

    if (policy.recordType === "AuditEvent") {
      const count = await prisma.auditEvent.count({
        where: { tenantId, createdAt: { lt: cutoff } }
      });
      if (count > 0) expired.push({ recordType: policy.recordType, retentionYears: policy.retentionYears, expiredCount: count });
    } else if (policy.recordType === "ExportJob") {
      const count = await prisma.exportJob.count({
        where: { tenantId, createdAt: { lt: cutoff } }
      });
      if (count > 0) expired.push({ recordType: policy.recordType, retentionYears: policy.retentionYears, expiredCount: count });
    }
  }

  return { tenantId, policies: policies.length, expiredRecords: expired, requirementRefs: ["SEC-009"] };
}

export async function purgeExpiredRecords(tenantId: string, dryRun: boolean = true) {
  const evaluation = await evaluateRetention(tenantId);
  const purged: Array<{ recordType: string; count: number }> = [];

  if (!dryRun) {
    for (const record of evaluation.expiredRecords) {
      const now = new Date();
      const policy = await prisma.retentionPolicy.findFirst({
        where: { recordType: record.recordType, status: "active" }
      });
      if (!policy) continue;

      const cutoff = new Date(now);
      cutoff.setFullYear(cutoff.getFullYear() - policy.retentionYears);

      // Check legal hold override
      if (policy.legalHoldOverride) {
        const holdMatters = await prisma.matter.count({
          where: { tenantId, status: { in: ["review", "execution"] } }
        });
        if (holdMatters > 0) continue;
      }

      if (record.recordType === "AuditEvent") {
        const result = await prisma.auditEvent.deleteMany({
          where: { tenantId, createdAt: { lt: cutoff } }
        });
        purged.push({ recordType: record.recordType, count: result.count });
      } else if (record.recordType === "ExportJob") {
        const result = await prisma.exportJob.deleteMany({
          where: { tenantId, createdAt: { lt: cutoff } }
        });
        purged.push({ recordType: record.recordType, count: result.count });
      }
    }

    await audit({
      tenantId,
      actorRole: "system",
      eventType: "retention.purged",
      entityType: "RetentionPolicy",
      metadata: { purged, requirementRefs: ["SEC-009"] }
    });
  }

  return { tenantId, dryRun, purged: dryRun ? evaluation.expiredRecords : purged, requirementRefs: ["SEC-009"] };
}
