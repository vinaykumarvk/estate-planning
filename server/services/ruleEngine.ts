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

export function calculatePTReservedSharePct(hasSpouse: boolean, childCount: number, hasParents: boolean): number {
  if (hasSpouse && childCount >= 2) return 2 / 3;
  if (hasSpouse && childCount === 1) return 2 / 3;
  if (!hasSpouse && childCount >= 2) return 2 / 3;
  if (!hasSpouse && childCount === 1) return 1 / 2;
  if (hasSpouse && childCount === 0 && !hasParents) return 1 / 2;
  if (hasSpouse && childCount === 0 && hasParents) return 2 / 3;
  if (!hasSpouse && childCount === 0 && hasParents) return 1 / 3;
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
      sourceCode: pack.jurisdictionCode === "PT" ? "S4" : "S14",
      professionalReview: true
    });
  }

  if (pack.jurisdictionCode === "EW" && (estateValueByCurrency.GBP ?? 0) > 325000) {
    issues.push({
      code: "TAX_THRESHOLD_TRIGGER",
      severity: "warning",
      message: "Estate value exceeds the configured UK IHT threshold; professional tax review is required.",
      ruleCode: "EW-IHT-THRESHOLD",
      sourceCode: "S6",
      professionalReview: true
    });

    // EW RNRB eligibility check
    const hasResidence = assets.some((a) => a.assetClass === "real_estate" && a.situsCountry === "GB");
    const hasDescendant = relationships.some((r) => r.relationshipType === "child");
    const residenceToDescendant = hasResidence && hasDescendant &&
      dispositions.some((d) => {
        const asset = assets.find((a) => a.id === d.assetId);
        const rel = relationships.find((r) => r.toPersonId === d.beneficiaryPersonId);
        return asset?.assetClass === "real_estate" && rel?.relationshipType === "child";
      });
    if (residenceToDescendant) {
      issues.push({
        code: "EW_RNRB_ELIGIBLE",
        severity: "info",
        message: "Estate may qualify for Residence Nil-Rate Band (RNRB) — primary residence passing to direct descendant.",
        ruleCode: "EW-RNRB",
        sourceCode: "CS-009",
        professionalReview: false
      });
    }
  }

  if (pack.jurisdictionCode === "PT") {
    const hasSpouse = relationships.some((r) => r.relationshipType === "spouse");
    const childCount = relationships.filter((r) => r.relationshipType === "child").length;
    const hasParents = relationships.some((r) => r.relationshipType === "parent");
    const protectedHeirRelationships = relationships.filter((relationship) =>
      ["spouse", "child", "parent"].includes(relationship.relationshipType)
    );
    const reservedPct = calculatePTReservedSharePct(hasSpouse, childCount, hasParents);
    const freeQuota = 1 - reservedPct;
    const nonProtectedPct = dispositions
      .filter((disposition) => disposition.beneficiaryPersonId)
      .filter((disposition) => {
        const relationship = relationships.find((candidate) => candidate.toPersonId === disposition.beneficiaryPersonId);
        return !relationship || !["spouse", "child", "parent"].includes(relationship.relationshipType);
      })
      .reduce((sum, disposition) => sum + (disposition.percentage ?? 0), 0);

    if (protectedHeirRelationships.length > 0 && nonProtectedPct > freeQuota * 100) {
      issues.push({
        code: "RESERVED_SHARE_CONFLICT",
        severity: "blocker",
        message: `Scenario may impair protected heirs' reserved share (${Math.round(reservedPct * 100)}%) under the Portugal pack.`,
        ruleCode: "PT-RESERVED-SHARE",
        sourceCode: "S4",
        professionalReview: true
      });
    }

    // Matrimonial regime review for married PT testator
    if (people.some((p) => p.maritalStatus === "married")) {
      issues.push({
        code: "MATRIMONIAL_REGIME_REVIEW",
        severity: "warning",
        message: "Married testator under Portuguese law requires matrimonial property regime review.",
        ruleCode: "PT-MATRIMONIAL-REGIME",
        sourceCode: "CS-008",
        professionalReview: true
      });
    }

    // PT stamp duty risk on non-exempt beneficiary
    const nonExemptDispositions = dispositions.filter((d) => {
      if (!d.beneficiaryPersonId) return false;
      const rel = relationships.find((r) => r.toPersonId === d.beneficiaryPersonId);
      return !rel || !["spouse", "child", "parent"].includes(rel.relationshipType);
    });
    if (nonExemptDispositions.length > 0) {
      issues.push({
        code: "PT_STAMP_DUTY_RISK",
        severity: "info",
        message: "Non-exempt beneficiary transfers may attract 10% Portuguese stamp duty (Imposto do Selo).",
        ruleCode: "PT-STAMP-DUTY",
        sourceCode: "CS-006",
        professionalReview: false
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
  for (const person of people) {
    if (person.taxResidency && person.taxResidency !== matter.primaryJurisdictionCode &&
        person.taxResidency !== "GB" && person.taxResidency !== "PT") {
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
