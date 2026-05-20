import { prisma } from "../db";
import { BACK_OFFICE_REQUIREMENTS, PHASE_1_JURISDICTIONS, TABLE_CATALOG } from "../../shared/constants";
import { toggleJurisdictionSchema, updateTenantJurisdictionsSchema } from "../../shared/schemas";
import { decode, encode } from "./json";
import { audit } from "./auditService";

export async function getActivePack(jurisdictionCode: string) {
  const pack = await prisma.jurisdictionPack.findFirst({
    where: { jurisdictionCode, status: "active" }
  });

  if (!pack) {
    throw new Error(`No active jurisdiction pack for ${jurisdictionCode}`);
  }

  return pack;
}

export async function getPackSnapshot(packId: string) {
  const [pack, version, rules, templates, glossary, gates] = await Promise.all([
    prisma.jurisdictionPack.findUnique({ where: { id: packId } }),
    prisma.packVersion.findFirst({ where: { packId, status: "active" } }),
    prisma.rule.findMany({ where: { packId, status: "active" }, orderBy: { ruleCode: "asc" } }),
    prisma.documentTemplate.findMany({ where: { packId, status: "approved" }, orderBy: { templateCode: "asc" } }),
    prisma.legalGlossaryTerm.findMany({ where: { packId, status: "approved" }, orderBy: { termKey: "asc" } }),
    prisma.releaseGate.findMany({ where: { packId }, orderBy: { gateCode: "asc" } })
  ]);

  if (!pack || !version) {
    throw new Error(`Pack snapshot unavailable for ${packId}`);
  }

  return { pack, version, rules, templates, glossary, gates };
}

export function backOfficeTableCatalog() {
  return TABLE_CATALOG.map((tableName) => {
    const area =
      tableName.includes("Pack") || tableName.includes("Rule") || tableName.includes("Workflow")
        ? "legal_content_operations"
        : tableName.includes("Ai")
          ? "ai_safety"
          : tableName.includes("Matter") || tableName.includes("Document") || tableName.includes("Person")
            ? "front_office"
            : tableName.includes("Payment") || tableName.includes("Kyc") || tableName.includes("Beneficial")
              ? "deferred_module"
              : "platform_operations";

    return {
      tableName,
      area,
      maintainedBy: area === "front_office" ? "tenant professional users" : "platform back office",
      requirementRefs: BACK_OFFICE_REQUIREMENTS
    };
  });
}

export async function assertPackPublishable(packId: string) {
  const pack = await prisma.jurisdictionPack.findUnique({ where: { id: packId } });
  if (!pack) {
    throw new Error(`Unknown pack ${packId}`);
  }

  const gates = await prisma.releaseGate.findMany({ where: { packId } });
  const failedGates = gates.filter((gate) => gate.blocker && gate.status !== "pass");
  const uplOpinion = await prisma.uplOpinion.findFirst({
    where: { jurisdictionCode: pack.jurisdictionCode, status: "current" }
  });
  const translationTasks = await prisma.translationTask.findMany({
    where: { packId, status: { notIn: ["approved", "complete"] } }
  });

  const blockers = [
    ...failedGates.map((gate) => `${gate.gateCode}: ${gate.status}`),
    ...(uplOpinion ? [] : ["upl-opinion: missing-current-opinion"]),
    ...translationTasks.map((task) => `translation:${task.contentKey}:${task.locale}`)
  ];

  return {
    publishable: blockers.length === 0,
    blockers,
    gates
  };
}

export async function publishPack(packId: string, actorUserId: string) {
  const result = await assertPackPublishable(packId);
  const pack = await prisma.jurisdictionPack.findUniqueOrThrow({ where: { id: packId } });

  if (!result.publishable) {
    await prisma.jurisdictionPack.update({
      where: { id: packId },
      data: { publicationBlockers: encode(result.blockers), status: "blocked" }
    });
    throw new Error(`Pack publication blocked: ${result.blockers.join(", ")}`);
  }

  const updated = await prisma.jurisdictionPack.update({
    where: { id: packId },
    data: { status: "active", publicationBlockers: encode([]) }
  });

  await audit({
    tenantId: "platform",
    actorUserId,
    actorRole: "legal-content-lead",
    eventType: "pack.published",
    entityType: "JurisdictionPack",
    entityId: packId,
    ruleVersion: updated.activeVersion ?? undefined,
    metadata: {
      jurisdictionCode: pack.jurisdictionCode,
      gates: result.gates.map((gate) => ({ gateCode: gate.gateCode, status: gate.status }))
    }
  });

  return updated;
}

export async function rollbackPack(packId: string, actorUserId: string, targetVersion: string) {
  const updated = await prisma.jurisdictionPack.update({
    where: { id: packId },
    data: {
      activeVersion: targetVersion,
      status: "active",
      publicationBlockers: encode([])
    }
  });

  await audit({
    tenantId: "platform",
    actorUserId,
    actorRole: "legal-content-lead",
    eventType: "pack.rollback",
    entityType: "JurisdictionPack",
    entityId: packId,
    ruleVersion: targetVersion,
    metadata: { targetVersion }
  });

  return updated;
}

export async function enabledJurisdictionsForTenant(tenantId: string) {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  const enabled = new Set(decode<string[]>(tenant.enabledCountries, []));
  const all = await prisma.jurisdiction.findMany({ select: { code: true }, orderBy: { code: "asc" } });
  return all.map((j) => ({ code: j.code, enabled: enabled.has(j.code) }));
}

export async function setEnabledJurisdictions(input: unknown) {
  const data = updateTenantJurisdictionsSchema.parse(input);

  // Validate all codes exist
  for (const code of data.jurisdictionCodes) {
    const exists = await prisma.jurisdiction.findUnique({ where: { code } });
    if (!exists) {
      throw new Error(`Unknown jurisdiction code: ${code}`);
    }
  }

  await prisma.tenant.update({
    where: { id: data.tenantId },
    data: { enabledCountries: encode(data.jurisdictionCodes) }
  });

  await audit({
    tenantId: data.tenantId,
    actorUserId: data.actorUserId,
    actorRole: "platform_admin",
    eventType: "tenant.jurisdictions_updated",
    entityType: "Tenant",
    entityId: data.tenantId,
    metadata: { jurisdictionCodes: data.jurisdictionCodes, requirementRefs: ["FR-001"] }
  });

  return data.jurisdictionCodes;
}

export async function toggleJurisdiction(input: unknown) {
  const data = toggleJurisdictionSchema.parse(input);

  const exists = await prisma.jurisdiction.findUnique({ where: { code: data.jurisdictionCode } });
  if (!exists) {
    throw new Error(`Unknown jurisdiction code: ${data.jurisdictionCode}`);
  }

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: data.tenantId } });
  const current = decode<string[]>(tenant.enabledCountries, []);

  let updated: string[];
  if (data.enabled) {
    updated = [...new Set([...current, data.jurisdictionCode])];
  } else {
    updated = current.filter((c) => c !== data.jurisdictionCode);
  }

  await prisma.tenant.update({
    where: { id: data.tenantId },
    data: { enabledCountries: encode(updated) }
  });

  await audit({
    tenantId: data.tenantId,
    actorUserId: data.actorUserId,
    actorRole: "platform_admin",
    eventType: data.enabled ? "tenant.jurisdiction_enabled" : "tenant.jurisdiction_disabled",
    entityType: "Tenant",
    entityId: data.tenantId,
    metadata: { jurisdictionCode: data.jurisdictionCode, enabled: data.enabled, requirementRefs: ["FR-001"] }
  });

  return { tenantId: data.tenantId, jurisdictions: updated };
}
