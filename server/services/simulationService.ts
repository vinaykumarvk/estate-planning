import { prisma } from "../db";
import type { RuleIssue } from "../../shared/types";
import { decode, stableHash } from "./json";
import { getActivePack } from "./configurationService";
import { calculateForcedHeirshipPct } from "./ruleEngine";
import { audit } from "./auditService";

const CIVIL_LAW_JURISDICTIONS = ["SN", "CM", "MZ", "AO"];

export async function runWhatIfSimulation(
  matterId: string,
  scenarioId: string,
  hypothetical: { adjustedDispositions?: Array<{ beneficiaryLabel: string; percentage?: number; giftType?: string }> }
) {
  const matter = await prisma.matter.findUniqueOrThrow({ where: { id: matterId } });
  const pack = await getActivePack(matter.primaryJurisdictionCode);
  const [relationships, assets, dispositions, people] = await Promise.all([
    prisma.relationship.findMany({ where: { matterId } }),
    prisma.asset.findMany({ where: { matterId } }),
    prisma.disposition.findMany({ where: { matterId, scenarioId } }),
    prisma.person.findMany({ where: { matterId } })
  ]);

  // Apply hypothetical adjustments in-memory
  const simulatedDispositions = dispositions.map((d) => {
    const adjustment = hypothetical.adjustedDispositions?.find((a) => a.beneficiaryLabel === d.beneficiaryLabel);
    if (adjustment) {
      return {
        ...d,
        percentage: adjustment.percentage ?? d.percentage,
        giftType: adjustment.giftType ?? d.giftType
      };
    }
    return d;
  });

  // Run simplified rule evaluation in-memory
  const issues: RuleIssue[] = [];
  const estateValueByCurrency = assets.reduce<Record<string, number>>((acc, a) => {
    acc[a.currency] = (acc[a.currency] ?? 0) + a.valuation;
    return acc;
  }, {});

  // Civil law jurisdictions: forced heirship simulation
  if (CIVIL_LAW_JURISDICTIONS.includes(pack.jurisdictionCode)) {
    const hasSpouse = relationships.some((r) => r.relationshipType === "spouse");
    const childCount = relationships.filter((r) => r.relationshipType === "child").length;
    const hasParents = relationships.some((r) => r.relationshipType === "parent");
    const reservedPct = calculateForcedHeirshipPct(pack.jurisdictionCode, hasSpouse, childCount, hasParents);
    const freeQuota = 1 - reservedPct;

    const nonProtectedPct = simulatedDispositions
      .filter((d) => d.beneficiaryPersonId)
      .filter((d) => {
        const rel = relationships.find((r) => r.toPersonId === d.beneficiaryPersonId);
        return !rel || !["spouse", "child", "parent"].includes(rel.relationshipType);
      })
      .reduce((sum, d) => sum + (d.percentage ?? 0), 0);

    if (nonProtectedPct > freeQuota * 100) {
      issues.push({
        code: "FORCED_HEIRSHIP_CONFLICT",
        severity: "blocker",
        message: `Simulated: non-protected heirs receive ${nonProtectedPct}% but free quota is ${Math.round(freeQuota * 100)}%.`,
        ruleCode: `${pack.jurisdictionCode}-FORCED-HEIRSHIP`,
        sourceCode: `${pack.jurisdictionCode}-S1`,
        professionalReview: true
      });
    }
  }

  // South Africa: estate duty simulation
  if (pack.jurisdictionCode === "ZA" && (estateValueByCurrency.ZAR ?? 0) > 3500000) {
    const estateValue = estateValueByCurrency.ZAR ?? 0;
    const taxableAmount = estateValue - 3500000;
    const dutyRate = taxableAmount > 30000000 ? "25%" : "20%";
    issues.push({
      code: "TAX_THRESHOLD_TRIGGER",
      severity: "warning",
      message: `Simulated: estate value ZAR ${estateValue.toLocaleString()} exceeds threshold. Estate duty at ${dutyRate}.`,
      ruleCode: "ZA-ESTATE-DUTY",
      sourceCode: "ZA-S1",
      professionalReview: true
    });
  }

  // Kenya/Ghana: customary law override simulation
  if (pack.jurisdictionCode === "KE") {
    issues.push({
      code: "CUSTOMARY_LAW_CONFLICT",
      severity: "info",
      message: "Simulated: verify that dispositions comply with Kenya Law of Succession Act (Cap 160) and do not conflict with customary law.",
      ruleCode: "KE-SUCCESSION-ACT",
      sourceCode: "KE-S1",
      professionalReview: false
    });
  }

  if (pack.jurisdictionCode === "GH") {
    issues.push({
      code: "CUSTOMARY_LAW_CONFLICT",
      severity: "info",
      message: "Simulated: Ghana Intestate Succession Law (PNDC Law 111) may limit testamentary freedom for family property.",
      ruleCode: "GH-INTESTATE-LAW",
      sourceCode: "GH-S1",
      professionalReview: false
    });
  }

  await audit({
    tenantId: matter.tenantId,
    matterId,
    actorRole: "system",
    eventType: "simulation.executed",
    entityType: "Scenario",
    entityId: scenarioId,
    metadata: { hypothetical, issueCount: issues.length, requirementRefs: ["FR-025"] }
  });

  return {
    matterId,
    scenarioId,
    hypothetical,
    projectedIssues: issues,
    blocked: issues.some((i) => i.severity === "blocker"),
    persisted: false
  };
}
