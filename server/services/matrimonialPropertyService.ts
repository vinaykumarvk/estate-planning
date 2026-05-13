import { prisma } from "../db";
import type { MatrimonialRegimeResult } from "../../shared/types";
import { audit } from "./auditService";

const REGIMES: Record<string, { regime: string; description: string }> = {
  PT: {
    regime: "community_of_acquests",
    description: "Portuguese default matrimonial regime: comunhão de adquiridos (community of acquests). Assets acquired during marriage are jointly owned."
  },
  EW: {
    regime: "separate_property",
    description: "England & Wales: no community property regime. Each spouse owns their property separately, subject to family provision claims."
  }
};

export async function evaluateMatrimonialRegime(matterId: string): Promise<MatrimonialRegimeResult> {
  const matter = await prisma.matter.findUniqueOrThrow({ where: { id: matterId } });
  const [people, relationships, assets] = await Promise.all([
    prisma.person.findMany({ where: { matterId } }),
    prisma.relationship.findMany({ where: { matterId } }),
    prisma.asset.findMany({ where: { matterId } })
  ]);

  const jurisdictionCode = matter.primaryJurisdictionCode;
  const regimeInfo = REGIMES[jurisdictionCode] ?? REGIMES.EW;
  const risks: string[] = [];

  const married = people.some((p) => p.maritalStatus === "married");
  const hasSpouseRelationship = relationships.some((r) => r.relationshipType === "spouse");

  if (married || hasSpouseRelationship) {
    if (jurisdictionCode === "PT") {
      risks.push("Under community of acquests, jointly acquired assets may require spouse consent for testamentary disposition.");
      const jointAssets = assets.filter((a) => a.ownershipType === "joint_tenancy" || a.ownershipType === "tenancy_in_common");
      if (jointAssets.length > 0) {
        risks.push(`${jointAssets.length} joint asset(s) detected — review community property classification.`);
      }
    }
    if (jurisdictionCode === "EW") {
      risks.push("Consider Inheritance (Provision for Family and Dependants) Act 1975 claims by surviving spouse.");
    }
  } else {
    risks.push("No married testator detected — matrimonial property regime may not apply.");
  }

  await audit({
    tenantId: matter.tenantId,
    matterId,
    actorRole: "system",
    eventType: "matrimonial_regime.evaluated",
    entityType: "Matter",
    entityId: matterId,
    metadata: { regime: regimeInfo.regime, riskCount: risks.length, requirementRefs: ["CS-008"] }
  });

  return {
    matterId,
    jurisdictionCode,
    regime: regimeInfo.regime,
    description: regimeInfo.description,
    risks
  };
}

export async function flagMatrimonialRisk(matterId: string) {
  const result = await evaluateMatrimonialRegime(matterId);
  return {
    code: "MATRIMONIAL_PROPERTY_REVIEW",
    severity: "warning" as const,
    message: `Matrimonial regime (${result.regime}): ${result.risks[0] ?? "Review required."}`,
    ruleCode: "COMMON-MATRIMONIAL-REVIEW",
    sourceCode: "CS-008",
    professionalReview: true
  };
}
