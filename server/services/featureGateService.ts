import { prisma } from "../db";
import { audit } from "./auditService";

export async function assertFeatureEnabled(featureCode: string, tenantId: string, matterId?: string) {
  const gate = await prisma.featureGate.findUnique({ where: { featureCode } });
  if (!gate) {
    return { enabled: true };
  }

  if (!gate.enabled) {
    await audit({
      tenantId,
      matterId,
      actorRole: "system",
      eventType: "feature.gated",
      entityType: "FeatureGate",
      entityId: gate.id,
      metadata: { featureCode, phase: gate.phase, reason: gate.reason }
    });
    throw new Error(`${featureCode} is gated until Phase ${gate.phase}: ${gate.reason}`);
  }

  return { enabled: true };
}

export async function listFeatureGates() {
  return prisma.featureGate.findMany({ orderBy: { featureCode: "asc" } });
}
