import { prisma } from "../db";
import type { DocumentDraftResult, EstatePlanningDocumentType, EstatePlanningReview } from "../../shared/types";
import { decode, stableHash } from "./json";
import { getActivePack } from "./configurationService";
import { lintDocumentGlossary } from "./localizationService";
import { evaluateMatterRules } from "./ruleEngine";
import { audit } from "./auditService";
import { generateEstatePlanningReview } from "./estatePlanningReviewService";

function evaluateClauseCondition(condition: string | null, context: Record<string, boolean>): boolean {
  if (!condition) return true;
  const key = condition.trim();
  if (key.startsWith("!")) {
    return context[key.slice(1)] === false || context[key.slice(1)] === undefined;
  }
  return context[key] === true;
}

export async function generateWillDraft(matterId: string, locale?: string): Promise<DocumentDraftResult> {
  const matter = await prisma.matter.findUniqueOrThrow({ where: { id: matterId } });
  const pack = await getActivePack(matter.primaryJurisdictionCode);
  const [people, scenarios, dispositions, reviews] = await Promise.all([
    prisma.person.findMany({ where: { matterId }, orderBy: { createdAt: "asc" } }),
    prisma.scenario.findMany({ where: { matterId }, orderBy: { createdAt: "asc" } }),
    prisma.disposition.findMany({ where: { matterId }, orderBy: { createdAt: "asc" } }),
    prisma.review.findMany({ where: { matterId, status: "pending", mandatory: true } })
  ]);
  const selectedLocale = locale ?? matter.languageOfRecord;
  const template =
    (await prisma.documentTemplate.findFirst({
      where: { packId: pack.id, documentType: "will", locale: selectedLocale, status: "approved" }
    })) ??
    (await prisma.documentTemplate.findFirst({
      where: { packId: pack.id, documentType: "will", status: "approved" }
    }));

  if (!template) {
    throw new Error(`No approved will template for pack ${pack.id}`);
  }

  const [ruleSummary, clauses, relationships] = await Promise.all([
    evaluateMatterRules(matterId, scenarios[0]?.id),
    prisma.clause.findMany({ where: { templateId: template.id }, orderBy: { clauseCode: "asc" } }),
    prisma.relationship.findMany({ where: { matterId } })
  ]);

  const additionalJurisdictions = decode<string[]>(matter.additionalJurisdictions, []);
  const assets = await prisma.asset.findMany({ where: { matterId } });
  const assetCountries = [...new Set(assets.map((a) => a.situsCountry).filter(Boolean))];
  const crossBorder = additionalJurisdictions.length > 0 || assetCountries.length > 1;
  const hasProtectedHeirs = relationships.some((r) => ["spouse", "child", "parent"].includes(r.relationshipType));
  const hasMinorBeneficiary = relationships.some((r) => r.minor || r.dependent);

  const clauseContext: Record<string, boolean> = {
    crossBorder,
    hasProtectedHeirs,
    reservedShareRisk: hasProtectedHeirs && ["SN", "CM", "MZ", "AO"].includes(matter.primaryJurisdictionCode),
    hasMinorBeneficiary,
    married: people.some((p) => p.maritalStatus === "married")
  };

  const clausesIncluded: string[] = [];
  const clausesExcluded: string[] = [];
  const clauseContent: string[] = [];

  for (const clause of clauses) {
    const included = evaluateClauseCondition(clause.condition, clauseContext);
    if (included) {
      clausesIncluded.push(clause.clauseCode);
      clauseContent.push(`\n--- ${clause.title} ---\n${clause.body}`);
    } else {
      clausesExcluded.push(clause.clauseCode);
    }
  }

  const testatorName = people[0]?.legalName ?? "Unassigned testator";
  const residueDisposition = dispositions.find((disposition) => disposition.giftType === "residue") ?? dispositions[0];
  const executorDisposition = dispositions.find((disposition) => disposition.giftType === "specific") ?? dispositions[0];
  const content = template.body
    .replaceAll("{{testator}}", testatorName)
    .replaceAll("{{residue}}", residueDisposition?.beneficiaryLabel ?? "To be confirmed")
    .replaceAll("{{executor}}", executorDisposition?.beneficiaryLabel ?? "To be appointed")
    + clauseContent.join("");
  const lint = await lintDocumentGlossary(pack.id, template.locale, content);
  if (!lint.passed) {
    throw new Error(`Document glossary lint failed: ${lint.violations.map((violation) => violation.prohibited).join(", ")}`);
  }

  const pendingReview = reviews.length > 0 || ruleSummary.reviewRequired;
  const hash = stableHash({ matterId, templateId: template.id, content, packVersion: pack.activeVersion });
  const document = await prisma.document.create({
    data: {
      tenantId: matter.tenantId,
      matterId,
      templateId: template.id,
      documentType: "will",
      jurisdictionCode: matter.primaryJurisdictionCode,
      locale: template.locale,
      status: "draft",
      version: template.version,
      title: template.title,
      content: [
        content,
        "",
        `Template version: ${template.version}`,
        `Jurisdiction pack: ${pack.id} ${pack.activeVersion}`,
        `Review status: ${pendingReview ? "pending professional review" : "ready for professional review"}`
      ].join("\n"),
      hash,
      sensitivityClass: "confidential",
      reviewStatus: pendingReview ? "pending" : "required",
      executionStatus: "not_started"
    }
  });

  await prisma.review.create({
    data: {
      tenantId: matter.tenantId,
      matterId,
      documentId: document.id,
      reviewType: "document_review",
      status: "pending",
      mandatory: true,
      triggerReason: pendingReview ? "Mandatory issues or cross-border checks require review." : "All wills require professional review before finalization."
    }
  });

  await audit({
    tenantId: matter.tenantId,
    matterId,
    actorRole: "system",
    eventType: "document.generated",
    entityType: "Document",
    entityId: document.id,
    ruleVersion: pack.activeVersion ?? undefined,
    metadata: { templateId: template.id, clausesIncluded, clausesExcluded, requirementRefs: ["FR-026", "FR-027", "FR-028", "FR-029", "SEC-013"] }
  });

  return {
    documentId: document.id,
    title: document.title,
    status: document.status,
    reviewStatus: document.reviewStatus as DocumentDraftResult["reviewStatus"],
    executionStatus: document.executionStatus,
    hash: document.hash,
    content: document.content
  };
}

const estateDocumentTitles: Record<EstatePlanningDocumentType, string> = {
  estate_planning_summary: "Estate Planning Summary Report",
  protection_review_letter: "Protection Review Letter",
  incapacity_instruction: "Incapacity Planning Instructions",
  trust_memo: "Trust Planning Memorandum",
  deed_of_variation_instruction: "Deed of Variation Instructions",
  cross_border_tax_note: "Cross-Border Tax Position Note"
};

export function buildEstatePlanningDocumentContent(
  documentType: EstatePlanningDocumentType,
  review: EstatePlanningReview
): string {
  const openGaps = review.requirements.filter((requirement) => requirement.status === "gap");
  const partials = review.requirements.filter((requirement) => requirement.status === "partial");
  const blockerGaps = openGaps.filter((requirement) => requirement.severity === "blocker");
  const heading = estateDocumentTitles[documentType];

  const baseSections = [
    heading,
    "",
    `Matter: ${review.matterId}`,
    `Generated: ${review.generatedAt.toISOString()}`,
    `Core estate fitment: ${review.fitmentPercent}%`,
    `Met: ${review.metRequirementCount}; Partial: ${review.partialRequirementCount}; Gaps: ${review.gapRequirementCount}; Blockers: ${review.blockerCount}`,
    "",
  ];

  const fundingSection = [
    "Funding and liquidity",
    `Liquid assets: ${review.summaries.liquidity.liquidAssets}`,
    `Latest IHT due: ${review.summaries.liquidity.latestIhtDue}`,
    `Protection cover outside estate: ${review.summaries.liquidity.availableProtectionCover}`,
    `Funding gap: ${review.summaries.liquidity.fundingGap}`,
    ""
  ];

  const actionSection = [
    "Open professional actions",
    ...[...blockerGaps, ...openGaps.filter((gap) => gap.severity !== "blocker"), ...partials].map((requirement) =>
      `${requirement.code} (${requirement.area}): ${requirement.gap ?? requirement.recommendedAction ?? requirement.requirement}`
    ),
    blockerGaps.length === 0 && openGaps.length === 0 && partials.length === 0 ? "No open estate-planning gaps recorded." : "",
    ""
  ];

  switch (documentType) {
    case "estate_planning_summary":
      return [
        ...baseSections,
        ...fundingSection,
        "Cash flow",
        `Annual income: ${review.summaries.cashFlow.annualIncome}`,
        `Annual expenses: ${review.summaries.cashFlow.annualExpenses}`,
        `Annual surplus: ${review.summaries.cashFlow.annualSurplus}`,
        "",
        "Cross-border tax",
        `Countries: ${review.summaries.crossBorderTax.countries.join(", ") || "None recorded"}`,
        `Unresolved pairs: ${review.summaries.crossBorderTax.unresolvedPairs.join(", ") || "None"}`,
        "",
        ...actionSection
      ].join("\n");
    case "protection_review_letter":
      return [
        ...baseSections,
        "Protection review",
        `Total cover: ${review.summaries.protection.totalCover}`,
        `Cover outside estate: ${review.summaries.protection.coverOutsideEstate}`,
        `Policies missing trust review: ${review.summaries.protection.policiesMissingTrust}`,
        `Protection gap: ${review.summaries.protection.protectionGap}`,
        "",
        ...actionSection
      ].join("\n");
    case "incapacity_instruction":
      return [
        ...baseSections,
        "Incapacity planning",
        ...review.requirements
          .filter((requirement) => requirement.area === "Incapacity")
          .map((requirement) => `${requirement.status}: ${requirement.gap ?? requirement.recommendedAction ?? requirement.requirement}`),
        "",
        ...actionSection
      ].join("\n");
    case "trust_memo":
      return [
        ...baseSections,
        "Trust planning",
        ...review.requirements
          .filter((requirement) => requirement.area === "Trusts" || requirement.area === "Outside-estate assets")
          .map((requirement) => `${requirement.code}: ${requirement.status} - ${requirement.gap ?? requirement.recommendedAction ?? requirement.requirement}`),
        "",
        ...actionSection
      ].join("\n");
    case "deed_of_variation_instruction":
      return [
        ...baseSections,
        "Estate reliefs",
        ...review.requirements
          .filter((requirement) => requirement.area === "Estate reliefs" || requirement.area === "Lifetime gifts")
          .map((requirement) => `${requirement.code}: ${requirement.status} - ${requirement.gap ?? requirement.recommendedAction ?? requirement.requirement}`),
        "",
        ...actionSection
      ].join("\n");
    case "cross_border_tax_note":
      return [
        ...baseSections,
        "Cross-border tax",
        `Countries: ${review.summaries.crossBorderTax.countries.join(", ") || "None recorded"}`,
        `Unresolved DTA/no-DTA pairs: ${review.summaries.crossBorderTax.unresolvedPairs.join(", ") || "None"}`,
        "",
        ...actionSection
      ].join("\n");
  }
}

export async function generateEstatePlanningDocument(
  matterId: string,
  documentType: EstatePlanningDocumentType,
  locale?: string
): Promise<DocumentDraftResult> {
  const matter = await prisma.matter.findUniqueOrThrow({ where: { id: matterId } });
  const review = await generateEstatePlanningReview(matterId, matter.tenantId);
  const content = buildEstatePlanningDocumentContent(documentType, review);
  const title = estateDocumentTitles[documentType];
  const hash = stableHash({ matterId, documentType, content, generatedAt: review.generatedAt.toISOString() });
  const pendingReview = review.blockerCount > 0 || review.gapRequirementCount > 0;

  const document = await prisma.document.create({
    data: {
      tenantId: matter.tenantId,
      matterId,
      documentType,
      jurisdictionCode: matter.primaryJurisdictionCode,
      locale: locale ?? matter.languageOfRecord,
      status: "draft",
      version: "1.0",
      title,
      content,
      hash,
      sensitivityClass: "confidential",
      reviewStatus: pendingReview ? "pending" : "required",
      executionStatus: "not_started"
    }
  });

  await prisma.review.create({
    data: {
      tenantId: matter.tenantId,
      matterId,
      documentId: document.id,
      reviewType: "estate_planning_document_review",
      status: "pending",
      mandatory: true,
      triggerReason: pendingReview
        ? "Estate planning gaps remain and require qualified professional sign-off."
        : "Estate planning document requires professional approval before finalization."
    }
  });

  await audit({
    tenantId: matter.tenantId,
    matterId,
    actorRole: "system",
    eventType: "document.generated",
    entityType: "Document",
    entityId: document.id,
    metadata: {
      documentType,
      fitmentPercent: review.fitmentPercent,
      blockerCount: review.blockerCount,
      requirementRefs: ["ADD-011", "ADD-016", "ADD-020", "ADD-024", "ADD-032", "ADD-036", "ADD-058", "ADD-061"]
    }
  });

  return {
    documentId: document.id,
    title: document.title,
    status: document.status,
    reviewStatus: document.reviewStatus as DocumentDraftResult["reviewStatus"],
    executionStatus: document.executionStatus,
    hash: document.hash,
    content: document.content
  };
}

export async function finalizeDocument(documentId: string, reviewerUserId: string) {
  const document = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
  const pendingMandatoryReviews = await prisma.review.count({
    where: { matterId: document.matterId, mandatory: true, status: { not: "approved" } }
  });

  if (pendingMandatoryReviews > 0) {
    throw new Error("Document cannot be finalized while mandatory reviews are unresolved.");
  }

  const executionPolicy = document.templateId
    ? decode<Record<string, unknown>>(
        (await prisma.documentTemplate.findUnique({ where: { id: document.templateId } }))?.executionPolicy,
        {}
      )
    : {};

  const finalized = await prisma.document.update({
    where: { id: documentId },
    data: {
      status: "finalized",
      reviewStatus: "approved",
      finalizedAt: new Date(),
      executionStatus: "awaiting_execution"
    }
  });

  await prisma.signatureEvent.create({
    data: {
      tenantId: document.tenantId,
      matterId: document.matterId,
      documentId: document.id,
      status: "scheduled",
      ceremonyType: String(executionPolicy.ceremony ?? "wet_ink"),
      witnessDetails: "[]"
    }
  });

  await audit({
    tenantId: document.tenantId,
    matterId: document.matterId,
    actorUserId: reviewerUserId,
    actorRole: "qualified_professional",
    eventType: "document.finalized",
    entityType: "Document",
    entityId: document.id,
    metadata: { requirementRefs: ["FR-028", "FR-030", "FR-031"] }
  });

  return finalized;
}

export async function approveReview(reviewId: string, reviewerUserId: string, rationale: string) {
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: {
      status: "approved",
      reviewerUserId,
      decision: "approved",
      rationale,
      completedAt: new Date()
    }
  });

  await audit({
    tenantId: review.tenantId,
    matterId: review.matterId,
    actorUserId: reviewerUserId,
    actorRole: "qualified_professional",
    eventType: "review.approved",
    entityType: "Review",
    entityId: review.id,
    metadata: { rationale, requirementRefs: ["FR-028", "CR-012"] }
  });

  return review;
}
