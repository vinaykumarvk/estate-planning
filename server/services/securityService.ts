import { prisma } from "../db";

export async function encryptionKeyStatus() {
  const keys = await prisma.encryptionKeyRecord.findMany({ orderBy: { keyAlias: "asc" } });
  const now = new Date();
  const overdue = keys.filter((k) => k.status === "active" && new Date(k.rotationDueAt) < now);
  return {
    keys: keys.map((k) => ({
      keyAlias: k.keyAlias,
      keyType: k.keyType,
      purpose: k.purpose,
      status: k.status,
      rotationDueAt: k.rotationDueAt
    })),
    activeKeys: keys.filter((k) => k.status === "active").length,
    overdueRotations: overdue.length,
    requirementRefs: ["SEC-001"]
  };
}

export async function securityControlStatus() {
  const [apiKeys, auditEvents, retentionPolicies, incidents, insurance, uplOpinions] = await Promise.all([
    prisma.apiKey.count({ where: { status: "active" } }),
    prisma.auditEvent.count(),
    prisma.retentionPolicy.count({ where: { status: "active" } }),
    prisma.incident.count({ where: { status: { not: "closed" } } }),
    prisma.insuranceRecord.findMany({ where: { status: "active" } }),
    prisma.uplOpinion.findMany({ where: { status: "current" } })
  ]);

  return {
    encryptionInTransit: "production_tls_required",
    encryptionAtRest: "managed_storage_required",
    apiAuthentication: apiKeys > 0 ? "active_api_key_gate" : "missing",
    auditCoverage: auditEvents > 0 ? "active" : "missing",
    retentionPolicies: retentionPolicies > 0 ? "active" : "missing",
    openIncidents: incidents,
    cyberInsurance: insurance.some((record) => record.coverageType === "cyber_liability" && record.coverageAmount >= 10000000)
      ? "active_10m_plus"
      : "missing",
    techEoInsurance: insurance.some((record) => record.coverageType === "tech_eo" && record.coverageAmount >= 5000000)
      ? "active"
      : "missing",
    uplOpinions: uplOpinions.length >= 2 ? "current_for_phase_1" : "missing",
    dataResidency: "tenant_region_recorded",
    crossBorderTransferControl: "requires_pack_and_tenant_policy_review",
    requirementRefs: ["SEC-001", "SEC-002", "SEC-004", "SEC-006", "SEC-007", "SEC-008", "SEC-014", "SEC-017"]
  };
}

export async function complianceEvidenceStatus() {
  const [incidents, insurance, uplOpinions, releaseGates, aiEvals] = await Promise.all([
    prisma.incident.findMany({ orderBy: { openedAt: "desc" }, take: 10 }),
    prisma.insuranceRecord.findMany({ where: { status: "active" } }),
    prisma.uplOpinion.findMany({ where: { status: "current" } }),
    prisma.releaseGate.findMany({ orderBy: { gateCode: "asc" } }),
    prisma.aiEvaluationRun.findMany({ orderBy: { createdAt: "desc" }, take: 5 })
  ]);

  const gatePassRate = releaseGates.length > 0
    ? Math.round((releaseGates.filter((g) => g.status === "pass").length / releaseGates.length) * 100)
    : 0;

  return {
    soc2: { status: "tracking", controlsMapped: true, nextAuditDue: "pre_production" },
    iso27001: { status: "tracking", controlsMapped: true, certificationTarget: "post_launch" },
    gatePassRate,
    totalGates: releaseGates.length,
    passingGates: releaseGates.filter((g) => g.status === "pass").length,
    recentIncidents: incidents.map((i) => ({ id: i.id, title: i.title, status: i.status, class: i.incidentClass })),
    activeInsurance: insurance.map((i) => ({ type: i.coverageType, amount: i.coverageAmount, currency: i.currency, carrier: i.carrier })),
    uplOpinions: uplOpinions.map((u) => ({ jurisdiction: u.jurisdictionCode, counsel: u.counselName, status: u.status, refreshDue: u.refreshDueAt })),
    latestAiEvaluations: aiEvals.map((e) => ({ packId: e.packId, locale: e.locale, gateStatus: e.releaseGateStatus, groundingRate: e.groundingRate })),
    requirementRefs: ["SEC-016"]
  };
}
