import { prisma } from "../db";
import {
  createCrossBorderTaxPositionSchema,
  createEstateCashFlowItemSchema,
  createEstateReliefAssessmentSchema,
  createEstateTrustStructureSchema,
  createIncapacityInstrumentSchema,
  createOutsideEstateNominationSchema,
  createProtectionPolicySchema,
  updateCrossBorderTaxPositionSchema,
  updateEstateCashFlowItemSchema,
  updateEstateReliefAssessmentSchema,
  updateEstateTrustStructureSchema,
  updateIncapacityInstrumentSchema,
  updateOutsideEstateNominationSchema,
  updateProtectionPolicySchema
} from "../../shared/schemas";
import { decode, encode } from "./json";

export type CoreEstateDataset =
  | "cash-flow"
  | "protection-policies"
  | "trusts"
  | "incapacity-instruments"
  | "tax-positions"
  | "relief-assessments"
  | "outside-estate-nominations";

export async function listCoreEstateData(kind: CoreEstateDataset, matterId: string, tenantId: string) {
  switch (kind) {
    case "cash-flow":
      return (await prisma.estateCashFlowItem.findMany({ where: activeWhere(matterId, tenantId), orderBy: { updatedAt: "desc" } }))
        .map(decodeEvidenceRefs);
    case "protection-policies":
      return (await prisma.protectionPolicy.findMany({ where: activeWhere(matterId, tenantId), orderBy: { updatedAt: "desc" } }))
        .map(decodeEvidenceRefs);
    case "trusts":
      return (await prisma.estateTrustStructure.findMany({ where: activeWhere(matterId, tenantId), orderBy: { updatedAt: "desc" } }))
        .map((record) => ({
          ...decodeEvidenceRefs(record),
          trusteePersonIds: decode<string[]>(record.trusteePersonIds, []),
          beneficiaryPersonIds: decode<string[]>(record.beneficiaryPersonIds, []),
          linkedAssetIds: decode<string[]>(record.linkedAssetIds, [])
        }));
    case "incapacity-instruments":
      return (await prisma.incapacityInstrument.findMany({ where: activeWhere(matterId, tenantId), orderBy: { updatedAt: "desc" } }))
        .map((record) => ({
          ...decodeEvidenceRefs(record),
          attorneyPersonIds: decode<string[]>(record.attorneyPersonIds, []),
          substituteAttorneyPersonIds: decode<string[]>(record.substituteAttorneyPersonIds, [])
        }));
    case "tax-positions":
      return (await prisma.crossBorderTaxPosition.findMany({ where: activeWhere(matterId, tenantId), orderBy: { updatedAt: "desc" } }))
        .map(decodeEvidenceRefs);
    case "relief-assessments":
      return (await prisma.estateReliefAssessment.findMany({ where: activeWhere(matterId, tenantId), orderBy: { updatedAt: "desc" } }))
        .map((record) => ({
          ...decodeEvidenceRefs(record),
          payload: decode<Record<string, unknown>>(record.payload, {})
        }));
    case "outside-estate-nominations":
      return (await prisma.outsideEstateNomination.findMany({ where: activeWhere(matterId, tenantId), orderBy: { updatedAt: "desc" } }))
        .map(decodeEvidenceRefs);
  }
}

export async function createCoreEstateData(kind: CoreEstateDataset, matterId: string, tenantId: string, input: unknown) {
  switch (kind) {
    case "cash-flow": {
      const data = createEstateCashFlowItemSchema.parse({ ...(input as object), matterId, tenantId });
      return decodeEvidenceRefs(await prisma.estateCashFlowItem.create({ data: { ...data, evidenceRefs: encode(data.evidenceRefs) } }));
    }
    case "protection-policies": {
      const data = createProtectionPolicySchema.parse({ ...(input as object), matterId, tenantId });
      return decodeEvidenceRefs(await prisma.protectionPolicy.create({ data: { ...data, evidenceRefs: encode(data.evidenceRefs) } }));
    }
    case "trusts": {
      const data = createEstateTrustStructureSchema.parse({ ...(input as object), matterId, tenantId });
      const record = await prisma.estateTrustStructure.create({
        data: {
          ...data,
          trusteePersonIds: encode(data.trusteePersonIds),
          beneficiaryPersonIds: encode(data.beneficiaryPersonIds),
          linkedAssetIds: encode(data.linkedAssetIds),
          evidenceRefs: encode(data.evidenceRefs)
        }
      });
      return listCoreEstateRecord(kind, record.id, tenantId);
    }
    case "incapacity-instruments": {
      const data = createIncapacityInstrumentSchema.parse({ ...(input as object), matterId, tenantId });
      const record = await prisma.incapacityInstrument.create({
        data: {
          ...data,
          attorneyPersonIds: encode(data.attorneyPersonIds),
          substituteAttorneyPersonIds: encode(data.substituteAttorneyPersonIds),
          evidenceRefs: encode(data.evidenceRefs)
        }
      });
      return listCoreEstateRecord(kind, record.id, tenantId);
    }
    case "tax-positions": {
      const data = createCrossBorderTaxPositionSchema.parse({ ...(input as object), matterId, tenantId });
      return decodeEvidenceRefs(await prisma.crossBorderTaxPosition.create({ data: { ...data, evidenceRefs: encode(data.evidenceRefs) } }));
    }
    case "relief-assessments": {
      const data = createEstateReliefAssessmentSchema.parse({ ...(input as object), matterId, tenantId });
      const record = await prisma.estateReliefAssessment.create({
        data: { ...data, payload: encode(data.payload), evidenceRefs: encode(data.evidenceRefs) }
      });
      return { ...decodeEvidenceRefs(record), payload: decode<Record<string, unknown>>(record.payload, {}) };
    }
    case "outside-estate-nominations": {
      const data = createOutsideEstateNominationSchema.parse({ ...(input as object), matterId, tenantId });
      return decodeEvidenceRefs(await prisma.outsideEstateNomination.create({ data: { ...data, evidenceRefs: encode(data.evidenceRefs) } }));
    }
  }
}

export async function updateCoreEstateData(kind: CoreEstateDataset, id: string, tenantId: string, input: unknown) {
  await assertCoreEstateRecord(kind, id, tenantId);
  switch (kind) {
    case "cash-flow": {
      const data = updateEstateCashFlowItemSchema.parse(input);
      return decodeEvidenceRefs(await prisma.estateCashFlowItem.update({ where: { id }, data: encodeEvidencePatch(data) }));
    }
    case "protection-policies": {
      const data = updateProtectionPolicySchema.parse(input);
      return decodeEvidenceRefs(await prisma.protectionPolicy.update({ where: { id }, data: encodeEvidencePatch(data) }));
    }
    case "trusts": {
      const data = updateEstateTrustStructureSchema.parse(input);
      const { trusteePersonIds, beneficiaryPersonIds, linkedAssetIds, ...scalarData } = data;
      await prisma.estateTrustStructure.update({
        where: { id },
        data: {
          ...encodeEvidencePatch(scalarData),
          ...(trusteePersonIds !== undefined ? { trusteePersonIds: encode(trusteePersonIds) } : {}),
          ...(beneficiaryPersonIds !== undefined ? { beneficiaryPersonIds: encode(beneficiaryPersonIds) } : {}),
          ...(linkedAssetIds !== undefined ? { linkedAssetIds: encode(linkedAssetIds) } : {})
        }
      });
      return listCoreEstateRecord(kind, id, tenantId);
    }
    case "incapacity-instruments": {
      const data = updateIncapacityInstrumentSchema.parse(input);
      const { attorneyPersonIds, substituteAttorneyPersonIds, ...scalarData } = data;
      await prisma.incapacityInstrument.update({
        where: { id },
        data: {
          ...encodeEvidencePatch(scalarData),
          ...(attorneyPersonIds !== undefined ? { attorneyPersonIds: encode(attorneyPersonIds) } : {}),
          ...(substituteAttorneyPersonIds !== undefined ? { substituteAttorneyPersonIds: encode(substituteAttorneyPersonIds) } : {})
        }
      });
      return listCoreEstateRecord(kind, id, tenantId);
    }
    case "tax-positions": {
      const data = updateCrossBorderTaxPositionSchema.parse(input);
      return decodeEvidenceRefs(await prisma.crossBorderTaxPosition.update({ where: { id }, data: encodeEvidencePatch(data) }));
    }
    case "relief-assessments": {
      const data = updateEstateReliefAssessmentSchema.parse(input);
      const record = await prisma.estateReliefAssessment.update({
        where: { id },
        data: { ...encodeEvidencePatch(data), ...(data.payload ? { payload: encode(data.payload) } : {}) }
      });
      return { ...decodeEvidenceRefs(record), payload: decode<Record<string, unknown>>(record.payload, {}) };
    }
    case "outside-estate-nominations": {
      const data = updateOutsideEstateNominationSchema.parse(input);
      return decodeEvidenceRefs(await prisma.outsideEstateNomination.update({ where: { id }, data: encodeEvidencePatch(data) }));
    }
  }
}

export async function archiveCoreEstateData(kind: CoreEstateDataset, id: string, tenantId: string) {
  return updateCoreEstateData(kind, id, tenantId, { status: "archived" });
}

async function listCoreEstateRecord(kind: CoreEstateDataset, id: string, tenantId: string) {
  switch (kind) {
    case "cash-flow":
      return decodeEvidenceRefs(await prisma.estateCashFlowItem.findFirstOrThrow({ where: { id, tenantId } }));
    case "protection-policies":
      return decodeEvidenceRefs(await prisma.protectionPolicy.findFirstOrThrow({ where: { id, tenantId } }));
    case "trusts": {
      const record = await prisma.estateTrustStructure.findFirstOrThrow({ where: { id, tenantId } });
      return {
        ...decodeEvidenceRefs(record),
        trusteePersonIds: decode<string[]>(record.trusteePersonIds, []),
        beneficiaryPersonIds: decode<string[]>(record.beneficiaryPersonIds, []),
        linkedAssetIds: decode<string[]>(record.linkedAssetIds, [])
      };
    }
    case "incapacity-instruments": {
      const record = await prisma.incapacityInstrument.findFirstOrThrow({ where: { id, tenantId } });
      return {
        ...decodeEvidenceRefs(record),
        attorneyPersonIds: decode<string[]>(record.attorneyPersonIds, []),
        substituteAttorneyPersonIds: decode<string[]>(record.substituteAttorneyPersonIds, [])
      };
    }
    case "tax-positions":
      return decodeEvidenceRefs(await prisma.crossBorderTaxPosition.findFirstOrThrow({ where: { id, tenantId } }));
    case "relief-assessments": {
      const record = await prisma.estateReliefAssessment.findFirstOrThrow({ where: { id, tenantId } });
      return { ...decodeEvidenceRefs(record), payload: decode<Record<string, unknown>>(record.payload, {}) };
    }
    case "outside-estate-nominations":
      return decodeEvidenceRefs(await prisma.outsideEstateNomination.findFirstOrThrow({ where: { id, tenantId } }));
  }
}

async function assertCoreEstateRecord(kind: CoreEstateDataset, id: string, tenantId: string) {
  const exists = await countCoreEstateRecords(kind, id, tenantId);
  if (exists === 0) throw new Error("Core estate record not found");
}

async function countCoreEstateRecords(kind: CoreEstateDataset, id: string, tenantId: string) {
  switch (kind) {
    case "cash-flow": return prisma.estateCashFlowItem.count({ where: { id, tenantId } });
    case "protection-policies": return prisma.protectionPolicy.count({ where: { id, tenantId } });
    case "trusts": return prisma.estateTrustStructure.count({ where: { id, tenantId } });
    case "incapacity-instruments": return prisma.incapacityInstrument.count({ where: { id, tenantId } });
    case "tax-positions": return prisma.crossBorderTaxPosition.count({ where: { id, tenantId } });
    case "relief-assessments": return prisma.estateReliefAssessment.count({ where: { id, tenantId } });
    case "outside-estate-nominations": return prisma.outsideEstateNomination.count({ where: { id, tenantId } });
  }
}

function activeWhere(matterId: string, tenantId: string) {
  return { matterId, tenantId, status: { not: "archived" } };
}

function decodeEvidenceRefs<T extends { evidenceRefs: string }>(record: T): Omit<T, "evidenceRefs"> & { evidenceRefs: string[] } {
  return { ...record, evidenceRefs: decode<string[]>(record.evidenceRefs, []) };
}

function encodeEvidencePatch<T extends { evidenceRefs?: string[] }>(data: T): Omit<T, "evidenceRefs"> & { evidenceRefs?: string } {
  const { evidenceRefs, ...rest } = data;
  return {
    ...rest,
    ...(evidenceRefs ? { evidenceRefs: encode(evidenceRefs) } : {})
  };
}
