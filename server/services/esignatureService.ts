import { prisma } from "../db";
import { assertFeatureEnabled } from "./featureGateService";
import { audit } from "./auditService";

export async function routeForESignature(documentId: string, actorUserId: string) {
  const document = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });

  await assertFeatureEnabled("e_signature", document.tenantId, document.matterId);

  if (document.status !== "finalized") {
    throw new Error("Document must be finalized before routing for e-signature");
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { executionStatus: "e_signature_pending" }
  });

  await audit({
    tenantId: document.tenantId,
    matterId: document.matterId,
    actorUserId,
    actorRole: "professional",
    eventType: "document.esign_routed",
    entityType: "Document",
    entityId: documentId,
    metadata: { requirementRefs: ["FR-031"] }
  });

  return {
    documentId,
    status: "e_signature_pending",
    provider: "configured_provider",
    routedAt: new Date().toISOString()
  };
}

export async function checkESignatureStatus(documentId: string) {
  const document = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });

  return {
    documentId,
    executionStatus: document.executionStatus,
    eSignatureComplete: document.executionStatus === "executed"
  };
}
