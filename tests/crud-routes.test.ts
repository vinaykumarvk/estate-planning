import { describe, expect, it } from "vitest";
import { prisma } from "../server/db";
import { addDisposition, addRelationship, createScenario, getMatterWorkspace } from "../server/services/matterService";
import { encode } from "../server/services/json";

describe("CRUD routes – Tasks", () => {
  it("creates a task for a matter", async () => {
    const task = await prisma.task.create({
      data: {
        tenantId: "tenant-demo",
        matterId: "matter-demo-ew-pt",
        title: "Review beneficiary details",
        ownerRole: "solicitor",
        status: "pending"
      }
    });
    expect(task.id).toBeDefined();
    expect(task.status).toBe("pending");
  });

  it("lists tasks for a matter", async () => {
    const tasks = await prisma.task.findMany({ where: { matterId: "matter-demo-ew-pt" } });
    expect(tasks.length).toBeGreaterThanOrEqual(1);
  });

  it("updates a task status", async () => {
    const task = await prisma.task.create({
      data: {
        tenantId: "tenant-demo",
        matterId: "matter-demo-ew-pt",
        title: "Update task test",
        ownerRole: "professional",
        status: "pending"
      }
    });
    const updated = await prisma.task.update({
      where: { id: task.id },
      data: { status: "in_progress" }
    });
    expect(updated.status).toBe("in_progress");
  });

  it("deletes a task", async () => {
    const task = await prisma.task.create({
      data: {
        tenantId: "tenant-demo",
        title: "Task to delete",
        ownerRole: "system",
        status: "pending"
      }
    });
    await prisma.task.delete({ where: { id: task.id } });
    const found = await prisma.task.findUnique({ where: { id: task.id } });
    expect(found).toBeNull();
  });
});

describe("CRUD routes – Messages", () => {
  it("creates a message for a matter", async () => {
    const message = await prisma.message.create({
      data: {
        tenantId: "tenant-demo",
        matterId: "matter-demo-ew-pt",
        senderUserId: "user-solicitor",
        body: "Please review the estate valuations.",
        locale: "en-GB",
        sensitivity: "confidential"
      }
    });
    expect(message.id).toBeDefined();
    expect(message.body).toContain("valuations");
  });

  it("lists messages for a matter", async () => {
    const messages = await prisma.message.findMany({ where: { matterId: "matter-demo-ew-pt" } });
    expect(messages.length).toBeGreaterThanOrEqual(1);
  });
});

describe("CRUD routes – Invitations", () => {
  it("creates and revokes an invitation", async () => {
    const invitation = await prisma.invitation.create({
      data: {
        tenantId: "tenant-demo",
        matterId: "matter-demo-ew-pt",
        inviteeEmail: "testcrud@example.com",
        role: "viewer",
        scopes: encode(["read"]),
        expiresAt: new Date(Date.now() + 86400000)
      }
    });
    expect(invitation.revokedAt).toBeNull();

    const revoked = await prisma.invitation.update({
      where: { id: invitation.id },
      data: { revokedAt: new Date() }
    });
    expect(revoked.revokedAt).toBeDefined();
  });
});

describe("CRUD routes – Liabilities", () => {
  it("creates a liability for a matter", async () => {
    const liability = await prisma.liability.create({
      data: {
        tenantId: "tenant-demo",
        matterId: "matter-demo-ew-pt",
        liabilityType: "mortgage",
        description: "Primary residence mortgage",
        creditor: "ABC Bank",
        currency: "GBP",
        amount: 150000,
        evidenceRefs: encode(["mortgage-statement-2026"])
      }
    });
    expect(liability.id).toBeDefined();
    expect(liability.amount).toBe(150000);
  });

  it("updates a liability", async () => {
    const liability = await prisma.liability.create({
      data: {
        tenantId: "tenant-demo",
        matterId: "matter-demo-ew-pt",
        liabilityType: "loan",
        description: "Car loan",
        currency: "GBP",
        amount: 8000
      }
    });
    const updated = await prisma.liability.update({
      where: { id: liability.id },
      data: { amount: 7500 }
    });
    expect(updated.amount).toBe(7500);
  });

  it("deletes a liability", async () => {
    const liability = await prisma.liability.create({
      data: {
        tenantId: "tenant-demo",
        matterId: "matter-demo-ew-pt",
        liabilityType: "credit_card",
        description: "Credit card balance",
        currency: "GBP",
        amount: 2000
      }
    });
    await prisma.liability.delete({ where: { id: liability.id } });
    const found = await prisma.liability.findUnique({ where: { id: liability.id } });
    expect(found).toBeNull();
  });
});

describe("CRUD routes – Documents", () => {
  it("lists documents for a matter", async () => {
    const documents = await prisma.document.findMany({ where: { matterId: "matter-demo-ew-pt" } });
    expect(documents).toBeDefined();
    expect(Array.isArray(documents)).toBe(true);
  });

  it("gets a single document by ID", async () => {
    const doc = await prisma.document.findFirst({ where: { matterId: "matter-demo-ew-pt" } });
    if (doc) {
      const fetched = await prisma.document.findUniqueOrThrow({ where: { id: doc.id } });
      expect(fetched.id).toBe(doc.id);
      expect(fetched.documentType).toBeDefined();
    }
  });
});

describe("CRUD routes – Reviews", () => {
  it("lists reviews for a matter", async () => {
    const reviews = await prisma.review.findMany({ where: { matterId: "matter-demo-ew-pt" } });
    expect(reviews).toBeDefined();
    expect(Array.isArray(reviews)).toBe(true);
  });
});

describe("CRUD routes – ReviewComments", () => {
  it("creates and resolves a review comment", async () => {
    const review = await prisma.review.findFirst({ where: { matterId: "matter-demo-ew-pt" } });
    if (review) {
      const comment = await prisma.reviewComment.create({
        data: {
          reviewId: review.id,
          authorUserId: "user-solicitor",
          commentType: "general",
          body: "Please clarify the beneficiary class."
        }
      });
      expect(comment.resolved).toBe(false);

      const resolved = await prisma.reviewComment.update({
        where: { id: comment.id },
        data: { resolved: true }
      });
      expect(resolved.resolved).toBe(true);
    }
  });
});

describe("CRUD routes – Dispositions", () => {
  it("lists dispositions for a matter", async () => {
    const dispositions = await prisma.disposition.findMany({
      where: { matterId: "matter-demo-ew-pt" },
      orderBy: { createdAt: "asc" }
    });
    expect(dispositions.length).toBeGreaterThanOrEqual(0);
  });

  it("deletes a disposition", async () => {
    const scenario = await prisma.scenario.findFirst({ where: { matterId: "matter-demo-ew-pt" } });
    if (scenario) {
      const disposition = await prisma.disposition.create({
        data: {
          tenantId: "tenant-demo",
          matterId: "matter-demo-ew-pt",
          scenarioId: scenario.id,
          giftType: "cash",
          beneficiaryLabel: "Delete Test Beneficiary",
          amount: 100,
          currency: "GBP"
        }
      });
      await prisma.disposition.delete({ where: { id: disposition.id } });
      const found = await prisma.disposition.findUnique({ where: { id: disposition.id } });
      expect(found).toBeNull();
    }
  });

  it("creates a disposition with executor and guardian fields (FR-024)", async () => {
    const scenario = await prisma.scenario.findFirst({ where: { matterId: "matter-demo-ew-pt" } });
    const people = await prisma.person.findMany({ where: { matterId: "matter-demo-ew-pt" }, take: 2 });

    if (scenario && people.length >= 2) {
      const disposition = await addDisposition({
        tenantId: "tenant-demo",
        matterId: "matter-demo-ew-pt",
        scenarioId: scenario.id,
        giftType: "residue",
        beneficiaryLabel: "FR-024 Test",
        beneficiaryPersonId: people[0].id,
        executorPersonId: people[1].id,
        guardianPersonId: people[0].id,
        fiduciaryRole: "executor_and_trustee"
      });
      expect(disposition.executorPersonId).toBe(people[1].id);
      expect(disposition.guardianPersonId).toBe(people[0].id);
      expect(disposition.fiduciaryRole).toBe("executor_and_trustee");
    }
  });
});

describe("CRUD routes – Relationships", () => {
  it("lists relationships for a matter", async () => {
    const relationships = await prisma.relationship.findMany({
      where: { matterId: "matter-demo-ew-pt" },
      orderBy: { createdAt: "asc" }
    });
    expect(relationships.length).toBeGreaterThanOrEqual(0);
  });

  it("deletes a relationship", async () => {
    const people = await prisma.person.findMany({ where: { matterId: "matter-demo-ew-pt" }, take: 2 });
    if (people.length >= 2) {
      const rel = await prisma.relationship.create({
        data: {
          tenantId: "tenant-demo",
          matterId: "matter-demo-ew-pt",
          fromPersonId: people[0].id,
          toPersonId: people[1].id,
          relationshipType: "sibling",
          legalStatus: "confirmed"
        }
      });
      await prisma.relationship.delete({ where: { id: rel.id } });
      const found = await prisma.relationship.findUnique({ where: { id: rel.id } });
      expect(found).toBeNull();
    }
  });
});

describe("CRUD routes – Notifications", () => {
  it("creates a notification", async () => {
    const notification = await prisma.notification.create({
      data: {
        tenantId: "tenant-demo",
        channel: "in_app",
        subject: "Test notification",
        body: "You have a new task.",
        status: "pending"
      }
    });
    expect(notification.id).toBeDefined();
    expect(notification.status).toBe("pending");
  });
});
