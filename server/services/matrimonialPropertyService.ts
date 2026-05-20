import { prisma } from "../db";
import type { MatrimonialRegimeResult } from "../../shared/types";
import { audit } from "./auditService";

const REGIMES: Record<string, { regime: string; description: string }> = {
  NG: {
    regime: "separate_property",
    description: "Nigeria (common law states): separate property regime. Each spouse owns property independently. Northern states may apply Islamic matrimonial rules."
  },
  GH: {
    regime: "separate_property",
    description: "Ghana: separate property with customary law overlay. Customary marriage may create community property expectations."
  },
  ZA: {
    regime: "in_community_of_property",
    description: "South Africa default: in community of property. All assets form a joint estate unless an antenuptial contract provides otherwise (out of community / accrual system)."
  },
  KE: {
    regime: "separate_property",
    description: "Kenya: separate property regime under the Matrimonial Property Act 2013."
  },
  SN: {
    regime: "community_of_property",
    description: "Senegal: community of property under the Code de la Famille. Spouses share acquired assets."
  },
  CM: {
    regime: "community_of_property",
    description: "Cameroon: community of property in civil law regions; separate property in common law regions. Dual-system jurisdiction."
  },
  MZ: {
    regime: "community_of_acquests",
    description: "Mozambique: community of acquests (comunhão de adquiridos) under the Código Civil. Assets acquired during marriage are jointly owned."
  },
  AO: {
    regime: "community_of_acquests",
    description: "Angola: community of acquests (comunhão de adquiridos) under the Código Civil. Assets acquired during marriage are jointly owned."
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
  const regimeInfo = REGIMES[jurisdictionCode] ?? REGIMES.NG;
  const risks: string[] = [];

  const married = people.some((p) => p.maritalStatus === "married");
  const hasSpouseRelationship = relationships.some((r) => r.relationshipType === "spouse");

  if (married || hasSpouseRelationship) {
    if (jurisdictionCode === "ZA") {
      risks.push("Under in community of property (default), all assets form a joint estate. Verify if antenuptial contract exists.");
      const jointAssets = assets.filter((a) => a.ownershipType === "joint_tenancy" || a.ownershipType === "tenancy_in_common");
      if (jointAssets.length > 0) {
        risks.push(`${jointAssets.length} joint asset(s) detected — review community property classification.`);
      }
    }
    if (jurisdictionCode === "NG") {
      risks.push("In northern Nigerian states, Islamic personal law may govern matrimonial property. Confirm applicable legal system.");
    }
    if (jurisdictionCode === "GH") {
      risks.push("Customary marriage may create community property expectations under Ghanaian customary law.");
    }
    if (["SN", "CM"].includes(jurisdictionCode)) {
      risks.push("Under community of property regime, spouse consent may be required for disposition of jointly acquired assets.");
    }
    if (["MZ", "AO"].includes(jurisdictionCode)) {
      risks.push("Under community of acquests, jointly acquired assets may require spouse consent for testamentary disposition.");
      const jointAssets = assets.filter((a) => a.ownershipType === "joint_tenancy" || a.ownershipType === "tenancy_in_common");
      if (jointAssets.length > 0) {
        risks.push(`${jointAssets.length} joint asset(s) detected — review community property classification.`);
      }
    }
    if (jurisdictionCode === "KE") {
      risks.push("Review Matrimonial Property Act 2013 implications for estate planning.");
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
