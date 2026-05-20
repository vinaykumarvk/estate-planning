import { prisma } from "../db";
import type { DocumentDraftResult, EstatePlanningDocumentType, EstatePlanningReview } from "../../shared/types";
import { decode, stableHash } from "./json";
import { getActivePack } from "./configurationService";
import { lintDocumentGlossary } from "./localizationService";
import { evaluateMatterRules } from "./ruleEngine";
import { audit } from "./auditService";
import { generateEstatePlanningReview } from "./estatePlanningReviewService";
import { t } from "./pdfTranslations";

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

// ---------------------------------------------------------------------------
// Document context & helpers
// ---------------------------------------------------------------------------

interface DocumentContext {
  locale: string;
  review: EstatePlanningReview;
  matter: { id: string; tenantId: string; primaryJurisdictionCode: string; title?: string | null };
  people: Array<{ legalName: string; dateOfBirth: Date | null; nationality: string | null; domicileCountry: string | null; maritalStatus: string | null }>;
  assets: Array<{ description: string; assetClass: string; situsCountry: string | null; currency: string; valuation: number }>;
  liabilities: Array<{ description: string; liabilityType: string; currency: string; amount: number }>;
  wills: Array<{ jurisdictionCode: string; status: string; dateExecuted: Date | null; documentType: string }>;
  goals: Array<{ goalText: string; category: string; priority: string; status: string }>;
  ihtCalcs: Array<{ netEstate: number; taxableEstate: number; ihtDue: number; nrb: number; rnrb: number; transferableNrb: number; charitableRate: boolean; taperRelief: number }>;
  domicileRecs: Array<{ domicileOfOrigin: string | null; domicileOfChoice: string | null; snapBackRisk: boolean; snapBackReason: string | null; dateEstablished: Date | null }>;
}

function fmtCurrency(value: number, currency: string, locale: string): string {
  const localeMap: Record<string, string> = { en: "en-GB", fr: "fr-FR", pt: "pt-BR", es: "es-ES" };
  const lang = locale.slice(0, 2).toLowerCase();
  try {
    return new Intl.NumberFormat(localeMap[lang] ?? "en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

function fmtDate(date: Date | null | undefined, locale: string): string {
  if (!date) return "—";
  const localeMap: Record<string, string> = { en: "en-GB", fr: "fr-FR", pt: "pt-BR", es: "es-ES" };
  const lang = locale.slice(0, 2).toLowerCase();
  return new Intl.DateTimeFormat(localeMap[lang] ?? "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

function pad(text: string, width: number): string {
  return text.length >= width ? text : text + " ".repeat(width - text.length);
}

const RULE = "\u2550".repeat(55);
const THIN_RULE = "\u2500".repeat(55);

function sectionHead(title: string): string {
  return `\n\u2500\u2500\u2500 ${title} \u2500\u2500\u2500\n`;
}

function getEstateDocumentTitle(documentType: EstatePlanningDocumentType, locale: string): string {
  return t(locale, `doc.title.${documentType}`);
}

// ---------------------------------------------------------------------------
// Header block (shared across all document types)
// ---------------------------------------------------------------------------

function buildHeader(ctx: DocumentContext, documentType: EstatePlanningDocumentType): string[] {
  const l = ctx.locale;
  const title = getEstateDocumentTitle(documentType, l);
  const clientName = ctx.people[0]?.legalName ?? ctx.matter.title ?? "—";
  return [
    RULE,
    `  ${title}`,
    `  ${t(l, "doc.label.confidential")}`,
    RULE,
    "",
    `${t(l, "doc.label.prepared_for")}: ${clientName}`,
    `${t(l, "doc.label.matter_ref")}: ${ctx.matter.id}`,
    `${t(l, "doc.label.date")}: ${fmtDate(ctx.review.generatedAt, l)}`,
    "",
  ];
}

// ---------------------------------------------------------------------------
// Reusable content blocks
// ---------------------------------------------------------------------------

function buildClientProfile(ctx: DocumentContext): string[] {
  const l = ctx.locale;
  const lines: string[] = [sectionHead(t(l, "doc.section.client_profile"))];
  lines.push(`  ${pad(t(l, "report.name"), 20)}${pad(t(l, "report.dob"), 14)}${pad(t(l, "report.nationality"), 14)}${t(l, "report.domicile_risk").split(" ")[0]}`);
  for (const p of ctx.people) {
    lines.push(`  ${pad(p.legalName, 20)}${pad(fmtDate(p.dateOfBirth, l), 14)}${pad(p.nationality ?? "—", 14)}${p.domicileCountry ?? "—"}`);
  }
  return lines;
}

function buildAssetOverview(ctx: DocumentContext): string[] {
  const l = ctx.locale;
  const cur = ctx.assets[0]?.currency ?? "GBP";
  const lines: string[] = [sectionHead(t(l, "doc.section.asset_overview"))];
  lines.push(`  ${pad(t(l, "report.description"), 25)}${pad(t(l, "report.type"), 14)}${pad(t(l, "report.jurisdiction"), 10)}${t(l, "report.value")}`);
  for (const a of ctx.assets) {
    lines.push(`  ${pad(a.description.slice(0, 24), 25)}${pad(a.assetClass, 14)}${pad(a.situsCountry ?? "—", 10)}${fmtCurrency(a.valuation, a.currency, l)}`);
  }
  const totalAssets = ctx.assets.reduce((s, a) => s + a.valuation, 0);
  const totalLiabilities = ctx.liabilities.reduce((s, li) => s + li.amount, 0);
  lines.push(`  ${THIN_RULE.slice(0, 50)}`);
  lines.push(`  ${pad(t(l, "doc.label.total_assets") + ":", 49)}${fmtCurrency(totalAssets, cur, l)}`);

  if (ctx.liabilities.length > 0) {
    lines.push("");
    lines.push(sectionHead(t(l, "doc.section.liability_overview")));
    for (const li of ctx.liabilities) {
      lines.push(`  ${pad(li.description.slice(0, 24), 25)}${pad(li.liabilityType, 14)}${fmtCurrency(li.amount, li.currency, l)}`);
    }
    lines.push(`  ${THIN_RULE.slice(0, 50)}`);
    lines.push(`  ${pad(t(l, "doc.label.total_liabilities") + ":", 49)}${fmtCurrency(totalLiabilities, cur, l)}`);
  }

  lines.push(`  ${pad(t(l, "doc.label.net_worth") + ":", 49)}${fmtCurrency(totalAssets - totalLiabilities, cur, l)}`);
  return lines;
}

function buildFundingSection(ctx: DocumentContext): string[] {
  const l = ctx.locale;
  const cur = ctx.assets[0]?.currency ?? "GBP";
  const liq = ctx.review.summaries.liquidity;
  return [
    sectionHead(t(l, "doc.section.funding_liquidity")),
    interpolate(t(l, "doc.narrative.funding_assessment"), {
      liquidAssets: fmtCurrency(liq.liquidAssets, cur, l),
      ihtDue: fmtCurrency(liq.latestIhtDue, cur, l),
      protectionCover: fmtCurrency(liq.availableProtectionCover, cur, l),
      fundingGap: fmtCurrency(liq.fundingGap, cur, l),
    }),
    "",
    `  ${pad(t(l, "doc.label.liquid_assets") + ":", 40)}${fmtCurrency(liq.liquidAssets, cur, l)}`,
    `  ${pad(t(l, "doc.label.latest_iht_due") + ":", 40)}${fmtCurrency(liq.latestIhtDue, cur, l)}`,
    `  ${pad(t(l, "doc.label.available_protection_cover") + ":", 40)}${fmtCurrency(liq.availableProtectionCover, cur, l)}`,
    `  ${pad(t(l, "doc.label.funding_gap") + ":", 40)}${fmtCurrency(liq.fundingGap, cur, l)}`,
  ];
}

function buildCashFlowSection(ctx: DocumentContext): string[] {
  const l = ctx.locale;
  const cur = ctx.assets[0]?.currency ?? "GBP";
  const cf = ctx.review.summaries.cashFlow;
  return [
    sectionHead(t(l, "doc.section.cash_flow")),
    interpolate(t(l, "doc.narrative.cash_flow_assessment"), {
      annualIncome: fmtCurrency(cf.annualIncome, cur, l),
      annualExpenses: fmtCurrency(cf.annualExpenses, cur, l),
      annualSurplus: fmtCurrency(cf.annualSurplus, cur, l),
    }),
    "",
    `  ${pad(t(l, "doc.label.annual_income") + ":", 30)}${fmtCurrency(cf.annualIncome, cur, l)}`,
    `  ${pad(t(l, "doc.label.annual_expenses") + ":", 30)}${fmtCurrency(cf.annualExpenses, cur, l)}`,
    `  ${pad(t(l, "doc.label.annual_surplus") + ":", 30)}${fmtCurrency(cf.annualSurplus, cur, l)}`,
  ];
}

function buildProtectionSection(ctx: DocumentContext): string[] {
  const l = ctx.locale;
  const cur = ctx.assets[0]?.currency ?? "GBP";
  const prot = ctx.review.summaries.protection;
  const clientName = ctx.people[0]?.legalName ?? "—";
  return [
    sectionHead(t(l, "doc.section.protection_review")),
    interpolate(t(l, "doc.narrative.protection_intro"), {
      clientName,
      totalCover: fmtCurrency(prot.totalCover, cur, l),
      coverOutsideEstate: fmtCurrency(prot.coverOutsideEstate, cur, l),
    }),
    "",
    `  ${pad(t(l, "doc.label.total_cover") + ":", 40)}${fmtCurrency(prot.totalCover, cur, l)}`,
    `  ${pad(t(l, "doc.label.cover_outside_estate") + ":", 40)}${fmtCurrency(prot.coverOutsideEstate, cur, l)}`,
    `  ${pad(t(l, "doc.label.policies_missing_trust") + ":", 40)}${prot.policiesMissingTrust}`,
    `  ${pad(t(l, "doc.label.protection_gap") + ":", 40)}${fmtCurrency(prot.protectionGap, cur, l)}`,
    "",
    interpolate(t(l, "doc.narrative.protection_gap"), {
      policiesMissingTrust: String(prot.policiesMissingTrust),
      protectionGap: fmtCurrency(prot.protectionGap, cur, l),
    }),
  ];
}

function buildIhtSection(ctx: DocumentContext): string[] {
  const l = ctx.locale;
  const cur = ctx.assets[0]?.currency ?? "GBP";
  if (ctx.ihtCalcs.length === 0) return [];
  const calc = ctx.ihtCalcs[0];
  return [
    sectionHead(t(l, "doc.section.iht_analysis")),
    `  ${pad(t(l, "doc.label.net_estate") + ":", 40)}${fmtCurrency(calc.netEstate, cur, l)}`,
    `  ${pad(t(l, "doc.label.nrb") + ":", 40)}${fmtCurrency(calc.nrb, cur, l)}`,
    `  ${pad(t(l, "doc.label.rnrb") + ":", 40)}${fmtCurrency(calc.rnrb, cur, l)}`,
    `  ${pad(t(l, "doc.label.transferable_nrb") + ":", 40)}${fmtCurrency(calc.transferableNrb, cur, l)}`,
    `  ${pad(t(l, "doc.label.taxable_estate") + ":", 40)}${fmtCurrency(calc.taxableEstate, cur, l)}`,
    `  ${pad(t(l, "doc.label.iht_due") + ":", 40)}${fmtCurrency(calc.ihtDue, cur, l)}`,
    `  ${pad(t(l, "doc.label.charitable_rate") + ":", 40)}${calc.charitableRate ? t(l, "common.yes") : t(l, "common.no")}`,
    `  ${pad(t(l, "doc.label.taper_relief") + ":", 40)}${fmtCurrency(calc.taperRelief, cur, l)}`,
  ];
}

function buildWillSection(ctx: DocumentContext): string[] {
  const l = ctx.locale;
  if (ctx.wills.length === 0) return [];
  const lines: string[] = [sectionHead(t(l, "doc.section.will_coordination"))];
  lines.push(`  ${pad(t(l, "report.jurisdiction"), 14)}${pad(t(l, "report.type"), 18)}${pad(t(l, "report.status"), 12)}${t(l, "report.date")}`);
  for (const w of ctx.wills) {
    lines.push(`  ${pad(w.jurisdictionCode, 14)}${pad(w.documentType, 18)}${pad(w.status, 12)}${fmtDate(w.dateExecuted, l)}`);
  }
  return lines;
}

function buildGoalsSection(ctx: DocumentContext): string[] {
  const l = ctx.locale;
  const lines: string[] = [sectionHead(t(l, "doc.section.goals_recommendations"))];
  if (ctx.goals.length === 0) return lines;
  ctx.goals.forEach((g, i) => {
    const status = t(l, `doc.status.${g.status}`) || g.status;
    lines.push(`  ${i + 1}. ${g.goalText} \u2014 ${g.category} \u2014 ${g.priority} \u2014 ${status}`);
  });
  return lines;
}

function buildActionsSection(ctx: DocumentContext): string[] {
  const l = ctx.locale;
  const openGaps = ctx.review.requirements.filter((r) => r.status === "gap");
  const partials = ctx.review.requirements.filter((r) => r.status === "partial");
  const blockerGaps = openGaps.filter((r) => r.severity === "blocker");
  const sorted = [...blockerGaps, ...openGaps.filter((g) => g.severity !== "blocker"), ...partials];

  const lines: string[] = [sectionHead(t(l, "doc.section.open_actions"))];
  if (sorted.length === 0) {
    lines.push(t(l, "doc.narrative.no_open_actions"));
  } else {
    sorted.forEach((r, i) => {
      const severity = t(l, `doc.status.${r.severity}`) || r.severity;
      lines.push(`  ${i + 1}. [${r.code}] (${r.area}) ${r.gap ?? r.recommendedAction ?? r.requirement}  [${severity}]`);
    });
  }
  return lines;
}

function buildDomicileSection(ctx: DocumentContext): string[] {
  const l = ctx.locale;
  if (ctx.domicileRecs.length === 0) return [];
  const lines: string[] = [sectionHead(t(l, "doc.section.domicile_analysis"))];
  for (const d of ctx.domicileRecs) {
    lines.push(`  ${pad(t(l, "doc.label.domicile_origin") + ":", 30)}${d.domicileOfOrigin ?? "—"}`);
    lines.push(`  ${pad(t(l, "doc.label.domicile_choice") + ":", 30)}${d.domicileOfChoice ?? "—"}`);
    lines.push(`  ${pad(t(l, "doc.label.snap_back_risk") + ":", 30)}${d.snapBackRisk ? t(l, "common.yes") : t(l, "common.no")}${d.snapBackReason ? ` (${d.snapBackReason})` : ""}`);
    lines.push(`  ${pad(t(l, "doc.label.date_established") + ":", 30)}${fmtDate(d.dateEstablished, l)}`);
    lines.push("");
  }
  return lines;
}

function buildCrossBorderSection(ctx: DocumentContext): string[] {
  const l = ctx.locale;
  const cb = ctx.review.summaries.crossBorderTax;
  const lines: string[] = [sectionHead(t(l, "doc.section.cross_border_tax"))];
  lines.push(`  ${pad(t(l, "doc.label.countries") + ":", 30)}${cb.countries.join(", ") || "—"}`);
  lines.push(`  ${pad(t(l, "doc.label.unresolved_pairs") + ":", 30)}${cb.unresolvedPairs.join(", ") || "—"}`);
  if (cb.dtaPositions.length > 0) {
    lines.push("");
    for (const dta of cb.dtaPositions) {
      lines.push(`  ${dta.countryA}\u2013${dta.countryB}: ${dta.reliefType} (${dta.status})`);
    }
  }
  return lines;
}

function buildDisclaimerSection(ctx: DocumentContext): string[] {
  const l = ctx.locale;
  return [
    sectionHead(t(l, "doc.section.disclaimer")),
    t(l, "doc.narrative.disclaimer_text"),
  ];
}

// ---------------------------------------------------------------------------
// Per-document-type builders
// ---------------------------------------------------------------------------

function buildEstatePlanningSummary(ctx: DocumentContext): string {
  const l = ctx.locale;
  const clientName = ctx.people[0]?.legalName ?? "—";
  return [
    ...buildHeader(ctx, "estate_planning_summary"),
    sectionHead(t(l, "doc.section.executive_summary")),
    interpolate(t(l, "doc.narrative.summary_intro"), { clientName }),
    "",
    interpolate(t(l, "doc.narrative.fitment_overview"), {
      fitmentPercent: ctx.review.fitmentPercent,
      totalRequirements: ctx.review.applicableRequirementCount,
      metCount: ctx.review.metRequirementCount,
      partialCount: ctx.review.partialRequirementCount,
      gapCount: ctx.review.gapRequirementCount,
      blockerCount: ctx.review.blockerCount,
    }),
    "",
    ...buildClientProfile(ctx),
    "",
    ...buildAssetOverview(ctx),
    "",
    ...buildFundingSection(ctx),
    "",
    ...buildCashFlowSection(ctx),
    "",
    ...buildProtectionSection(ctx),
    "",
    ...buildIhtSection(ctx),
    "",
    ...buildWillSection(ctx),
    "",
    ...buildCrossBorderSection(ctx),
    "",
    ...buildGoalsSection(ctx),
    "",
    ...buildActionsSection(ctx),
    "",
    ...buildDisclaimerSection(ctx),
  ].join("\n");
}

function buildProtectionReviewLetter(ctx: DocumentContext): string {
  const l = ctx.locale;
  const clientName = ctx.people[0]?.legalName ?? "—";
  const cur = ctx.assets[0]?.currency ?? "GBP";
  const prot = ctx.review.summaries.protection;
  return [
    ...buildHeader(ctx, "protection_review_letter"),
    sectionHead(t(l, "doc.section.executive_summary")),
    interpolate(t(l, "doc.narrative.protection_intro"), {
      clientName,
      totalCover: fmtCurrency(prot.totalCover, cur, l),
      coverOutsideEstate: fmtCurrency(prot.coverOutsideEstate, cur, l),
    }),
    "",
    ...buildClientProfile(ctx),
    "",
    ...buildProtectionSection(ctx),
    "",
    ...buildFundingSection(ctx),
    "",
    ...buildGoalsSection(ctx),
    "",
    ...buildActionsSection(ctx),
    "",
    ...buildDisclaimerSection(ctx),
  ].join("\n");
}

function buildIncapacityInstruction(ctx: DocumentContext): string {
  const l = ctx.locale;
  const clientName = ctx.people[0]?.legalName ?? "—";
  const incapReqs = ctx.review.requirements.filter((r) => r.area === "Incapacity");
  return [
    ...buildHeader(ctx, "incapacity_instruction"),
    sectionHead(t(l, "doc.section.executive_summary")),
    interpolate(t(l, "doc.narrative.incapacity_intro"), { clientName }),
    "",
    ...buildClientProfile(ctx),
    "",
    sectionHead(t(l, "doc.section.incapacity_planning")),
    ...incapReqs.map((r) => {
      const status = t(l, `doc.status.${r.status}`) || r.status;
      return `  [${r.code}] ${status}: ${r.gap ?? r.recommendedAction ?? r.requirement}`;
    }),
    ...(incapReqs.length === 0 ? [t(l, "doc.narrative.no_open_actions")] : []),
    "",
    ...buildActionsSection(ctx),
    "",
    ...buildDisclaimerSection(ctx),
  ].join("\n");
}

function buildTrustMemo(ctx: DocumentContext): string {
  const l = ctx.locale;
  const clientName = ctx.people[0]?.legalName ?? "—";
  const trustReqs = ctx.review.requirements.filter((r) => r.area === "Trusts" || r.area === "Outside-estate assets");
  return [
    ...buildHeader(ctx, "trust_memo"),
    sectionHead(t(l, "doc.section.executive_summary")),
    interpolate(t(l, "doc.narrative.trust_intro"), { clientName }),
    "",
    ...buildClientProfile(ctx),
    "",
    sectionHead(t(l, "doc.section.trust_planning")),
    ...trustReqs.map((r) => {
      const status = t(l, `doc.status.${r.status}`) || r.status;
      return `  [${r.code}] ${status}: ${r.gap ?? r.recommendedAction ?? r.requirement}`;
    }),
    ...(trustReqs.length === 0 ? [t(l, "doc.narrative.no_open_actions")] : []),
    "",
    ...buildAssetOverview(ctx),
    "",
    ...buildIhtSection(ctx),
    "",
    ...buildActionsSection(ctx),
    "",
    ...buildDisclaimerSection(ctx),
  ].join("\n");
}

function buildDeedOfVariation(ctx: DocumentContext): string {
  const l = ctx.locale;
  const clientName = ctx.people[0]?.legalName ?? "—";
  const reliefReqs = ctx.review.requirements.filter((r) => r.area === "Estate reliefs" || r.area === "Lifetime gifts");
  return [
    ...buildHeader(ctx, "deed_of_variation_instruction"),
    sectionHead(t(l, "doc.section.executive_summary")),
    interpolate(t(l, "doc.narrative.deed_intro"), { clientName }),
    "",
    ...buildClientProfile(ctx),
    "",
    sectionHead(t(l, "doc.section.estate_reliefs")),
    ...reliefReqs.map((r) => {
      const status = t(l, `doc.status.${r.status}`) || r.status;
      return `  [${r.code}] ${status}: ${r.gap ?? r.recommendedAction ?? r.requirement}`;
    }),
    ...(reliefReqs.length === 0 ? [t(l, "doc.narrative.no_open_actions")] : []),
    "",
    ...buildIhtSection(ctx),
    "",
    ...buildActionsSection(ctx),
    "",
    ...buildDisclaimerSection(ctx),
  ].join("\n");
}

function buildCrossBorderTaxNote(ctx: DocumentContext): string {
  const l = ctx.locale;
  const clientName = ctx.people[0]?.legalName ?? "—";
  const cb = ctx.review.summaries.crossBorderTax;
  return [
    ...buildHeader(ctx, "cross_border_tax_note"),
    sectionHead(t(l, "doc.section.executive_summary")),
    interpolate(t(l, "doc.narrative.cross_border_intro"), {
      clientName,
      countryCount: cb.countries.length,
    }),
    "",
    ...buildClientProfile(ctx),
    "",
    ...buildCrossBorderSection(ctx),
    "",
    ...buildDomicileSection(ctx),
    "",
    ...buildIhtSection(ctx),
    "",
    ...buildActionsSection(ctx),
    "",
    ...buildDisclaimerSection(ctx),
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildEstatePlanningDocumentContent(
  documentType: EstatePlanningDocumentType,
  ctx: DocumentContext
): string {
  switch (documentType) {
    case "estate_planning_summary":
      return buildEstatePlanningSummary(ctx);
    case "protection_review_letter":
      return buildProtectionReviewLetter(ctx);
    case "incapacity_instruction":
      return buildIncapacityInstruction(ctx);
    case "trust_memo":
      return buildTrustMemo(ctx);
    case "deed_of_variation_instruction":
      return buildDeedOfVariation(ctx);
    case "cross_border_tax_note":
      return buildCrossBorderTaxNote(ctx);
  }
}

export async function generateEstatePlanningDocument(
  matterId: string,
  documentType: EstatePlanningDocumentType,
  locale?: string
): Promise<DocumentDraftResult> {
  const matter = await prisma.matter.findUniqueOrThrow({ where: { id: matterId } });
  const selectedLocale = locale ?? matter.languageOfRecord;

  const [review, people, assets, liabilities, wills, goals, ihtCalcs, domicileRecs] =
    await Promise.all([
      generateEstatePlanningReview(matterId, matter.tenantId),
      prisma.person.findMany({ where: { matterId } }),
      prisma.asset.findMany({ where: { matterId } }),
      prisma.liability.findMany({ where: { matterId } }),
      prisma.willCoordination.findMany({ where: { matterId } }),
      prisma.clientGoal.findMany({ where: { matterId } }),
      prisma.ihtCalculation.findMany({ where: { matterId } }),
      prisma.domicileRecord.findMany({ where: { tenantId: matter.tenantId } }),
    ]);

  const ctx: DocumentContext = {
    locale: selectedLocale,
    review,
    matter: { id: matter.id, tenantId: matter.tenantId, primaryJurisdictionCode: matter.primaryJurisdictionCode, title: matter.title },
    people,
    assets,
    liabilities,
    wills,
    goals,
    ihtCalcs,
    domicileRecs,
  };

  const content = buildEstatePlanningDocumentContent(documentType, ctx);
  const title = getEstateDocumentTitle(documentType, selectedLocale);
  const hash = stableHash({ matterId, documentType, content, generatedAt: review.generatedAt.toISOString() });
  const pendingReview = review.blockerCount > 0 || review.gapRequirementCount > 0;

  const document = await prisma.document.create({
    data: {
      tenantId: matter.tenantId,
      matterId,
      documentType,
      jurisdictionCode: matter.primaryJurisdictionCode,
      locale: selectedLocale,
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
