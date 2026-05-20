import { prisma } from "../db";
import { createDomicileRecordSchema, updateDomicileRecordSchema } from "../../shared/schemas";
import { audit } from "./auditService";
import type { DomicileRecord as PrismaDomicileRecord } from "@prisma/client";
import type { DomicileRecord, SnapBackRiskAssessment } from "../../shared/types";

function toRecord(row: PrismaDomicileRecord): DomicileRecord {
  return {
    id: row.id,
    personId: row.personId,
    domicileOfOrigin: row.domicileOfOrigin,
    domicileOfChoice: row.domicileOfChoice,
    domicileOfDependency: row.domicileOfDependency,
    dateEstablished: row.dateEstablished,
    evidenceSummary: row.evidenceSummary,
    snapBackRisk: row.snapBackRisk,
    snapBackReason: row.snapBackReason,
  };
}

export async function createDomicileRecord(input: unknown) {
  const data = createDomicileRecordSchema.parse(input);
  const record = await prisma.domicileRecord.create({
    data: {
      tenantId: data.tenantId,
      personId: data.personId,
      domicileOfOrigin: data.domicileOfOrigin,
      domicileOfChoice: data.domicileOfChoice,
      domicileOfDependency: data.domicileOfDependency,
      dateEstablished: data.dateEstablished,
      evidenceSummary: data.evidenceSummary,
    },
  });

  await audit({
    tenantId: data.tenantId,
    actorRole: "professional",
    eventType: "domicile_record.created",
    entityType: "DomicileRecord",
    entityId: record.id,
    metadata: { requirementRefs: ["ADD-064"] },
  });

  return toRecord(record);
}

export async function getDomicileRecords(personId: string, tenantId: string): Promise<DomicileRecord[]> {
  const rows = await prisma.domicileRecord.findMany({
    where: { personId, tenantId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toRecord);
}

export async function updateDomicileRecord(recordId: string, tenantId: string, input: unknown) {
  const data = updateDomicileRecordSchema.parse(input);

  // Verify ownership before updating
  const existing = await prisma.domicileRecord.findFirst({ where: { id: recordId, tenantId } });
  if (!existing) throw new Error("Domicile record not found or access denied");

  const record = await prisma.domicileRecord.update({
    where: { id: recordId },
    data,
  });

  await audit({
    tenantId: record.tenantId,
    actorRole: "professional",
    eventType: "domicile_record.updated",
    entityType: "DomicileRecord",
    entityId: record.id,
    metadata: { requirementRefs: ["ADD-064"] },
  });

  return toRecord(record);
}

/**
 * Assess snap-back risk for a person.
 *
 * Snap-back risk exists when:
 * 1. The person has a domicileOfOrigin different from their domicileOfChoice or domicileCountry, AND
 * 2. The person's current country (residenceCountry) differs from their domicileOfOrigin
 *
 * This reflects the common law doctrine where a domicile of origin can "snap back"
 * if the domicile of choice is abandoned without acquiring a new one.
 */
export async function assessSnapBackRisk(personId: string, tenantId: string): Promise<SnapBackRiskAssessment> {
  const person = await prisma.person.findFirstOrThrow({ where: { id: personId, tenantId } });
  const domicileRecords = await prisma.domicileRecord.findMany({
    where: { personId, tenantId },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  const latestDomicile = domicileRecords[0];
  const domicileOfOrigin = latestDomicile?.domicileOfOrigin ?? person.domicileOfOrigin;
  const domicileOfChoice = latestDomicile?.domicileOfChoice ?? person.domicileCountry;
  const currentCountry = person.residenceCountry ?? person.domicileCountry;

  let snapBackRisk = false;
  let reason = "No snap-back risk identified.";
  let recommendation = "No action required.";

  if (
    domicileOfOrigin &&
    domicileOfChoice &&
    domicileOfOrigin !== domicileOfChoice &&
    currentCountry &&
    currentCountry !== domicileOfOrigin
  ) {
    snapBackRisk = true;
    reason = `Person has domicile of origin (${domicileOfOrigin}) different from domicile of choice (${domicileOfChoice}), and currently resides in ${currentCountry}. If the domicile of choice is abandoned, the domicile of origin may snap back.`;
    recommendation = `Review evidence of intention to permanently reside in ${domicileOfChoice}. Consider obtaining a domicile declaration or statutory declaration to mitigate snap-back risk.`;
  }

  // Update the latest domicile record if it exists
  if (latestDomicile) {
    await prisma.domicileRecord.update({
      where: { id: latestDomicile.id },
      data: { snapBackRisk, snapBackReason: snapBackRisk ? reason : null },
    });
  }

  return {
    personId,
    snapBackRisk,
    reason,
    recommendation,
  };
}

/**
 * Return a structured domicile summary for a person.
 */
export async function getDomicileSummary(personId: string, tenantId: string) {
  const person = await prisma.person.findFirstOrThrow({ where: { id: personId, tenantId } });
  const records = await getDomicileRecords(personId, tenantId);
  const riskAssessment = await assessSnapBackRisk(personId, tenantId);

  return {
    personId,
    personName: person.legalName,
    domicileOfOrigin: person.domicileOfOrigin,
    domicileCountry: person.domicileCountry,
    residenceCountry: person.residenceCountry,
    records,
    snapBackRiskAssessment: riskAssessment,
  };
}
