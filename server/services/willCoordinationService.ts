import { prisma } from "../db";
import { createWillCoordinationSchema, updateWillCoordinationSchema } from "../../shared/schemas";
import { decode, encode } from "./json";
import { audit } from "./auditService";
import type { WillCoordination } from "@prisma/client";
import type { WillStatus } from "../../shared/types";
import type { RevocationConflict, WillCoordinationRecord, WillCoordinationSummary } from "../../shared/types";

/** Country code → jurisdiction code mapping for situs matching */
const COUNTRY_TO_JURISDICTION: Record<string, string> = {
  GB: "EW",
  UK: "EW",
  NG: "NG",
  GH: "GH",
  ZA: "ZA",
  KE: "KE",
  SN: "SN",
  CM: "CM",
  MZ: "MZ",
  AO: "AO",
  EW: "EW",
  PT: "PT",
};

function mapSitusToJurisdiction(situsCountry: string): string {
  return COUNTRY_TO_JURISDICTION[situsCountry] ?? situsCountry;
}

function toRecord(row: WillCoordination): WillCoordinationRecord {
  return {
    id: row.id,
    matterId: row.matterId,
    jurisdictionCode: row.jurisdictionCode,
    documentType: row.documentType,
    documentId: row.documentId,
    dateExecuted: row.dateExecuted,
    solicitorNotary: row.solicitorNotary,
    status: row.status as WillStatus,
    revocationClause: row.revocationClause,
    assetIds: decode<string[]>(row.assetIds, []),
    notes: row.notes,
  };
}

export async function addWillRecord(input: unknown) {
  const data = createWillCoordinationSchema.parse(input);
  const will = await prisma.willCoordination.create({
    data: {
      tenantId: data.tenantId,
      matterId: data.matterId,
      jurisdictionCode: data.jurisdictionCode,
      documentType: data.documentType,
      documentId: data.documentId,
      dateExecuted: data.dateExecuted,
      solicitorNotary: data.solicitorNotary,
      status: data.status,
      revocationClause: data.revocationClause,
      assetIds: encode(data.assetIds),
      notes: data.notes,
    },
  });

  await audit({
    tenantId: data.tenantId,
    matterId: data.matterId,
    actorRole: "professional",
    eventType: "will_coordination.created",
    entityType: "WillCoordination",
    entityId: will.id,
    metadata: { requirementRefs: ["ADD-054", "ADD-055"] },
  });

  return toRecord(will);
}

export async function getWillRecords(matterId: string, tenantId: string): Promise<WillCoordinationRecord[]> {
  const rows = await prisma.willCoordination.findMany({
    where: { matterId, tenantId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toRecord);
}

export async function updateWillRecord(willId: string, tenantId: string, input: unknown) {
  const data = updateWillCoordinationSchema.parse(input);
  const updateData: Record<string, unknown> = { ...data };
  if (data.assetIds) {
    updateData.assetIds = encode(data.assetIds);
  }
  // Verify ownership before updating
  const existing = await prisma.willCoordination.findFirst({ where: { id: willId, tenantId } });
  if (!existing) throw new Error("Will record not found or access denied");

  const will = await prisma.willCoordination.update({
    where: { id: willId },
    data: updateData,
  });

  await audit({
    tenantId: will.tenantId,
    matterId: will.matterId,
    actorRole: "professional",
    eventType: "will_coordination.updated",
    entityType: "WillCoordination",
    entityId: will.id,
    metadata: { requirementRefs: ["ADD-054"] },
  });

  return toRecord(will);
}

export async function deleteWillRecord(willId: string, tenantId: string) {
  // Verify ownership before deleting
  const existing = await prisma.willCoordination.findFirst({ where: { id: willId, tenantId } });
  if (!existing) throw new Error("Will record not found or access denied");

  const will = await prisma.willCoordination.delete({ where: { id: willId } });

  await audit({
    tenantId: will.tenantId,
    matterId: will.matterId,
    actorRole: "professional",
    eventType: "will_coordination.deleted",
    entityType: "WillCoordination",
    entityId: will.id,
    metadata: { requirementRefs: ["ADD-054"] },
  });

  return { deleted: true };
}

/**
 * Check for revocation clause conflicts among wills in a matter.
 * A "broad" revocation clause is one that says "I revoke all previous wills"
 * without a jurisdiction limitation. If a will has such a clause and there are
 * other wills in the matter, it potentially conflicts with those other wills.
 */
export async function checkRevocationClauseConflicts(matterId: string, tenantId: string): Promise<RevocationConflict[]> {
  const wills = await prisma.willCoordination.findMany({
    where: { matterId, tenantId },
    orderBy: { createdAt: "asc" },
  });

  if (wills.length < 2) {
    return [];
  }

  const conflicts: RevocationConflict[] = [];

  for (const will of wills) {
    if (!will.revocationClause) continue;

    const clause = will.revocationClause.toLowerCase();

    // Check if it's a "broad" revocation — contains "revoke all" language
    // but does NOT contain jurisdiction-limiting language
    const isBroad =
      (clause.includes("revoke all") || clause.includes("revoke all previous wills")) &&
      !clause.includes("relating to") &&
      !clause.includes("limited to") &&
      !clause.includes("pertaining to") &&
      !clause.includes("in respect of");

    if (isBroad) {
      const otherWillIds = wills.filter((w) => w.id !== will.id).map((w) => w.id);
      conflicts.push({
        willId: will.id,
        jurisdictionCode: will.jurisdictionCode,
        conflictingWillIds: otherWillIds,
        reason: `Will in ${will.jurisdictionCode} contains broad revocation clause "${will.revocationClause}" which may unintentionally revoke wills in other jurisdictions.`,
      });
    }
  }

  return conflicts;
}

/**
 * Find assets whose situs country doesn't match any will's jurisdiction.
 */
export async function getUnassignedAssets(matterId: string, tenantId: string) {
  const [wills, assets] = await Promise.all([
    prisma.willCoordination.findMany({ where: { matterId, tenantId } }),
    prisma.asset.findMany({ where: { matterId, tenantId } }),
  ]);

  const willJurisdictions = new Set(wills.map((w) => w.jurisdictionCode));

  return assets
    .filter((asset) => {
      const jurisdiction = mapSitusToJurisdiction(asset.situsCountry);
      return !willJurisdictions.has(jurisdiction);
    })
    .map((asset) => ({
      assetId: asset.id,
      description: asset.description,
      situsCountry: asset.situsCountry,
    }));
}

/**
 * For each asset, determine which will(s) cover it by matching situs to jurisdiction.
 */
export async function getAssetWillCoverage(matterId: string, tenantId: string) {
  const [wills, assets] = await Promise.all([
    prisma.willCoordination.findMany({ where: { matterId, tenantId } }),
    prisma.asset.findMany({ where: { matterId, tenantId } }),
  ]);

  return assets.map((asset) => {
    const jurisdiction = mapSitusToJurisdiction(asset.situsCountry);
    const coveringWills = wills
      .filter((w) => w.jurisdictionCode === jurisdiction)
      .map((w) => w.id);
    return {
      assetId: asset.id,
      coveredByWillIds: coveringWills,
    };
  });
}

/**
 * Generate a full coordination summary for all wills in a matter.
 */
export async function generateWillCoordinationSummary(matterId: string, tenantId: string): Promise<WillCoordinationSummary> {
  const [wills, unassignedAssets, potentialConflicts, assetCoverage] = await Promise.all([
    getWillRecords(matterId, tenantId),
    getUnassignedAssets(matterId, tenantId),
    checkRevocationClauseConflicts(matterId, tenantId),
    getAssetWillCoverage(matterId, tenantId),
  ]);

  return {
    matterId,
    wills,
    unassignedAssets,
    potentialConflicts,
    assetCoverage,
  };
}
