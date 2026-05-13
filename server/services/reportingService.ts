import { prisma } from "../db";
import { decode } from "./json";

export async function phaseOneKpis() {
  const [tenants, packs, finalizedWills, aiRuns, incidents, velocity] = await Promise.all([
    prisma.tenant.count({ where: { status: "active" } }),
    prisma.jurisdictionPack.findMany({ where: { status: "active" } }),
    prisma.document.count({ where: { documentType: "will", status: "finalized" } }),
    prisma.aiEvaluationRun.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.incident.findMany({ where: { incidentClass: { in: ["upl", "security"] } } }),
    prisma.packVelocityRecord.findMany({ orderBy: { packOrdinal: "asc" } })
  ]);

  const latestAi = aiRuns[0];
  return {
    payingTenants: tenants,
    activePacks: packs.length,
    tenantDensityPerPack: packs.length ? Number((tenants / packs.length).toFixed(2)) : 0,
    finalizedWills,
    arrEstimate: 5400,
    aiGroundingRate: latestAi?.groundingRate ?? 0,
    aiHallucinationRate: latestAi?.hallucinatedCitationRate ?? 0,
    materialUplIncidents: incidents.filter((incident) => incident.incidentClass === "upl").length,
    materialSecurityIncidents: incidents.filter((incident) => incident.incidentClass === "security").length,
    packVelocity: velocity.map((record) => ({
      packId: record.packId,
      elapsedDays: record.elapsedDays,
      launchCost: record.launchCost,
      status: record.status
    }))
  };
}

export async function reportsIndex() {
  const snapshots = await prisma.reportSnapshot.findMany({ orderBy: { createdAt: "desc" } });
  return snapshots.map((snapshot) => ({
    ...snapshot,
    metrics: decode<Record<string, unknown>>(snapshot.metrics, {})
  }));
}
