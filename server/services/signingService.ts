import { prisma } from "../db";
import type { SigningCeremonyStatus } from "../../shared/types";
import { signingTransitionSchema, witnessCaptureSchema, revokeDocumentSchema } from "../../shared/schemas";
import { decode, encode } from "./json";
import { audit } from "./auditService";

const VALID_TRANSITIONS: Record<string, SigningCeremonyStatus[]> = {
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["witnessed", "cancelled"],
  witnessed: ["completed", "cancelled"],
  completed: [],
  cancelled: []
};

export async function transitionSigningCeremony(input: unknown) {
  const data = signingTransitionSchema.parse(input);
  const event = await prisma.signatureEvent.findUniqueOrThrow({ where: { id: data.eventId } });

  const validTargets = VALID_TRANSITIONS[event.status] ?? [];
  if (!validTargets.includes(data.targetStatus)) {
    throw new Error(`Cannot transition from ${event.status} to ${data.targetStatus}`);
  }

  const updated = await prisma.signatureEvent.update({
    where: { id: data.eventId },
    data: {
      status: data.targetStatus,
      occurredAt: data.targetStatus === "completed" ? new Date() : event.occurredAt
    }
  });

  if (data.targetStatus === "completed") {
    await prisma.document.update({
      where: { id: event.documentId },
      data: { executionStatus: "executed" }
    });
  }

  await audit({
    tenantId: event.tenantId,
    matterId: event.matterId,
    actorUserId: data.actorUserId,
    actorRole: "qualified_professional",
    eventType: "signing.transitioned",
    entityType: "SignatureEvent",
    entityId: event.id,
    metadata: { fromStatus: event.status, toStatus: data.targetStatus, requirementRefs: ["FR-030"] }
  });

  return updated;
}

export async function captureWitnessDetails(input: unknown) {
  const data = witnessCaptureSchema.parse(input);
  const event = await prisma.signatureEvent.findUniqueOrThrow({ where: { id: data.eventId } });
  const witnesses = decode<unknown[]>(event.witnessDetails, []);

  witnesses.push({
    name: data.witnessName,
    address: data.witnessAddress,
    occupation: data.witnessOccupation,
    capturedAt: new Date().toISOString()
  });

  const updated = await prisma.signatureEvent.update({
    where: { id: data.eventId },
    data: { witnessDetails: encode(witnesses) }
  });

  await audit({
    tenantId: event.tenantId,
    matterId: event.matterId,
    actorUserId: data.actorUserId,
    actorRole: "qualified_professional",
    eventType: "signing.witness_captured",
    entityType: "SignatureEvent",
    entityId: event.id,
    metadata: { witnessName: data.witnessName, requirementRefs: ["FR-030"] }
  });

  return updated;
}

export async function revokeDocument(input: unknown) {
  const data = revokeDocumentSchema.parse(input);
  const document = await prisma.document.findUniqueOrThrow({ where: { id: data.documentId } });

  const revoked = await prisma.document.update({
    where: { id: data.documentId },
    data: { status: "revoked", revokedAt: new Date(), executionStatus: "revoked" }
  });

  await audit({
    tenantId: document.tenantId,
    matterId: document.matterId,
    actorUserId: data.actorUserId,
    actorRole: "qualified_professional",
    eventType: "document.revoked",
    entityType: "Document",
    entityId: document.id,
    metadata: { reason: data.reason, requirementRefs: ["FR-030"] }
  });

  return revoked;
}
