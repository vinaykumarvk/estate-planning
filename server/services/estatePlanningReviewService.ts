import { prisma } from "../db";
import {
  createEstatePlanningRecordSchema,
  grobAssessmentSchema,
  quickSuccessionReliefSchema,
  updateEstatePlanningRecordSchema
} from "../../shared/schemas";
import { decode, encode } from "./json";
import type {
  CashFlowSummary,
  CrossBorderTaxSummary,
  EstatePlanningRecordDto,
  EstatePlanningRecordType,
  EstatePlanningReview,
  EstateRequirementFit,
  EstateRequirementSeverity,
  EstateRequirementStatus,
  GrobRiskAssessmentResult,
  LiquiditySummary,
  ProtectionSummary,
  QuickSuccessionReliefResult
} from "../../shared/types";

type Payload = Record<string, unknown>;

interface ReviewFactRecord {
  id: string;
  matterId: string;
  personId: string | null;
  recordType: EstatePlanningRecordType;
  title: string;
  status: string;
  reviewStatus: string;
  payload: Payload;
  evidenceRefs: string[];
  effectiveDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EstatePlanningReviewFacts {
  matter: {
    id: string;
    primaryJurisdictionCode: string;
    additionalJurisdictions: string[];
  };
  people: Array<{
    id: string;
    legalName: string;
    dateOfBirth: Date | null;
    domicileCountry: string | null;
    residenceCountry: string | null;
    taxResidency: string | null;
  }>;
  assets: Array<{
    id: string;
    assetClass: string;
    description: string;
    situsCountry: string;
    currency: string;
    valuation: number;
    valuationDate: Date;
    ownershipType: string;
    ownershipShare: number;
    beneficiaryDesignation: string | null;
    todPod: boolean;
    dynamicFields: string;
    evidenceRefs: string;
    digitalAccessMethod: string | null;
    volatilityFlag: boolean;
  }>;
  liabilities: Array<{ id: string; amount: number; currency: string }>;
  lifetimeGifts: Array<{
    id: string;
    value: number;
    currency: string;
    exemptionClaimed: string;
    petOrClt: string;
    evidenceRefs: string;
  }>;
  ihtCalculations: Array<{
    id: string;
    personId: string;
    ihtDue: number;
    createdAt: Date;
  }>;
  wills: Array<{
    id: string;
    jurisdictionCode: string;
    status: string;
    assetIds: string;
  }>;
  domicileRecords: Array<{
    id: string;
    personId: string;
    evidenceSummary: string | null;
    snapBackRisk: boolean;
    snapBackReason: string | null;
  }>;
  clientGoals: Array<{
    id: string;
    status: string;
    linkedScenarioIds: string;
  }>;
  records: ReviewFactRecord[];
  referenceDate: Date;
}

const RECORD_TYPES = new Set<EstatePlanningRecordType>([
  "income_record",
  "expense_record",
  "protection_policy",
  "outside_estate_asset",
  "pension_nomination",
  "life_assurance_trust",
  "trust_structure",
  "deed_of_variation",
  "gift_received",
  "grob_assessment",
  "incapacity_instrument",
  "dta_position",
  "professional_referral"
]);

export async function listEstatePlanningRecords(
  matterId: string,
  tenantId: string,
  recordType?: EstatePlanningRecordType
): Promise<EstatePlanningRecordDto[]> {
  const records = await prisma.estatePlanningRecord.findMany({
    where: {
      matterId,
      tenantId,
      status: { not: "archived" },
      ...(recordType ? { recordType } : {})
    },
    orderBy: [{ recordType: "asc" }, { updatedAt: "desc" }]
  });
  return records.map(mapEstatePlanningRecord);
}

export async function createEstatePlanningRecord(input: unknown): Promise<EstatePlanningRecordDto> {
  const data = createEstatePlanningRecordSchema.parse(input);
  const record = await prisma.estatePlanningRecord.create({
    data: {
      tenantId: data.tenantId,
      matterId: data.matterId,
      personId: data.personId,
      recordType: data.recordType,
      title: data.title,
      status: data.status,
      reviewStatus: data.reviewStatus,
      payload: encode(data.payload),
      evidenceRefs: encode(data.evidenceRefs),
      effectiveDate: data.effectiveDate
    }
  });
  return mapEstatePlanningRecord(record);
}

export async function updateEstatePlanningRecord(
  recordId: string,
  tenantId: string,
  input: unknown
): Promise<EstatePlanningRecordDto> {
  const existing = await prisma.estatePlanningRecord.findFirst({ where: { id: recordId, tenantId } });
  if (!existing) throw new Error("Estate planning record not found");

  const data = updateEstatePlanningRecordSchema.parse(input);
  const record = await prisma.estatePlanningRecord.update({
    where: { id: recordId },
    data: {
      ...(data.personId !== undefined ? { personId: data.personId } : {}),
      ...(data.recordType !== undefined ? { recordType: data.recordType } : {}),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.reviewStatus !== undefined ? { reviewStatus: data.reviewStatus } : {}),
      ...(data.payload !== undefined ? { payload: encode(data.payload) } : {}),
      ...(data.evidenceRefs !== undefined ? { evidenceRefs: encode(data.evidenceRefs) } : {}),
      ...(data.effectiveDate !== undefined ? { effectiveDate: data.effectiveDate } : {})
    }
  });
  return mapEstatePlanningRecord(record);
}

export async function archiveEstatePlanningRecord(recordId: string, tenantId: string): Promise<EstatePlanningRecordDto> {
  const existing = await prisma.estatePlanningRecord.findFirst({ where: { id: recordId, tenantId } });
  if (!existing) throw new Error("Estate planning record not found");
  const record = await prisma.estatePlanningRecord.update({
    where: { id: recordId },
    data: { status: "archived" }
  });
  return mapEstatePlanningRecord(record);
}

export async function generateEstatePlanningReview(
  matterId: string,
  tenantId: string,
  referenceDate = new Date()
): Promise<EstatePlanningReview> {
  const [
    matter,
    people,
    assets,
    liabilities,
    lifetimeGifts,
    ihtCalculations,
    wills,
    domicileRecords,
    clientGoals,
    records,
    cashFlowItems,
    protectionPolicies,
    trustStructures,
    incapacityInstruments,
    taxPositions,
    reliefAssessments,
    outsideEstateNominations
  ] = await Promise.all([
    prisma.matter.findFirstOrThrow({ where: { id: matterId, tenantId } }),
    prisma.person.findMany({ where: { matterId, tenantId } }),
    prisma.asset.findMany({ where: { matterId, tenantId } }),
    prisma.liability.findMany({ where: { matterId, tenantId } }),
    prisma.lifetimeGift.findMany({ where: { matterId, tenantId } }),
    prisma.ihtCalculation.findMany({ where: { matterId, tenantId }, orderBy: { createdAt: "desc" } }),
    prisma.willCoordination.findMany({ where: { matterId, tenantId } }),
    prisma.domicileRecord.findMany({ where: { tenantId } }),
    prisma.clientGoal.findMany({ where: { matterId, tenantId } }),
    prisma.estatePlanningRecord.findMany({
      where: { matterId, tenantId, status: { not: "archived" } },
      orderBy: [{ recordType: "asc" }, { updatedAt: "desc" }]
    }),
    prisma.estateCashFlowItem.findMany({ where: { matterId, tenantId, status: { not: "archived" } } }),
    prisma.protectionPolicy.findMany({ where: { matterId, tenantId, status: { not: "archived" } } }),
    prisma.estateTrustStructure.findMany({ where: { matterId, tenantId, status: { not: "archived" } } }),
    prisma.incapacityInstrument.findMany({ where: { matterId, tenantId, status: { not: "archived" } } }),
    prisma.crossBorderTaxPosition.findMany({ where: { matterId, tenantId, status: { not: "archived" } } }),
    prisma.estateReliefAssessment.findMany({ where: { matterId, tenantId, status: { not: "archived" } } }),
    prisma.outsideEstateNomination.findMany({ where: { matterId, tenantId, status: { not: "archived" } } })
  ]);

  const personIds = new Set(people.map((person) => person.id));
  const relevantDomicileRecords = domicileRecords.filter((record) => personIds.has(record.personId));
  const typedRecords = [
    ...cashFlowItems.map(mapCashFlowItemRecord),
    ...protectionPolicies.map(mapProtectionPolicyRecord),
    ...trustStructures.map(mapTrustStructureRecord),
    ...incapacityInstruments.map(mapIncapacityInstrumentRecord),
    ...taxPositions.map(mapTaxPositionRecord),
    ...reliefAssessments.map(mapReliefAssessmentRecord),
    ...outsideEstateNominations.map(mapOutsideEstateNominationRecord)
  ];

  return buildEstatePlanningReview({
    matter: {
      id: matter.id,
      primaryJurisdictionCode: matter.primaryJurisdictionCode,
      additionalJurisdictions: decode<string[]>(matter.additionalJurisdictions, [])
    },
    people,
    assets,
    liabilities,
    lifetimeGifts,
    ihtCalculations,
    wills,
    domicileRecords: relevantDomicileRecords,
    clientGoals,
    records: [...records.map((record) => mapReviewRecord(record)), ...typedRecords],
    referenceDate
  });
}

export function buildEstatePlanningReview(facts: EstatePlanningReviewFacts): EstatePlanningReview {
  const records = facts.records.filter((record) => record.status !== "archived");
  const byType = groupRecordsByType(records);
  const cashFlow = buildCashFlowSummary(byType, facts.lifetimeGifts);
  const latestIhtDue = latestIhtByPerson(facts.ihtCalculations);
  const liquidity = buildLiquiditySummary(facts.assets, facts.liabilities, byType, latestIhtDue);
  const protection = buildProtectionSummary(facts.assets, byType, Math.max(0, liquidity.latestIhtDue - liquidity.liquidAssets));
  liquidity.availableProtectionCover = protection.coverOutsideEstate;
  liquidity.fundingGap = Math.max(0, liquidity.latestIhtDue - liquidity.liquidAssets - protection.coverOutsideEstate);
  const crossBorderTax = buildCrossBorderTaxSummary(facts, byType);

  const requirements = buildRequirementFit({
    facts,
    byType,
    cashFlow,
    liquidity,
    protection,
    crossBorderTax
  });

  const applicable = requirements.filter((requirement) => requirement.status !== "not_applicable");
  const metCount = requirements.filter((requirement) => requirement.status === "met").length;
  const partialCount = requirements.filter((requirement) => requirement.status === "partial").length;
  const gapCount = requirements.filter((requirement) => requirement.status === "gap").length;
  const score = applicable.length
    ? Math.round(((metCount + partialCount * 0.5) / applicable.length) * 100)
    : 100;

  return {
    matterId: facts.matter.id,
    generatedAt: facts.referenceDate,
    fitmentPercent: score,
    applicableRequirementCount: applicable.length,
    metRequirementCount: metCount,
    partialRequirementCount: partialCount,
    gapRequirementCount: gapCount,
    blockerCount: requirements.filter((requirement) => requirement.status === "gap" && requirement.severity === "blocker").length,
    summaries: {
      cashFlow,
      liquidity,
      protection,
      crossBorderTax
    },
    requirements,
    records: records.map(toDtoFromReviewRecord)
  };
}

export function calculateQuickSuccessionRelief(input: unknown): QuickSuccessionReliefResult {
  const data = quickSuccessionReliefSchema.parse(input);
  const reliefRate = quickSuccessionReliefRate(data.yearsSinceFirstDeath);
  const attributableTax = data.currentIhtAttributable ?? data.firstDeathTaxPaid;
  const reliefAmount = Math.min(data.firstDeathTaxPaid, attributableTax) * reliefRate;
  return {
    reliefRate,
    reliefAmount: roundMoney(reliefAmount),
    yearsSinceFirstDeath: data.yearsSinceFirstDeath
  };
}

export function assessGrobRisk(input: unknown, referenceDate = new Date()): GrobRiskAssessmentResult {
  const data = grobAssessmentSchema.parse(input);
  const reasons: string[] = [];

  if (!data.retainedBenefit) {
    return {
      risk: data.evidenceRefs.length ? "low" : "medium",
      includedValue: 0,
      reasons: data.evidenceRefs.length
        ? ["No retained benefit recorded and evidence is linked."]
        : ["No retained benefit recorded, but supporting evidence is missing."]
    };
  }

  if (data.benefitCeasedDate) {
    const yearsElapsed = yearsBetween(data.benefitCeasedDate, referenceDate);
    if (yearsElapsed >= 7) {
      return {
        risk: data.evidenceRefs.length ? "low" : "medium",
        includedValue: 0,
        reasons: ["Retained benefit ceased more than seven years before the reference date."]
      };
    }
    reasons.push("Retained benefit ceased within the seven-year lookback period.");
  }

  if (data.fullMarketRentPaid) {
    reasons.push("Full market rent is recorded, but professional evidence is required.");
    if (data.evidenceRefs.length === 0) reasons.push("Market-rent evidence is not linked.");
    return { risk: "medium", includedValue: 0, reasons };
  }

  reasons.push("Donor retains a benefit without full market rent.");
  if (data.evidenceRefs.length === 0) reasons.push("No evidence is linked to support exclusion from the estate.");
  return { risk: "high", includedValue: data.giftValue, reasons };
}

function mapEstatePlanningRecord(record: {
  id: string;
  matterId: string;
  personId: string | null;
  recordType: string;
  title: string;
  status: string;
  reviewStatus: string;
  payload: string;
  evidenceRefs: string;
  effectiveDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): EstatePlanningRecordDto {
  return {
    id: record.id,
    matterId: record.matterId,
    personId: record.personId,
    recordType: RECORD_TYPES.has(record.recordType as EstatePlanningRecordType)
      ? (record.recordType as EstatePlanningRecordType)
      : "professional_referral",
    title: record.title,
    status: record.status as EstatePlanningRecordDto["status"],
    reviewStatus: record.reviewStatus as EstatePlanningRecordDto["reviewStatus"],
    payload: decode<Payload>(record.payload, {}),
    evidenceRefs: decode<string[]>(record.evidenceRefs, []),
    effectiveDate: record.effectiveDate,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function mapReviewRecord(record: Parameters<typeof mapEstatePlanningRecord>[0]): ReviewFactRecord {
  return mapEstatePlanningRecord(record);
}

function mapCashFlowItemRecord(record: {
  id: string;
  matterId: string;
  personId: string | null;
  itemType: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  frequency: string;
  evidenceRefs: string;
  reviewStatus: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): ReviewFactRecord {
  return {
    id: record.id,
    matterId: record.matterId,
    personId: record.personId,
    recordType: record.itemType === "expense" ? "expense_record" : "income_record",
    title: record.description,
    status: record.status,
    reviewStatus: record.reviewStatus,
    payload: {
      amount: record.amount,
      currency: record.currency,
      frequency: record.frequency,
      category: record.category
    },
    evidenceRefs: decode<string[]>(record.evidenceRefs, []),
    effectiveDate: null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function mapProtectionPolicyRecord(record: {
  id: string;
  matterId: string;
  personId: string | null;
  policyType: string;
  carrier: string;
  coverAmount: number;
  currency: string;
  beneficiaryLabel: string | null;
  inTrust: boolean;
  outsideEstate: boolean;
  evidenceRefs: string;
  reviewStatus: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): ReviewFactRecord {
  return {
    id: record.id,
    matterId: record.matterId,
    personId: record.personId,
    recordType: "protection_policy",
    title: `${record.carrier} ${record.policyType}`,
    status: record.status,
    reviewStatus: record.reviewStatus,
    payload: {
      coverAmount: record.coverAmount,
      currency: record.currency,
      beneficiary: record.beneficiaryLabel,
      inTrust: record.inTrust,
      outsideEstate: record.outsideEstate
    },
    evidenceRefs: decode<string[]>(record.evidenceRefs, []),
    effectiveDate: null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function mapTrustStructureRecord(record: {
  id: string;
  matterId: string;
  name: string;
  trustType: string;
  taxTreatment: string;
  jurisdictionCode: string | null;
  evidenceRefs: string;
  reviewStatus: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): ReviewFactRecord {
  return {
    id: record.id,
    matterId: record.matterId,
    personId: null,
    recordType: "trust_structure",
    title: record.name,
    status: record.status,
    reviewStatus: record.reviewStatus,
    payload: {
      trustType: record.trustType,
      taxTreatment: record.taxTreatment,
      jurisdictionCode: record.jurisdictionCode
    },
    evidenceRefs: decode<string[]>(record.evidenceRefs, []),
    effectiveDate: null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function mapIncapacityInstrumentRecord(record: {
  id: string;
  matterId: string;
  personId: string;
  instrumentType: string;
  jurisdictionCode: string;
  executionStatus: string;
  effectiveDate: Date | null;
  evidenceRefs: string;
  reviewStatus: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): ReviewFactRecord {
  return {
    id: record.id,
    matterId: record.matterId,
    personId: record.personId,
    recordType: "incapacity_instrument",
    title: `${record.instrumentType} ${record.jurisdictionCode}`,
    status: record.status,
    reviewStatus: record.reviewStatus,
    payload: {
      instrumentType: record.instrumentType,
      jurisdictionCode: record.jurisdictionCode,
      executionStatus: record.executionStatus
    },
    evidenceRefs: decode<string[]>(record.evidenceRefs, []),
    effectiveDate: record.effectiveDate,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function mapTaxPositionRecord(record: {
  id: string;
  matterId: string;
  countryA: string;
  countryB: string;
  reliefType: string;
  treatyStatus: string;
  noDtaWarning: boolean;
  evidenceRefs: string;
  reviewStatus: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): ReviewFactRecord {
  return {
    id: record.id,
    matterId: record.matterId,
    personId: null,
    recordType: "dta_position",
    title: `${record.countryA}-${record.countryB} ${record.reliefType}`,
    status: record.status,
    reviewStatus: record.reviewStatus,
    payload: {
      countryA: record.countryA,
      countryB: record.countryB,
      reliefType: record.reliefType,
      treatyStatus: record.treatyStatus,
      noDtaWarning: record.noDtaWarning
    },
    evidenceRefs: decode<string[]>(record.evidenceRefs, []),
    effectiveDate: null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function mapReliefAssessmentRecord(record: {
  id: string;
  matterId: string;
  personId: string | null;
  reliefType: string;
  subject: string;
  relevantValue: number;
  currency: string;
  riskLevel: string;
  payload: string;
  evidenceRefs: string;
  reviewStatus: string;
  status: string;
  eventDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ReviewFactRecord {
  const parsedPayload = decode<Payload>(record.payload, {});
  const recordType: EstatePlanningRecordType =
    record.reliefType === "deed_of_variation" || record.reliefType === "gift_received" || record.reliefType === "grob_assessment"
      ? record.reliefType
      : "gift_received";
  return {
    id: record.id,
    matterId: record.matterId,
    personId: record.personId,
    recordType,
    title: record.subject,
    status: record.status,
    reviewStatus: record.reviewStatus,
    payload: {
      ...parsedPayload,
      giftValue: record.relevantValue,
      currency: record.currency,
      riskLevel: record.riskLevel
    },
    evidenceRefs: decode<string[]>(record.evidenceRefs, []),
    effectiveDate: record.eventDate,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function mapOutsideEstateNominationRecord(record: {
  id: string;
  matterId: string;
  personId: string | null;
  nominationType: string;
  provider: string | null;
  beneficiaryLabel: string;
  passesOutsideEstate: boolean;
  evidenceRefs: string;
  reviewStatus: string;
  status: string;
  nominationDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ReviewFactRecord {
  return {
    id: record.id,
    matterId: record.matterId,
    personId: record.personId,
    recordType: record.nominationType === "pension_nomination" ? "pension_nomination" : "outside_estate_asset",
    title: `${record.provider ?? "Provider"} nomination for ${record.beneficiaryLabel}`,
    status: record.status,
    reviewStatus: record.reviewStatus,
    payload: {
      nominationType: record.nominationType,
      provider: record.provider,
      beneficiary: record.beneficiaryLabel,
      outsideEstate: record.passesOutsideEstate
    },
    evidenceRefs: decode<string[]>(record.evidenceRefs, []),
    effectiveDate: record.nominationDate,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function toDtoFromReviewRecord(record: ReviewFactRecord): EstatePlanningRecordDto {
  return {
    ...record,
    status: record.status as EstatePlanningRecordDto["status"],
    reviewStatus: record.reviewStatus as EstatePlanningRecordDto["reviewStatus"]
  };
}

function groupRecordsByType(records: ReviewFactRecord[]): Map<EstatePlanningRecordType, ReviewFactRecord[]> {
  const groups = new Map<EstatePlanningRecordType, ReviewFactRecord[]>();
  for (const record of records) {
    const current = groups.get(record.recordType) ?? [];
    current.push(record);
    groups.set(record.recordType, current);
  }
  return groups;
}

function buildCashFlowSummary(
  byType: Map<EstatePlanningRecordType, ReviewFactRecord[]>,
  lifetimeGifts: EstatePlanningReviewFacts["lifetimeGifts"]
): CashFlowSummary {
  const incomeRecords = byType.get("income_record") ?? [];
  const expenseRecords = byType.get("expense_record") ?? [];
  const annualIncome = incomeRecords.reduce((sum, record) => sum + annualizedAmount(record.payload), 0);
  const annualExpenses = expenseRecords.reduce((sum, record) => sum + annualizedAmount(record.payload), 0);
  const normalExpenditureGiftTotal = lifetimeGifts
    .filter((gift) => gift.exemptionClaimed === "normal_expenditure")
    .reduce((sum, gift) => sum + gift.value, 0);
  const annualSurplus = annualIncome - annualExpenses;
  const evidenceGaps = [
    ...incomeRecords.filter((record) => !hasEvidence(record)).map((record) => `Income evidence missing: ${record.title}`),
    ...expenseRecords.filter((record) => !hasEvidence(record)).map((record) => `Expense evidence missing: ${record.title}`),
    ...lifetimeGifts
      .filter((gift) => gift.exemptionClaimed === "normal_expenditure")
      .filter((gift) => decode<string[]>(gift.evidenceRefs, []).length === 0)
      .map((gift) => `Normal expenditure gift evidence missing: ${gift.id}`)
  ];

  return {
    annualIncome: roundMoney(annualIncome),
    annualExpenses: roundMoney(annualExpenses),
    annualSurplus: roundMoney(annualSurplus),
    normalExpenditureGiftTotal: roundMoney(normalExpenditureGiftTotal),
    normalExpenditureCapacity: roundMoney(Math.max(0, annualSurplus)),
    evidenceGaps
  };
}

function buildLiquiditySummary(
  assets: EstatePlanningReviewFacts["assets"],
  liabilities: EstatePlanningReviewFacts["liabilities"],
  byType: Map<EstatePlanningRecordType, ReviewFactRecord[]>,
  latestIhtDue: number
): LiquiditySummary {
  const liquidAssets = assets
    .filter((asset) => ["bank_account", "securities"].includes(asset.assetClass))
    .reduce((sum, asset) => sum + adjustedAssetValue(asset), 0);
  const liabilitiesTotal = liabilities.reduce((sum, liability) => sum + liability.amount, 0);
  const protectionCover = (byType.get("protection_policy") ?? []).reduce(
    (sum, record) => sum + payloadNumber(record.payload, ["coverAmount", "amount", "value"]),
    0
  );
  const liquidAssetCoveragePct = latestIhtDue > 0 ? Math.min(100, Math.round((liquidAssets / latestIhtDue) * 100)) : 100;

  return {
    liquidAssets: roundMoney(liquidAssets),
    liabilities: roundMoney(liabilitiesTotal),
    latestIhtDue: roundMoney(latestIhtDue),
    availableProtectionCover: roundMoney(protectionCover),
    fundingGap: roundMoney(Math.max(0, latestIhtDue - liquidAssets - protectionCover)),
    liquidAssetCoveragePct
  };
}

function buildProtectionSummary(
  assets: EstatePlanningReviewFacts["assets"],
  byType: Map<EstatePlanningRecordType, ReviewFactRecord[]>,
  baseProtectionNeed: number
): ProtectionSummary {
  const policyRecords = byType.get("protection_policy") ?? [];
  const insuranceAssets = assets.filter((asset) => asset.assetClass === "insurance");
  const totalCoverFromRecords = policyRecords.reduce((sum, record) => sum + payloadNumber(record.payload, ["coverAmount", "amount", "value"]), 0);
  const totalCoverFromAssets = insuranceAssets.reduce((sum, asset) => sum + adjustedAssetValue(asset), 0);
  const coverInTrust = policyRecords
    .filter((record) => Boolean(record.payload.inTrust) || Boolean(record.payload.outsideEstate))
    .reduce((sum, record) => sum + payloadNumber(record.payload, ["coverAmount", "amount", "value"]), 0);
  const assetCoverOutsideEstate = insuranceAssets
    .filter((asset) => asset.todPod || Boolean(asset.beneficiaryDesignation))
    .reduce((sum, asset) => sum + adjustedAssetValue(asset), 0);
  const policiesMissingTrust = policyRecords.filter((record) => !record.payload.inTrust && !record.payload.outsideEstate).length
    + insuranceAssets.filter((asset) => !asset.todPod && !asset.beneficiaryDesignation).length;
  const coverOutsideEstate = coverInTrust + assetCoverOutsideEstate;

  return {
    totalCover: roundMoney(totalCoverFromRecords + totalCoverFromAssets),
    coverInTrust: roundMoney(coverInTrust),
    coverOutsideEstate: roundMoney(coverOutsideEstate),
    policiesMissingTrust,
    protectionGap: roundMoney(Math.max(0, baseProtectionNeed - coverOutsideEstate))
  };
}

function buildCrossBorderTaxSummary(
  facts: EstatePlanningReviewFacts,
  byType: Map<EstatePlanningRecordType, ReviewFactRecord[]>
): CrossBorderTaxSummary {
  const countries = new Set<string>();
  const addCountry = (country: string | null | undefined) => {
    const normalized = normalizeTaxCountry(country);
    if (normalized) countries.add(normalized);
  };
  addCountry(facts.matter.primaryJurisdictionCode);
  facts.matter.additionalJurisdictions.forEach(addCountry);
  facts.people.forEach((person) => {
    addCountry(person.domicileCountry);
    addCountry(person.residenceCountry);
    addCountry(person.taxResidency);
  });
  facts.assets.forEach((asset) => {
    addCountry(asset.situsCountry);
  });

  const countryList = Array.from(countries).filter(Boolean).sort();
  const dtaRecords = byType.get("dta_position") ?? [];
  const dtaPositions = dtaRecords.map((record) => ({
    countryA: normalizeTaxCountry(payloadString(record.payload, ["countryA", "fromCountry", "primaryCountry"])) || "",
    countryB: normalizeTaxCountry(payloadString(record.payload, ["countryB", "toCountry", "secondaryCountry"])) || "",
    reliefType: payloadString(record.payload, ["reliefType", "treatyType"]) || "unilateral_or_treaty_review",
    status: record.reviewStatus
  }));

  const unresolvedPairs: string[] = [];
  for (let i = 0; i < countryList.length; i += 1) {
    for (let j = i + 1; j < countryList.length; j += 1) {
      const a = countryList[i];
      const b = countryList[j];
      const resolved = dtaPositions.some((position) => {
        const pair = new Set([position.countryA, position.countryB]);
        return pair.has(a) && pair.has(b) && position.status !== "pending";
      });
      if (!resolved) unresolvedPairs.push(`${a}-${b}`);
    }
  }

  return {
    countries: countryList,
    dtaPositions,
    unresolvedPairs
  };
}

function buildRequirementFit(input: {
  facts: EstatePlanningReviewFacts;
  byType: Map<EstatePlanningRecordType, ReviewFactRecord[]>;
  cashFlow: CashFlowSummary;
  liquidity: LiquiditySummary;
  protection: ProtectionSummary;
  crossBorderTax: CrossBorderTaxSummary;
}): EstateRequirementFit[] {
  const { facts, byType, cashFlow, liquidity, protection, crossBorderTax } = input;
  const incomeRecords = byType.get("income_record") ?? [];
  const expenseRecords = byType.get("expense_record") ?? [];
  const trustRecords = [...(byType.get("trust_structure") ?? []), ...(byType.get("life_assurance_trust") ?? [])];
  const outsideEstateRecords = [
    ...(byType.get("outside_estate_asset") ?? []),
    ...(byType.get("pension_nomination") ?? []),
    ...(byType.get("life_assurance_trust") ?? [])
  ];
  const outsideEstateAssets = facts.assets.filter((asset) =>
    ["pension", "insurance"].includes(asset.assetClass) || asset.todPod || Boolean(asset.beneficiaryDesignation)
  );
  const digitalAssets = facts.assets.filter((asset) =>
    ["digital_asset", "cryptocurrency", "intellectual_property", "domain_name"].includes(asset.assetClass)
  );
  const incapacityRecords = byType.get("incapacity_instrument") ?? [];
  const hasFinanceLpa = incapacityRecords.some((record) => payloadString(record.payload, ["instrumentType"]) === "property_financial");
  const hasHealthLpa = incapacityRecords.some((record) => payloadString(record.payload, ["instrumentType"]) === "health_welfare");
  const crossBorder = crossBorderTax.countries.length > 1;
  const activeWills = facts.wills.filter((will) => will.status !== "revoked");
  const goals = facts.clientGoals;
  const linkedGoals = goals.filter((goal) => decode<string[]>(goal.linkedScenarioIds, []).length > 0);
  const grobRecords = byType.get("grob_assessment") ?? [];
  const highRiskGrobs = grobRecords.filter((record) => safeAssessGrobRisk(record.payload).risk === "high");
  const giftReceivedRecords = byType.get("gift_received") ?? [];
  const deedRecords = byType.get("deed_of_variation") ?? [];

  return [
    requirement({
      code: "CORE-CF-001",
      area: "Cash flow",
      requirement: "Capture annual income, expenditure, surplus, and evidence so normal-expenditure gifting can be defended.",
      status: incomeRecords.length > 0 && expenseRecords.length > 0 && cashFlow.evidenceGaps.length === 0
        ? "met"
        : incomeRecords.length > 0 || expenseRecords.length > 0
          ? "partial"
          : "gap",
      severity: "blocker",
      evidence: [`Income records: ${incomeRecords.length}`, `Expense records: ${expenseRecords.length}`],
      gap: incomeRecords.length === 0 || expenseRecords.length === 0
        ? "Income and expense evidence is incomplete."
        : cashFlow.evidenceGaps.join("; ") || null,
      recommendedAction: "Add verified annual income and expenditure records, then link supporting evidence."
    }),
    requirement({
      code: "CORE-LIQ-001",
      area: "Liquidity",
      requirement: "Assess liquidity available for taxes, liabilities, probate costs, and immediate beneficiary needs.",
      status: liquidity.latestIhtDue === 0
        ? "partial"
        : liquidity.fundingGap <= 0
          ? "met"
          : liquidity.liquidAssets > 0 || liquidity.availableProtectionCover > 0
            ? "partial"
            : "gap",
      severity: "blocker",
      evidence: [`Liquid assets: ${liquidity.liquidAssets}`, `Latest IHT due: ${liquidity.latestIhtDue}`, `Funding gap: ${liquidity.fundingGap}`],
      gap: liquidity.fundingGap > 0 ? `Estate liquidity gap is ${liquidity.fundingGap}.` : null,
      recommendedAction: "Run IHT, confirm liquid assets, and add funding measures where the gap remains positive."
    }),
    requirement({
      code: "CORE-PROT-001",
      area: "Protection",
      requirement: "Record life/protection cover, ownership, trust status, beneficiary nomination, and funding adequacy.",
      status: protection.totalCover > 0 && protection.policiesMissingTrust === 0 && protection.protectionGap <= 0
        ? "met"
        : protection.totalCover > 0
          ? "partial"
          : "gap",
      severity: "warning",
      evidence: [`Total cover: ${protection.totalCover}`, `Cover outside estate: ${protection.coverOutsideEstate}`],
      gap: protection.totalCover === 0
        ? "No protection policy or insurance asset has been recorded."
        : protection.policiesMissingTrust > 0
          ? "Some policies are not marked as held in trust or outside the estate."
          : protection.protectionGap > 0
            ? `Protection gap is ${protection.protectionGap}.`
            : null,
      recommendedAction: "Add policies with cover, trust status, nomination, owner, and evidence."
    }),
    requirement({
      code: "CORE-GIFT-001",
      area: "Lifetime gifts",
      requirement: "Validate normal-expenditure gifts against surplus income and retain evidence.",
      status: cashFlow.normalExpenditureGiftTotal === 0
        ? "not_applicable"
        : cashFlow.normalExpenditureGiftTotal <= cashFlow.normalExpenditureCapacity && cashFlow.evidenceGaps.length === 0
          ? "met"
          : cashFlow.annualIncome > 0 && cashFlow.annualExpenses > 0
            ? "partial"
            : "gap",
      severity: "blocker",
      evidence: [`Normal expenditure gifts: ${cashFlow.normalExpenditureGiftTotal}`, `Capacity: ${cashFlow.normalExpenditureCapacity}`],
      gap: cashFlow.normalExpenditureGiftTotal > cashFlow.normalExpenditureCapacity
        ? "Normal-expenditure gifts exceed demonstrated surplus income."
        : cashFlow.evidenceGaps.find((gap) => gap.includes("Normal expenditure")) ?? null,
      recommendedAction: "Link bank statements/income schedules and confirm gifts are habitual, affordable, and made from income."
    }),
    requirement({
      code: "CORE-GIFT-002",
      area: "Estate reliefs",
      requirement: "Capture GROB, deed-of-variation, gifts received, and quick-succession relief positions.",
      status: grobRecords.length > 0 || deedRecords.length > 0 || giftReceivedRecords.length > 0
        ? highRiskGrobs.length === 0
          ? "met"
          : "partial"
        : "gap",
      severity: "warning",
      evidence: [`GROB records: ${grobRecords.length}`, `Deed variations: ${deedRecords.length}`, `Gifts received: ${giftReceivedRecords.length}`],
      gap: highRiskGrobs.length > 0
        ? `${highRiskGrobs.length} GROB assessment(s) are high risk.`
        : grobRecords.length === 0 && deedRecords.length === 0 && giftReceivedRecords.length === 0
          ? "No relief or prior-transfer assessment records are present."
          : null,
      recommendedAction: "Add GROB checks, deed-of-variation deadlines, gifts received, and QSR calculations where relevant."
    }),
    requirement({
      code: "CORE-OUT-001",
      area: "Outside-estate assets",
      requirement: "Identify pensions, insurance, TOD/POD assets, nominations, and whether each asset passes outside the estate.",
      status: outsideEstateAssets.length > 0 || outsideEstateRecords.length > 0
        ? outsideEstateRecords.length > 0 && outsideEstateAssets.every((asset) => asset.beneficiaryDesignation || asset.todPod || asset.assetClass === "pension")
          ? "met"
          : "partial"
        : "gap",
      severity: "warning",
      evidence: [`Outside-estate asset candidates: ${outsideEstateAssets.length}`, `Nomination records: ${outsideEstateRecords.length}`],
      gap: outsideEstateAssets.length === 0 && outsideEstateRecords.length === 0
        ? "No outside-estate asset review has been recorded."
        : outsideEstateRecords.length === 0
          ? "Outside-estate nominations need explicit review records."
          : null,
      recommendedAction: "Record pension nominations, insurance trust status, and TOD/POD evidence for each candidate asset."
    }),
    requirement({
      code: "CORE-DIG-001",
      area: "Digital assets",
      requirement: "Classify digital assets with access method, volatility flag, valuation basis, and evidence.",
      status: digitalAssets.length === 0
        ? "not_applicable"
        : digitalAssets.every((asset) => asset.digitalAccessMethod && decode<string[]>(asset.evidenceRefs, []).length > 0)
          ? "met"
          : "partial",
      severity: "warning",
      evidence: [`Digital assets: ${digitalAssets.length}`],
      gap: digitalAssets.some((asset) => !asset.digitalAccessMethod || decode<string[]>(asset.evidenceRefs, []).length === 0)
        ? "One or more digital assets lack access instructions or evidence."
        : null,
      recommendedAction: "Add secure access method, custodian/wallet evidence, valuation source, and review date."
    }),
    requirement({
      code: "CORE-TRUST-001",
      area: "Trusts",
      requirement: "Record trust taxonomy, trustees, beneficiaries, tax treatment, and scenario impact.",
      status: trustRecords.length > 0
        ? trustRecords.every((record) => record.payload.trustType && record.payload.taxTreatment && hasEvidence(record))
          ? "met"
          : "partial"
        : "gap",
      severity: "warning",
      evidence: [`Trust records: ${trustRecords.length}`],
      gap: trustRecords.length === 0
        ? "No trust or life-assurance trust record exists."
        : "One or more trust records lack trust type, tax treatment, or evidence.",
      recommendedAction: "Add trust type, trustees, beneficiaries, tax treatment, relevant scenario, and evidence."
    }),
    requirement({
      code: "CORE-INC-001",
      area: "Incapacity",
      requirement: "Capture LPA/incapacity instruments for property/finance and health/welfare, including attorneys and execution status.",
      status: hasFinanceLpa && hasHealthLpa
        ? "met"
        : incapacityRecords.length > 0
          ? "partial"
          : "gap",
      severity: "warning",
      evidence: [`Incapacity instruments: ${incapacityRecords.length}`],
      gap: !hasFinanceLpa && !hasHealthLpa
        ? "No property/finance or health/welfare incapacity instruments are recorded."
        : !hasFinanceLpa
          ? "Property and financial affairs instrument is missing."
          : !hasHealthLpa
            ? "Health and welfare instrument is missing."
            : null,
      recommendedAction: "Add instrument type, attorneys, substitute attorneys, execution status, and registration evidence."
    }),
    requirement({
      code: "CORE-WILL-001",
      area: "Wills",
      requirement: "Coordinate jurisdiction-specific wills and prevent unintentional revocation across countries.",
      status: crossBorder
        ? activeWills.length >= Math.min(crossBorderTax.countries.length, 2)
          ? "met"
          : activeWills.length > 0
            ? "partial"
            : "gap"
        : activeWills.length > 0
          ? "met"
          : "gap",
      severity: "blocker",
      evidence: [`Active wills: ${activeWills.length}`, `Countries: ${crossBorderTax.countries.join(", ")}`],
      gap: activeWills.length === 0 ? "No active will coordination record exists." : null,
      recommendedAction: "Create separate will coordination records for each relevant jurisdiction and review revocation clauses."
    }),
    requirement({
      code: "CORE-DOM-001",
      area: "Domicile",
      requirement: "Track domicile of origin/choice/dependency, snap-back risk, and evidence by person.",
      status: facts.people.length > 0 && facts.domicileRecords.length >= facts.people.length
        ? facts.domicileRecords.every((record) => Boolean(record.evidenceSummary))
          ? "met"
          : "partial"
        : facts.domicileRecords.length > 0
          ? "partial"
          : "gap",
      severity: "blocker",
      evidence: [`People: ${facts.people.length}`, `Domicile records: ${facts.domicileRecords.length}`],
      gap: facts.domicileRecords.length < facts.people.length
        ? "Domicile evidence is missing for one or more people."
        : facts.domicileRecords.some((record) => !record.evidenceSummary)
          ? "One or more domicile records lacks evidence summary."
          : null,
      recommendedAction: "Complete domicile evidence and snap-back analysis for each testator or relevant person."
    }),
    requirement({
      code: "CORE-DTA-001",
      area: "Cross-border tax",
      requirement: "Maintain DTA/unilateral relief review for cross-border estates and flag no-DTA exposure.",
      status: !crossBorder
        ? "not_applicable"
        : crossBorderTax.unresolvedPairs.length === 0
          ? "met"
          : crossBorderTax.dtaPositions.length > 0
            ? "partial"
            : "gap",
      severity: "warning",
      evidence: [`Countries: ${crossBorderTax.countries.join(", ")}`, `DTA records: ${crossBorderTax.dtaPositions.length}`],
      gap: crossBorderTax.unresolvedPairs.length > 0
        ? `Unresolved country pairs: ${crossBorderTax.unresolvedPairs.join(", ")}.`
        : null,
      recommendedAction: "Record treaty/unilateral relief position and no-DTA warnings for each material country pair."
    }),
    requirement({
      code: "CORE-GOAL-001",
      area: "Client goals",
      requirement: "Map client estate-planning goals to scenarios and mark whether each goal is addressed.",
      status: goals.length > 0 && linkedGoals.length === goals.length && goals.every((goal) => goal.status !== "pending")
        ? "met"
        : goals.length > 0 && linkedGoals.length > 0
          ? "partial"
          : "gap",
      severity: "warning",
      evidence: [`Goals: ${goals.length}`, `Linked goals: ${linkedGoals.length}`],
      gap: goals.length === 0
        ? "No client goals are captured."
        : linkedGoals.length < goals.length
          ? "Some client goals are not linked to scenarios."
          : "Some goals remain pending.",
      recommendedAction: "Link every goal to at least one scenario and update status after review."
    }),
    requirement({
      code: "CORE-ADV-001",
      area: "Advisor checklist",
      requirement: "Record external professional referrals where local tax, notarial, trust, or contentious probate advice is needed.",
      status: crossBorder || trustRecords.length > 0 || liquidity.latestIhtDue > 0
        ? (byType.get("professional_referral") ?? []).length > 0
          ? "met"
          : "gap"
        : "not_applicable",
      severity: "info",
      evidence: [`Referral records: ${(byType.get("professional_referral") ?? []).length}`],
      gap: "No professional referral record exists for material estate planning complexity.",
      recommendedAction: "Add referral record naming advisor type, jurisdiction, scope, and status."
    })
  ];
}

function requirement(input: EstateRequirementFit): EstateRequirementFit {
  return input;
}

function annualizedAmount(payload: Payload): number {
  const annual = payloadNumber(payload, ["annualAmount", "annualValue"]);
  if (annual > 0) return annual;

  const amount = payloadNumber(payload, ["amount", "monthlyAmount", "value"]);
  const frequency = payloadString(payload, ["frequency"]) || (payload.monthlyAmount !== undefined ? "monthly" : "annual");
  switch (frequency) {
    case "weekly":
      return amount * 52;
    case "monthly":
      return amount * 12;
    case "quarterly":
      return amount * 4;
    case "one_off":
      return amount;
    case "annual":
    default:
      return amount;
  }
}

function adjustedAssetValue(asset: { valuation: number; ownershipShare: number }): number {
  return asset.valuation * (asset.ownershipShare / 100);
}

function latestIhtByPerson(calculations: EstatePlanningReviewFacts["ihtCalculations"]): number {
  const latest = new Map<string, EstatePlanningReviewFacts["ihtCalculations"][number]>();
  for (const calculation of calculations) {
    const current = latest.get(calculation.personId);
    if (!current || current.createdAt < calculation.createdAt) {
      latest.set(calculation.personId, calculation);
    }
  }
  return Array.from(latest.values()).reduce((sum, calculation) => sum + calculation.ihtDue, 0);
}

function quickSuccessionReliefRate(yearsSinceFirstDeath: number): number {
  if (yearsSinceFirstDeath <= 1) return 1;
  if (yearsSinceFirstDeath <= 2) return 0.8;
  if (yearsSinceFirstDeath <= 3) return 0.6;
  if (yearsSinceFirstDeath <= 4) return 0.4;
  if (yearsSinceFirstDeath <= 5) return 0.2;
  return 0;
}

function hasEvidence(record: ReviewFactRecord): boolean {
  return record.evidenceRefs.length > 0 || Boolean(record.payload.evidenceSummary) || Boolean(record.payload.evidenceRef);
}

function payloadNumber(payload: Payload, keys: string[]): number {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function payloadString(payload: Payload, keys: string[]): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return null;
}

function normalizeTaxCountry(country: string | null | undefined): string | null {
  if (!country) return null;
  const value = country.trim().toUpperCase();
  if (!value) return null;
  if (value === "EW") return "GB";
  return value;
}

function safeAssessGrobRisk(payload: Payload): GrobRiskAssessmentResult {
  try {
    return assessGrobRisk(payload);
  } catch {
    return {
      risk: "medium",
      includedValue: 0,
      reasons: ["GROB assessment payload is incomplete."]
    };
  }
}

function yearsBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
