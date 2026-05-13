import { prisma } from "../db";
import type { ExportBundle } from "../../shared/types";
import { getPackSnapshot } from "./configurationService";
import { audit } from "./auditService";

export async function exportMatterBundle(matterId: string, requestedBy: string): Promise<ExportBundle> {
  const [matter, people, assets, scenarios, documents, auditEvents] = await Promise.all([
    prisma.matter.findUniqueOrThrow({ where: { id: matterId } }),
    prisma.person.findMany({ where: { matterId } }),
    prisma.asset.findMany({ where: { matterId } }),
    prisma.scenario.findMany({ where: { matterId } }),
    prisma.document.findMany({ where: { matterId } }),
    prisma.auditEvent.findMany({ where: { matterId }, orderBy: { createdAt: "asc" } })
  ]);
  const pack = await prisma.jurisdictionPack.findFirstOrThrow({
    where: { jurisdictionCode: matter.primaryJurisdictionCode, status: "active" }
  });
  const configurationSnapshot = await getPackSnapshot(pack.id);

  await prisma.exportJob.create({
    data: {
      tenantId: matter.tenantId,
      matterId,
      exportType: "matter_bundle",
      status: "complete",
      storageLocation: `memory://${matterId}`,
      requestedBy,
      completedAt: new Date()
    }
  });

  await audit({
    tenantId: matter.tenantId,
    matterId,
    actorUserId: requestedBy,
    actorRole: "professional",
    eventType: "matter.exported",
    entityType: "ExportJob",
    metadata: { requirementRefs: ["FR-048", "CR-008", "SEC-007"] }
  });

  return {
    matterId,
    generatedAt: new Date().toISOString(),
    matter,
    people,
    assets,
    scenarios,
    documents,
    auditEvents,
    configurationSnapshot
  };
}
