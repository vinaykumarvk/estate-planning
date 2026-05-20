import { prisma } from "../db";
import type { RuleEvaluationSummary, RuleIssue } from "../../shared/types";
import { decode, encode, stableHash } from "./json";
import { getActivePack } from "./configurationService";
import { audit } from "./auditService";

function age(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) {
    return null;
  }
  const today = new Date();
  let years = today.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDelta = today.getUTCMonth() - dateOfBirth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < dateOfBirth.getUTCDate())) {
    years -= 1;
  }
  return years;
}

const CIVIL_LAW_JURISDICTIONS = ["SN", "CM", "MZ", "AO"];

export function calculateForcedHeirshipPct(jurisdictionCode: string, hasSpouse: boolean, childCount: number, hasParents: boolean): number {
  if (CIVIL_LAW_JURISDICTIONS.includes(jurisdictionCode)) {
    // Francophone civil law (SN/CM): réserve héréditaire
    // Lusophone civil law (MZ/AO): legítima
    if (hasSpouse && childCount >= 2) return 2 / 3;
    if (hasSpouse && childCount === 1) return 2 / 3;
    if (!hasSpouse && childCount >= 2) return 2 / 3;
    if (!hasSpouse && childCount === 1) return 1 / 2;
    if (hasSpouse && childCount === 0 && !hasParents) return 1 / 2;
    if (hasSpouse && childCount === 0 && hasParents) return 2 / 3;
    if (!hasSpouse && childCount === 0 && hasParents) return 1 / 3;
  }
  return 0;
}

export async function evaluateMatterRules(matterId: string, scenarioId?: string): Promise<RuleEvaluationSummary> {
  const matter = await prisma.matter.findUniqueOrThrow({ where: { id: matterId } });
  const pack = await getActivePack(matter.primaryJurisdictionCode);
  const [version, rules, people, relationships, assets, consents, dispositions] = await Promise.all([
    prisma.packVersion.findFirst({ where: { packId: pack.id, status: "active" } }),
    prisma.rule.findMany({ where: { packId: pack.id, status: "active" } }),
    prisma.person.findMany({ where: { matterId } }),
    prisma.relationship.findMany({ where: { matterId } }),
    prisma.asset.findMany({ where: { matterId } }),
    prisma.consent.findMany({ where: { matterId } }),
    prisma.disposition.findMany({ where: { matterId, ...(scenarioId ? { scenarioId } : {}) } })
  ]);

  if (!version) {
    throw new Error(`No active pack version for ${pack.id}`);
  }

  const issues: RuleIssue[] = [];
  const estateValueByCurrency = assets.reduce<Record<string, number>>((accumulator, asset) => {
    accumulator[asset.currency] = (accumulator[asset.currency] ?? 0) + asset.valuation;
    return accumulator;
  }, {});
  const additionalJurisdictions = decode<string[]>(matter.additionalJurisdictions, []);
  const situsCountries = new Set(assets.map((asset) => asset.situsCountry).filter(Boolean));
  const crossBorder =
    additionalJurisdictions.length > 0 ||
    situsCountries.size > 1 ||
    people.some((person) => person.habitualResidence && person.habitualResidence !== people[0]?.habitualResidence);

  const missingConsents = ["privacy_notice", "professional_disclaimer"].filter(
    (consentType) => !consents.some((consent) => consent.consentType === consentType && consent.acknowledged)
  );
  for (const consentType of missingConsents) {
    issues.push({
      code: "PRIVACY_CONSENT_MISSING",
      severity: "blocker",
      message: `${consentType.replace("_", " ")} acknowledgement is required before finalization.`,
      ruleCode: "COMMON-CONSENT-GATE",
      sourceCode: "SEC-007",
      professionalReview: true
    });
  }

  if (crossBorder) {
    issues.push({
      code: "CROSS_BORDER_ASSETS",
      severity: "blocker",
      message: "Matter has cross-border connecting factors; conflict-of-laws memo and professional review are mandatory.",
      ruleCode: "CL-CROSS-BORDER-REVIEW",
      sourceCode: "CL-001",
      professionalReview: true
    });
  }

  const minorRelationships = relationships.filter((relationship) => relationship.minor || relationship.dependent);
  const minorBeneficiaries = dispositions.filter((disposition) => {
    if (!disposition.beneficiaryPersonId) {
      return false;
    }
    const beneficiary = people.find((person) => person.id === disposition.beneficiaryPersonId);
    const beneficiaryAge = age(beneficiary?.dateOfBirth ?? null);
    return beneficiaryAge !== null && beneficiaryAge < 18;
  });

  if (minorRelationships.length > 0 || minorBeneficiaries.length > 0) {
    issues.push({
      code: "MINOR_BENEFICIARY",
      severity: "warning",
      message: "Minor/dependent beneficiary facts require professional review and guardianship consideration.",
      ruleCode: "COMMON-MINOR-BENEFICIARY",
      sourceCode: "FR-014",
      professionalReview: true
    });
  }

  // --- Nigeria: Islamic law conflict check (Northern Nigeria) ---
  if (pack.jurisdictionCode === "NG") {
    // Check for potential Islamic law conflict in northern states
    const hasIslamicIndicator = people.some((p) =>
      p.habitualResidence?.toLowerCase().includes("north") || p.nationality === "NG"
    );
    if (hasIslamicIndicator && relationships.some((r) => r.relationshipType === "spouse")) {
      issues.push({
        code: "NG_ISLAMIC_LAW_CONFLICT",
        severity: "warning",
        message: "Testator may be subject to Islamic personal law in Northern Nigeria — Wills Act may not apply. Professional review required.",
        ruleCode: "NG-WILLS-ACT",
        sourceCode: "NG-S1",
        professionalReview: true
      });
    }
  }

  // --- South Africa: Estate duty threshold and matrimonial regime ---
  if (pack.jurisdictionCode === "ZA" && (estateValueByCurrency.ZAR ?? 0) > 3500000) {
    issues.push({
      code: "TAX_THRESHOLD_TRIGGER",
      severity: "warning",
      message: "Estate value exceeds ZAR 3.5M estate duty threshold; professional tax review is required.",
      ruleCode: "ZA-ESTATE-DUTY",
      sourceCode: "ZA-S1",
      professionalReview: true
    });
  }

  if (pack.jurisdictionCode === "ZA" && people.some((p) => p.maritalStatus === "married")) {
    issues.push({
      code: "ZA_MATRIMONIAL_REGIME_REVIEW",
      severity: "warning",
      message: "Married testator under South African law requires matrimonial property regime review (in/out community of property).",
      ruleCode: "ZA-MATRIMONIAL",
      sourceCode: "ZA-S2",
      professionalReview: true
    });
  }

  // --- Kenya: Law of Succession Act compliance ---
  if (pack.jurisdictionCode === "KE") {
    const hasCustomaryIndicator = people.some((p) => p.habitualResidence === "KE");
    if (hasCustomaryIndicator) {
      issues.push({
        code: "CUSTOMARY_LAW_CONFLICT",
        severity: "warning",
        message: "Kenyan Law of Succession Act (Cap 160) may interact with customary law — professional review required.",
        ruleCode: "KE-SUCCESSION-ACT",
        sourceCode: "KE-S1",
        professionalReview: true
      });
    }
  }

  // --- Ghana: Intestate Succession Law (PNDC Law 111) ---
  if (pack.jurisdictionCode === "GH") {
    issues.push({
      code: "CUSTOMARY_LAW_CONFLICT",
      severity: "info",
      message: "Ghana Intestate Succession Law (PNDC Law 111) may override testamentary dispositions for certain family property.",
      ruleCode: "GH-INTESTATE-LAW",
      sourceCode: "GH-S1",
      professionalReview: false
    });
  }

  // --- Civil law jurisdictions: Forced heirship ---
  if (CIVIL_LAW_JURISDICTIONS.includes(pack.jurisdictionCode)) {
    const hasSpouse = relationships.some((r) => r.relationshipType === "spouse");
    const childCount = relationships.filter((r) => r.relationshipType === "child").length;
    const hasParents = relationships.some((r) => r.relationshipType === "parent");
    const protectedHeirRelationships = relationships.filter((relationship) =>
      ["spouse", "child", "parent"].includes(relationship.relationshipType)
    );
    const reservedPct = calculateForcedHeirshipPct(pack.jurisdictionCode, hasSpouse, childCount, hasParents);
    const freeQuota = 1 - reservedPct;
    const nonProtectedPct = dispositions
      .filter((disposition) => disposition.beneficiaryPersonId)
      .filter((disposition) => {
        const relationship = relationships.find((candidate) => candidate.toPersonId === disposition.beneficiaryPersonId);
        return !relationship || !["spouse", "child", "parent"].includes(relationship.relationshipType);
      })
      .reduce((sum, disposition) => sum + (disposition.percentage ?? 0), 0);

    if (protectedHeirRelationships.length > 0 && nonProtectedPct > freeQuota * 100) {
      const ruleCode = ["SN", "CM"].includes(pack.jurisdictionCode)
        ? `${pack.jurisdictionCode}-FORCED-HEIRSHIP`
        : `${pack.jurisdictionCode}-LEGITIMA`;
      issues.push({
        code: "FORCED_HEIRSHIP_CONFLICT",
        severity: "blocker",
        message: `Scenario may impair protected heirs' reserved share (${Math.round(reservedPct * 100)}%) under ${pack.jurisdictionCode} forced heirship rules.`,
        ruleCode,
        sourceCode: `${pack.jurisdictionCode}-S1`,
        professionalReview: true
      });
    }

    // Matrimonial regime review for married testator in civil law jurisdictions
    if (people.some((p) => p.maritalStatus === "married")) {
      issues.push({
        code: "MATRIMONIAL_REGIME_REVIEW",
        severity: "warning",
        message: `Married testator under ${pack.jurisdictionCode} civil law requires matrimonial property regime review.`,
        ruleCode: `${pack.jurisdictionCode}-MATRIMONIAL-REGIME`,
        sourceCode: "CS-008",
        professionalReview: true
      });
    }
  }

  for (const asset of assets) {
    const evidenceRefs = decode<string[]>(asset.evidenceRefs, []);
    if (evidenceRefs.length === 0) {
      issues.push({
        code: "MISSING_ASSET_EVIDENCE",
        severity: "warning",
        message: `${asset.description} has no linked supporting document.`,
        ruleCode: "COMMON-ASSET-EVIDENCE",
        sourceCode: "CR-003",
        professionalReview: false
      });
    }

    // TOD/POD beneficiary designation conflict
    if (asset.beneficiaryDesignation && dispositions.some((d) => d.assetId === asset.id)) {
      issues.push({
        code: "BENEFICIARY_DESIGNATION_CONFLICT",
        severity: "warning",
        message: `${asset.description} has both a beneficiary designation and a will disposition — potential conflict.`,
        ruleCode: "COMMON-BENEFICIARY-CONFLICT",
        sourceCode: "FR-018",
        professionalReview: true
      });
    }

    // TOD/POD on joint tenancy warning
    if (asset.todPod && asset.ownershipType === "joint_tenancy") {
      issues.push({
        code: "BENEFICIARY_DESIGNATION_CONFLICT",
        severity: "info",
        message: `${asset.description} has TOD/POD designation on joint tenancy — survivorship may override.`,
        ruleCode: "COMMON-TOD-JOINT",
        sourceCode: "FR-018",
        professionalReview: false
      });
    }
  }

  // Fiduciary eligibility check
  for (const disposition of dispositions) {
    if (disposition.executorPersonId) {
      const executor = people.find((p) => p.id === disposition.executorPersonId);
      const executorAge = age(executor?.dateOfBirth ?? null);
      const executorRel = relationships.find((r) => r.toPersonId === disposition.executorPersonId);
      if ((executorAge !== null && executorAge < 18) || executorRel?.incapacitated) {
        issues.push({
          code: "FIDUCIARY_INELIGIBLE",
          severity: "blocker",
          message: `Fiduciary ${executor?.legalName ?? "Unknown"} is a minor or incapacitated and cannot serve.`,
          ruleCode: "COMMON-FIDUCIARY-ELIGIBILITY",
          sourceCode: "FR-014",
          professionalReview: true
        });
      }
    }
  }

  // Tax residence impact
  const jurisdictionCountryMap: Record<string, string> = {
    NG: "NG", GH: "GH", ZA: "ZA", KE: "KE", SN: "SN", CM: "CM", MZ: "MZ", AO: "AO"
  };
  const primaryCountry = jurisdictionCountryMap[matter.primaryJurisdictionCode] ?? matter.primaryJurisdictionCode;
  for (const person of people) {
    if (person.taxResidency && person.taxResidency !== matter.primaryJurisdictionCode &&
        person.taxResidency !== primaryCountry) {
      issues.push({
        code: "TAX_RESIDENCE_IMPACT",
        severity: "warning",
        message: `${person.legalName} has tax residency in ${person.taxResidency}, differing from primary jurisdiction.`,
        ruleCode: "COMMON-TAX-RESIDENCE",
        sourceCode: "FR-014",
        professionalReview: true
      });
    }
  }

  // Per-stirpes without alternate disposition warning
  for (const disposition of dispositions) {
    if (disposition.perStirpes && !disposition.alternateDisposition) {
      issues.push({
        code: "MISSING_ALTERNATE_DISPOSITION",
        severity: "info",
        message: `Disposition to ${disposition.beneficiaryLabel} uses per stirpes but has no alternate disposition specified.`,
        ruleCode: "COMMON-ALTERNATE-DISPOSITION",
        sourceCode: "FR-015",
        professionalReview: false
      });
    }
  }

  // --- Will Coordination: Revocation clause conflicts (ADD-054) ---
  const willRecords = await prisma.willCoordination.findMany({ where: { matterId } });
  if (willRecords.length >= 2) {
    for (const will of willRecords) {
      if (!will.revocationClause) continue;
      const clause = will.revocationClause.toLowerCase();
      const isBroad =
        (clause.includes("revoke all") || clause.includes("revoke all previous wills")) &&
        !clause.includes("relating to") &&
        !clause.includes("limited to") &&
        !clause.includes("pertaining to") &&
        !clause.includes("in respect of");
      if (isBroad) {
        issues.push({
          code: "REVOCATION_CLAUSE_CONFLICT",
          severity: "warning",
          message: `Will in ${will.jurisdictionCode} contains a broad revocation clause that may unintentionally revoke wills in other jurisdictions.`,
          ruleCode: "WILL-REVOCATION-CONFLICT",
          sourceCode: "ADD-054",
          professionalReview: true
        });
        break; // one issue per matter is sufficient
      }
    }
  }

  // --- Will Coordination: Assets unassigned to any will (ADD-055) ---
  if (willRecords.length > 0) {
    const willJurisdictions = new Set(willRecords.map((w) => w.jurisdictionCode));
    const countryToJurisdiction: Record<string, string> = {
      GB: "EW", UK: "EW", NG: "NG", GH: "GH", ZA: "ZA", KE: "KE",
      SN: "SN", CM: "CM", MZ: "MZ", AO: "AO", EW: "EW", PT: "PT"
    };
    const unassigned = assets.filter((asset) => {
      const jurisdiction = countryToJurisdiction[asset.situsCountry] ?? asset.situsCountry;
      return !willJurisdictions.has(jurisdiction);
    });
    if (unassigned.length > 0) {
      issues.push({
        code: "ASSET_UNASSIGNED_TO_WILL",
        severity: "warning",
        message: `${unassigned.length} asset(s) in situs countries not covered by any will: ${unassigned.map((a) => a.description).join(", ")}.`,
        ruleCode: "WILL-ASSET-COVERAGE",
        sourceCode: "ADD-055",
        professionalReview: true
      });
    }
  }

  // --- Domicile snap-back risk (ADD-064) ---
  for (const person of people) {
    if (
      person.domicileOfOrigin &&
      person.domicileCountry &&
      person.domicileOfOrigin !== person.domicileCountry &&
      person.residenceCountry &&
      person.residenceCountry !== person.domicileOfOrigin
    ) {
      issues.push({
        code: "DOMICILE_SNAPBACK_RISK",
        severity: "warning",
        message: `${person.legalName} has domicile of origin (${person.domicileOfOrigin}) different from current domicile (${person.domicileCountry}). Snap-back risk exists if domicile of choice is abandoned.`,
        ruleCode: "DOMICILE-SNAPBACK",
        sourceCode: "ADD-064",
        professionalReview: true
      });
    }
  }

  await prisma.ruleEvaluation.deleteMany({ where: { matterId, ...(scenarioId ? { scenarioId } : {}) } });
  await prisma.ruleEvaluation.createMany({
    data: issues.map((issue) => ({
      tenantId: matter.tenantId,
      matterId,
      scenarioId,
      packId: pack.id,
      packVersion: version.version,
      ruleCode: issue.ruleCode,
      outcome: issue.code,
      severity: issue.severity,
      sourceCode: issue.sourceCode,
      factsHash: stableHash({ matterId, scenarioId, people, relationships, assets, dispositions }),
      explanation: issue.message,
      professionalReview: issue.professionalReview
    }))
  });

  if (issues.some((issue) => issue.professionalReview)) {
    await prisma.review.create({
      data: {
        tenantId: matter.tenantId,
        matterId,
        reviewType: "rule_issue_review",
        status: "pending",
        mandatory: true,
        triggerReason: issues.filter((issue) => issue.professionalReview).map((issue) => issue.code).join(", ")
      }
    });
  }

  await audit({
    tenantId: matter.tenantId,
    matterId,
    actorRole: "system",
    eventType: "rules.evaluated",
    entityType: "RuleEvaluation",
    ruleVersion: version.version,
    metadata: {
      issueCount: issues.length,
      issues: issues.map((issue) => issue.code),
      activeConfiguredRules: rules.map((rule) => rule.ruleCode),
      requirementRefs: ["FR-022", "FR-025", "CR-008", "NFR-005"]
    }
  });

  return {
    matterId,
    packId: pack.id,
    packVersion: version.version,
    issues,
    blocked: issues.some((issue) => issue.severity === "blocker"),
    reviewRequired: issues.some((issue) => issue.professionalReview)
  };
}
