import { describe, expect, it } from "vitest";
import { transitionSigningCeremony, captureWitnessDetails, revokeDocument } from "../server/services/signingService";
import { checkESignatureStatus } from "../server/services/esignatureService";
import { prisma } from "../server/db";

describe("FR-030: Signing ceremony workflow", () => {
  it("transitions signing ceremony through state machine", async () => {
    const doc = await prisma.document.findFirst({ where: { status: "finalized" } });
    if (!doc) return;

    const event = await prisma.signatureEvent.create({
      data: {
        tenantId: doc.tenantId,
        matterId: doc.matterId,
        documentId: doc.id,
        status: "scheduled",
        ceremonyType: "wet_ink"
      }
    });

    // scheduled → in_progress
    const inProgress = await transitionSigningCeremony({
      eventId: event.id,
      targetStatus: "in_progress",
      actorUserId: "user-solicitor"
    });
    expect(inProgress.status).toBe("in_progress");

    // in_progress → witnessed
    const witnessed = await transitionSigningCeremony({
      eventId: event.id,
      targetStatus: "witnessed",
      actorUserId: "user-solicitor"
    });
    expect(witnessed.status).toBe("witnessed");

    // witnessed → completed
    const completed = await transitionSigningCeremony({
      eventId: event.id,
      targetStatus: "completed",
      actorUserId: "user-solicitor"
    });
    expect(completed.status).toBe("completed");
    expect(completed.occurredAt).toBeTruthy();
  });

  it("rejects invalid state transitions", async () => {
    const doc = await prisma.document.findFirst();
    if (!doc) return;

    const event = await prisma.signatureEvent.create({
      data: {
        tenantId: doc.tenantId,
        matterId: doc.matterId,
        documentId: doc.id,
        status: "scheduled",
        ceremonyType: "wet_ink"
      }
    });

    // scheduled → completed (invalid, must go through in_progress)
    await expect(
      transitionSigningCeremony({ eventId: event.id, targetStatus: "completed", actorUserId: "user-solicitor" })
    ).rejects.toThrow(/cannot transition/i);
  });

  it("captures witness details", async () => {
    const doc = await prisma.document.findFirst();
    if (!doc) return;

    const event = await prisma.signatureEvent.create({
      data: {
        tenantId: doc.tenantId,
        matterId: doc.matterId,
        documentId: doc.id,
        status: "in_progress",
        ceremonyType: "wet_ink"
      }
    });

    const updated = await captureWitnessDetails({
      eventId: event.id,
      witnessName: "Jane Smith",
      witnessAddress: "10 Downing Street, London",
      witnessOccupation: "Solicitor",
      actorUserId: "user-solicitor"
    });

    expect(updated.witnessDetails).toBeTruthy();
    const witnesses = JSON.parse(updated.witnessDetails!);
    expect(witnesses.length).toBe(1);
    expect(witnesses[0].name).toBe("Jane Smith");
  });

  it("revokes a document with reason", async () => {
    const doc = await prisma.document.create({
      data: {
        tenantId: "tenant-demo",
        matterId: "matter-demo-ew-pt",
        documentType: "will",
        jurisdictionCode: "EW",
        locale: "en-GB",
        title: "Test Will for Revocation",
        content: "Test will for revocation",
        hash: "abc12345",
        status: "finalized",
        version: "1",
        sensitivityClass: "confidential",
        reviewStatus: "approved",
        executionStatus: "pending"
      }
    });

    const revoked = await revokeDocument({
      documentId: doc.id,
      reason: "Client requested revocation after change of circumstances",
      actorUserId: "user-solicitor"
    });

    expect(revoked.status).toBe("revoked");
    expect(revoked.revokedAt).toBeTruthy();
    expect(revoked.executionStatus).toBe("revoked");
  });
});

describe("FR-031: E-signature status checking", () => {
  it("checks e-signature status for a document", async () => {
    const doc = await prisma.document.findFirst();
    if (!doc) return;

    const status = await checkESignatureStatus(doc.id);
    expect(status.documentId).toBe(doc.id);
    expect(typeof status.eSignatureComplete).toBe("boolean");
    expect(status.executionStatus).toBeDefined();
  });
});
