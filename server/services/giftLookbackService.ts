import { prisma } from "../db";
import { audit } from "./auditService";

const ZA_DONATIONS_TAX_EXEMPTION_ZAR = 100000; // Annual exemption

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

    if (matter.primaryJurisdictionCode === "ZA") {
      // South Africa: Donations tax under Section 56 of the Income Tax Act
      results.push({
        dispositionId: d.id,
        beneficiaryLabel: d.beneficiaryLabel,
        giftDate: d.giftDate.toISOString(),
        yearsAgo: Math.round(yearsAgo * 10) / 10,
        withinLookback: true, // Donations tax applies at time of donation, no lookback period per se
        taperReliefPct: 0,
        jurisdiction: "ZA",
        rule: "Donations tax at 20% (above ZAR 100k annual exemption). Section 56 Income Tax Act."
      });
    } else if (matter.primaryJurisdictionCode === "NG") {
      // Nigeria: No general gift/estate tax or lookback
      results.push({
        dispositionId: d.id,
        beneficiaryLabel: d.beneficiaryLabel,
        giftDate: d.giftDate.toISOString(),
        yearsAgo: Math.round(yearsAgo * 10) / 10,
        withinLookback: false,
        taperReliefPct: 0,
        jurisdiction: "NG",
        rule: "No general gift lookback or estate duty in Nigeria."
      });
    } else if (["SN", "CM", "MZ", "AO"].includes(matter.primaryJurisdictionCode)) {
      // Civil law jurisdictions: Collation of lifetime gifts to forced heirs
      results.push({
        dispositionId: d.id,
        beneficiaryLabel: d.beneficiaryLabel,
        giftDate: d.giftDate.toISOString(),
        yearsAgo: Math.round(yearsAgo * 10) / 10,
        withinLookback: true, // No time limit for collation under civil law
        taperReliefPct: 0,
        jurisdiction: matter.primaryJurisdictionCode,
        rule: "Collation of lifetime gifts to forced heirs (no time limit under civil law)."
      });
    } else {
      // GH, KE: No specific gift lookback
      results.push({
        dispositionId: d.id,
        beneficiaryLabel: d.beneficiaryLabel,
        giftDate: d.giftDate.toISOString(),
        yearsAgo: Math.round(yearsAgo * 10) / 10,
        withinLookback: false,
        taperReliefPct: 0,
        jurisdiction: matter.primaryJurisdictionCode,
        rule: "No specific gift lookback rule in this jurisdiction."
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
