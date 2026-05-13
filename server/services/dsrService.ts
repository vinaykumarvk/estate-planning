import { prisma } from "../db";
import { createDsrSchema } from "../../shared/schemas";
import type { DsrAccessBundle, DsrDeletionResult } from "../../shared/types";
import { audit } from "./auditService";

export async function createDsr(input: unknown) {
  const data = createDsrSchema.parse(input);
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + 30);

  const dsr = await prisma.dataSubjectRequest.create({
    data: {
      tenantId: data.tenantId,
      personId: data.personId,
      requestType: data.requestType,
      legalBasis: data.legalBasis,
      status: "pending",
      dueAt
    }
  });

  await audit({
    tenantId: data.tenantId,
    actorRole: "system",
    eventType: "dsr.created",
    entityType: "DataSubjectRequest",
    entityId: dsr.id,
    metadata: { requestType: data.requestType, dueAt: dueAt.toISOString(), requirementRefs: ["CR-010", "SEC-007", "NFR-011"] }
  });

  return dsr;
}

export async function processDsrAccess(dsrId: string): Promise<DsrAccessBundle> {
  const dsr = await prisma.dataSubjectRequest.findUniqueOrThrow({ where: { id: dsrId } });

  if (!dsr.personId) {
    throw new Error("DSR has no associated person");
  }

  const [person, matters, consents, auditEvents] = await Promise.all([
    prisma.person.findUnique({ where: { id: dsr.personId } }),
    prisma.matter.findMany({ where: { tenantId: dsr.tenantId } }),
    prisma.consent.findMany({ where: { tenantId: dsr.tenantId, personId: dsr.personId } }),
    prisma.auditEvent.findMany({ where: { tenantId: dsr.tenantId }, take: 100, orderBy: { createdAt: "desc" } })
  ]);

  await prisma.dataSubjectRequest.update({
    where: { id: dsrId },
    data: { status: "completed", completedAt: new Date() }
  });

  await audit({
    tenantId: dsr.tenantId,
    actorRole: "system",
    eventType: "dsr.access_processed",
    entityType: "DataSubjectRequest",
    entityId: dsrId,
    metadata: { requirementRefs: ["CR-010", "SEC-007"] }
  });

  return {
    dsrId,
    personId: dsr.personId,
    exportedAt: new Date().toISOString(),
    data: { person, matters, consents, auditEvents }
  };
}

export async function processDsrDeletion(dsrId: string): Promise<DsrDeletionResult> {
  const dsr = await prisma.dataSubjectRequest.findUniqueOrThrow({ where: { id: dsrId } });

  if (!dsr.personId) {
    throw new Error("DSR has no associated person");
  }

  // Check for legal holds
  const openMatters = await prisma.matter.findMany({
    where: { tenantId: dsr.tenantId, status: { in: ["review", "execution"] } }
  });
  const hasLegalHold = openMatters.length > 0;

  if (hasLegalHold) {
    await prisma.dataSubjectRequest.update({
      where: { id: dsrId },
      data: { status: "legal_hold" }
    });

    await audit({
      tenantId: dsr.tenantId,
      actorRole: "system",
      eventType: "dsr.deletion_blocked",
      entityType: "DataSubjectRequest",
      entityId: dsrId,
      metadata: { reason: "legal_hold", requirementRefs: ["CR-010", "SEC-007"] }
    });

    return {
      dsrId,
      personId: dsr.personId,
      anonymizedFields: [],
      legalHoldPrevented: true
    };
  }

  // Anonymize person data
  const anonymizedFields = ["legalName", "email", "phone", "dateOfBirth", "nationality", "residenceCountry"];
  await prisma.person.update({
    where: { id: dsr.personId },
    data: {
      legalName: "[REDACTED]",
      preferredName: null,
      email: null,
      phone: null,
      dateOfBirth: null,
      nationality: null,
      residenceCountry: null,
      domicileCountry: null,
      habitualResidence: null,
      taxResidency: null
    }
  });

  await prisma.dataSubjectRequest.update({
    where: { id: dsrId },
    data: { status: "completed", completedAt: new Date() }
  });

  await audit({
    tenantId: dsr.tenantId,
    actorRole: "system",
    eventType: "dsr.deletion_processed",
    entityType: "DataSubjectRequest",
    entityId: dsrId,
    metadata: { anonymizedFields, requirementRefs: ["CR-010", "SEC-007", "NFR-011"] }
  });

  return {
    dsrId,
    personId: dsr.personId,
    anonymizedFields,
    legalHoldPrevented: false
  };
}

export async function getDsrStatus(dsrId: string) {
  return prisma.dataSubjectRequest.findUniqueOrThrow({ where: { id: dsrId } });
}

export async function listDsrs(tenantId: string) {
  return prisma.dataSubjectRequest.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });
}
