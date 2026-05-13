import { prisma } from "../db";
import { audit } from "./auditService";

const EW_TAPER_RELIEF: Array<{ yearsBeforeDeath: number; reliefPct: number }> = [
  { yearsBeforeDeath: 3, reliefPct: 0 },
  { yearsBeforeDeath: 4, reliefPct: 20 },
  { yearsBeforeDeath: 5, reliefPct: 40 },
  { yearsBeforeDeath: 6, reliefPct: 60 },
  { yearsBeforeDeath: 7, reliefPct: 80 }
];

export async function evaluateGiftLookback(matterId: string) {
  const matter = await prisma.matter.findUniqueOrThrow({ where: { id: matterId } });
  const dispositions = await prisma.disposition.findMany({ where: { matterId, lifetimeGift: true } });

  const now = new Date();
  const results: Array<{
    dispositionId: string;
    beneficiaryLabel: string;
    giftDate: string | null;
    yearsAgo: number;
    withinLookback: boolean;
    taperReliefPct: number;
    jurisdiction: string;
    rule: string;
  }> = [];

  for (const d of dispositions) {
    if (!d.giftDate) continue;
    const yearsAgo = (now.getTime() - d.giftDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    if (matter.primaryJurisdictionCode === "EW") {
      // 7-year lookback with taper relief
      const withinLookback = yearsAgo <= 7;
      let taperReliefPct = 0;
      if (withinLookback) {
        const tier = EW_TAPER_RELIEF.find((t) => yearsAgo <= t.yearsBeforeDeath);
        taperReliefPct = tier?.reliefPct ?? 0;
      }
      results.push({
        dispositionId: d.id,
        beneficiaryLabel: d.beneficiaryLabel,
        giftDate: d.giftDate.toISOString(),
        yearsAgo: Math.round(yearsAgo * 10) / 10,
        withinLookback,
        taperReliefPct,
        jurisdiction: "EW",
        rule: "7-year lookback with taper relief"
      });
    } else if (matter.primaryJurisdictionCode === "PT") {
      // PT collation rule — lifetime gifts to forced heirs are subject to collation
      results.push({
        dispositionId: d.id,
        beneficiaryLabel: d.beneficiaryLabel,
        giftDate: d.giftDate.toISOString(),
        yearsAgo: Math.round(yearsAgo * 10) / 10,
        withinLookback: true, // PT has no time limit for collation
        taperReliefPct: 0,
        jurisdiction: "PT",
        rule: "Collation of lifetime gifts to forced heirs (no time limit)"
      });
    }
  }

  await audit({
    tenantId: matter.tenantId,
    matterId,
    actorRole: "system",
    eventType: "gift_lookback.evaluated",
    entityType: "Matter",
    entityId: matterId,
    metadata: { giftCount: results.length, requirementRefs: ["CS-010"] }
  });

  return { matterId, gifts: results, requirementRefs: ["CS-010"] };
}
