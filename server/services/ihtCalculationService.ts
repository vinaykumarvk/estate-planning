import { prisma } from "../db";
import { audit } from "./auditService";
import { decode, encode } from "./json";
import type {
  IhtThresholds,
  IhtExemptionBreakdown,
  IhtCalculationResult,
  IhtHouseholdResult,
  IhtScenarioComparison,
  TaperBand,
  GiftClassification,
} from "../../shared/types";

// ---------------------------------------------------------------------------
// ADD-001: IHT Thresholds (current UK rates frozen since 2009/2017)
// ---------------------------------------------------------------------------

export function getIhtThresholds(effectiveDate: Date): IhtThresholds {
  return {
    nrb: 325_000,
    rnrb: 175_000,
    rnrbTaperThreshold: 2_000_000,
    standardRate: 0.40,
    charitableRate: 0.36,
    annualExemption: 3_000,
    smallGiftLimit: 250,
    effectiveDate,
  };
}

// ---------------------------------------------------------------------------
// ADD-002: Calculate Nil-Rate Band (NRB)
// ---------------------------------------------------------------------------

export function calculateNrb(
  netEstate: number,
  thresholds: IhtThresholds,
  transferablePercent = 0
): { nrb: number; transferableNrb: number; totalNrb: number } {
  const transferableNrb = thresholds.nrb * (transferablePercent / 100);
  const totalNrb = thresholds.nrb + transferableNrb;
  return { nrb: thresholds.nrb, transferableNrb, totalNrb };
}

// ---------------------------------------------------------------------------
// ADD-003: Calculate Residence Nil-Rate Band (RNRB) with tapering
// ---------------------------------------------------------------------------

export function calculateRnrb(
  netEstate: number,
  qualifyingPropertyValue: number,
  toDirectDescendants: boolean,
  thresholds: IhtThresholds,
  transferablePercent = 0
): { rnrb: number; rnrbTapering: number; transferableRnrb: number; effectiveRnrb: number } {
  if (!toDirectDescendants || qualifyingPropertyValue <= 0) {
    return { rnrb: 0, rnrbTapering: 0, transferableRnrb: 0, effectiveRnrb: 0 };
  }

  // Base RNRB is the lesser of the RNRB threshold and the qualifying property value
  let baseRnrb = Math.min(thresholds.rnrb, qualifyingPropertyValue);

  // Tapering: reduce by £1 for every £2 above the taper threshold
  let tapering = 0;
  if (netEstate > thresholds.rnrbTaperThreshold) {
    tapering = Math.floor((netEstate - thresholds.rnrbTaperThreshold) / 2);
    tapering = Math.min(tapering, baseRnrb); // cannot taper below zero
  }

  const rnrbAfterTaper = baseRnrb - tapering;
  const transferableRnrb = rnrbAfterTaper * (transferablePercent / 100);
  const effectiveRnrb = rnrbAfterTaper + transferableRnrb;

  return { rnrb: rnrbAfterTaper, rnrbTapering: tapering, transferableRnrb, effectiveRnrb };
}

// ---------------------------------------------------------------------------
// ADD-004: Seven-year transfer audit & taper relief
// ---------------------------------------------------------------------------

interface GiftInput {
  id: string;
  giftDate: Date;
  value: number;
  petOrClt: GiftClassification;
  exemptionClaimed: string;
}

export interface SevenYearTransfer {
  giftId: string;
  giftDate: Date;
  value: number;
  yearsElapsed: number;
  taperBand: TaperBand;
  taperReliefPercent: number;
  taxReduction: number;
  classification: GiftClassification;
}

function yearsBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return ms / (365.25 * 24 * 60 * 60 * 1000);
}

function taperBandFor(years: number): TaperBand {
  if (years < 3) return "0-3";
  if (years < 4) return "3-4";
  if (years < 5) return "4-5";
  if (years < 6) return "5-6";
  if (years < 7) return "6-7";
  return "7+";
}

function taperReliefPercent(band: TaperBand): number {
  switch (band) {
    case "0-3": return 0;
    case "3-4": return 20;
    case "4-5": return 40;
    case "5-6": return 60;
    case "6-7": return 80;
    case "7+": return 100;
  }
}

export function auditSevenYearTransfers(
  gifts: GiftInput[],
  deathDate: Date
): SevenYearTransfer[] {
  const results: SevenYearTransfer[] = [];

  for (const gift of gifts) {
    // Only non-exempt PETs and CLTs count
    if (gift.exemptionClaimed !== "none" && gift.petOrClt === "exempt") continue;

    const years = yearsBetween(gift.giftDate, deathDate);
    if (years < 0) continue; // gift after death makes no sense

    const band = taperBandFor(years);
    const reliefPct = taperReliefPercent(band);

    results.push({
      giftId: gift.id,
      giftDate: gift.giftDate,
      value: gift.value,
      yearsElapsed: Math.round(years * 100) / 100,
      taperBand: band,
      taperReliefPercent: reliefPct,
      taxReduction: gift.value * (reliefPct / 100),
      classification: gift.petOrClt,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// ADD-005: Calculate exemptions breakdown
// ---------------------------------------------------------------------------

export function calculateExemptions(
  spouseGifts: number,
  annualGifts: number,
  smallGifts: number,
  normalExpenditure: number,
  charityGifts: number,
  priorYearAnnualUsed: number
): IhtExemptionBreakdown {
  // Annual exemption: £3,000 current year + unused prior year (max £3,000)
  const currentAnnual = 3_000;
  const carryForward = Math.max(0, currentAnnual - priorYearAnnualUsed);
  const totalAnnualAvailable = currentAnnual + carryForward;
  const annualExemption = Math.min(annualGifts, totalAnnualAvailable);

  const exemptions: IhtExemptionBreakdown = {
    spouse: spouseGifts, // unlimited
    annual: annualExemption,
    smallGifts: smallGifts, // £250 per recipient, already summed
    normalExpenditure,
    charity: charityGifts,
    total: 0,
  };

  exemptions.total = exemptions.spouse + exemptions.annual + exemptions.smallGifts +
    exemptions.normalExpenditure + exemptions.charity;

  return exemptions;
}

// ---------------------------------------------------------------------------
// ADD-006: Full IHT calculation for a single person
// ---------------------------------------------------------------------------

export async function calculateIhtForPerson(
  matterId: string,
  personId: string,
  scenarioId: string,
  effectiveDate: Date
): Promise<IhtCalculationResult> {
  const matter = await prisma.matter.findUniqueOrThrow({ where: { id: matterId } });
  const thresholds = getIhtThresholds(effectiveDate);

  // Fetch assets owned by this person in this matter
  const assets = await prisma.asset.findMany({
    where: { matterId, ownerPersonId: personId },
  });

  // Fetch liabilities for this matter (GBP)
  const liabilities = await prisma.liability.findMany({
    where: { matterId },
  });

  // Gross estate: sum of assets' value (adjusted for ownership share)
  const grossEstate = assets.reduce(
    (sum, a) => sum + a.valuation * (a.ownershipShare / 100),
    0
  );
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
  const netEstate = grossEstate - totalLiabilities;

  // Fetch lifetime gifts by this donor
  const lifetimeGifts = await prisma.lifetimeGift.findMany({
    where: { matterId, donorPersonId: personId },
  });

  // Classify gifts
  const spouseGifts = lifetimeGifts
    .filter((g) => g.exemptionClaimed === "spouse")
    .reduce((sum, g) => sum + g.value, 0);
  const annualGifts = lifetimeGifts
    .filter((g) => g.exemptionClaimed === "annual")
    .reduce((sum, g) => sum + g.value, 0);
  const smallGifts = lifetimeGifts
    .filter((g) => g.exemptionClaimed === "small_gift")
    .reduce((sum, g) => sum + g.value, 0);
  const normalExpenditure = lifetimeGifts
    .filter((g) => g.exemptionClaimed === "normal_expenditure")
    .reduce((sum, g) => sum + g.value, 0);
  const charityGifts = lifetimeGifts
    .filter((g) => g.exemptionClaimed === "charity")
    .reduce((sum, g) => sum + g.value, 0);

  const exemptions = calculateExemptions(spouseGifts, annualGifts, smallGifts, normalExpenditure, charityGifts, 0);

  // Seven-year transfers (PETs/CLTs with exemption "none")
  const transferableGifts = lifetimeGifts
    .filter((g) => g.petOrClt !== "exempt")
    .map((g) => ({
      id: g.id,
      giftDate: g.giftDate,
      value: g.value,
      petOrClt: g.petOrClt as GiftClassification,
      exemptionClaimed: g.exemptionClaimed,
    }));
  const sevenYearTransfers = auditSevenYearTransfers(transferableGifts, effectiveDate);

  // CLTs within 7 years reduce NRB
  const cltNrbReduction = sevenYearTransfers
    .filter((t) => t.classification === "clt" && t.taperBand !== "7+")
    .reduce((sum, t) => sum + t.value, 0);

  // Total taper relief from PETs that have been tapered
  const taperRelief = sevenYearTransfers
    .filter((t) => t.taperBand !== "7+" && t.taperBand !== "0-3")
    .reduce((sum, t) => sum + t.taxReduction, 0);

  // Check if spouse exists and whether there's a transferable NRB
  const relationships = await prisma.relationship.findMany({ where: { matterId } });
  const spouseRel = relationships.find(
    (r) =>
      (r.relationshipType === "spouse") &&
      (r.fromPersonId === personId || r.toPersonId === personId)
  );
  const hasSpouse = !!spouseRel;

  // Transferable NRB: look for any prior IHT calculation for the deceased spouse
  let transferableNrbPercent = 0;
  let transferableRnrbPercent = 0;
  if (hasSpouse) {
    const spousePersonId = spouseRel.fromPersonId === personId
      ? spouseRel.toPersonId
      : spouseRel.fromPersonId;
    const priorCalc = await prisma.ihtCalculation.findFirst({
      where: { matterId, personId: spousePersonId },
      orderBy: { createdAt: "desc" },
    });
    if (priorCalc) {
      // Transferable % = portion of NRB unused by first spouse
      const nrbUsedPct = (priorCalc.nrbUsed / priorCalc.nrb) * 100;
      transferableNrbPercent = Math.max(0, 100 - nrbUsedPct);
      transferableRnrbPercent = transferableNrbPercent; // simplified
    }
  }

  // NRB calculation
  const nrbResult = calculateNrb(netEstate, thresholds, transferableNrbPercent);
  const effectiveNrb = nrbResult.totalNrb - cltNrbReduction;

  // RNRB: check if property passes to direct descendants
  const dispositions = await prisma.disposition.findMany({
    where: { matterId, scenarioId },
  });
  const propertyAssets = assets.filter((a) => a.assetClass === "real_estate");
  const qualifyingPropertyValue = propertyAssets.reduce(
    (sum, a) => sum + a.valuation * (a.ownershipShare / 100),
    0
  );

  // Check if any dispositions go to direct descendants (children)
  const childRelationships = relationships.filter(
    (r) => r.relationshipType === "child" && r.fromPersonId === personId
  );
  const childPersonIds = new Set(childRelationships.map((r) => r.toPersonId));
  const toDirectDescendants = dispositions.some(
    (d) => d.beneficiaryPersonId && childPersonIds.has(d.beneficiaryPersonId)
  );

  const rnrbResult = calculateRnrb(
    netEstate,
    qualifyingPropertyValue,
    toDirectDescendants,
    thresholds,
    transferableRnrbPercent
  );

  // Charitable rate: applies if >= 10% of net estate goes to charity
  const charityDispositions = dispositions.filter((d) => d.giftType === "charitable");
  const charityAmount = charityDispositions.reduce((sum, d) => sum + (d.amount ?? 0), 0);
  const charitableRate = charityAmount >= netEstate * 0.1 && charityAmount > 0;
  const applicableRate = charitableRate ? thresholds.charitableRate : thresholds.standardRate;

  // Taxable estate
  const totalAllowances = Math.max(0, effectiveNrb) + rnrbResult.effectiveRnrb;
  const taxableEstate = Math.max(0, netEstate - exemptions.total - totalAllowances);
  const ihtBeforeTaper = taxableEstate * applicableRate;
  const ihtDue = Math.max(0, ihtBeforeTaper - taperRelief);

  const nrbUsed = Math.min(nrbResult.totalNrb, Math.max(0, netEstate - exemptions.total));

  // Persist
  const record = await prisma.ihtCalculation.create({
    data: {
      tenantId: matter.tenantId,
      matterId,
      personId,
      scenarioId,
      effectiveDate,
      netEstate,
      nrb: thresholds.nrb,
      nrbUsed,
      rnrb: rnrbResult.rnrb,
      rnrbTapering: rnrbResult.rnrbTapering,
      transferableNrb: nrbResult.transferableNrb,
      transferableRnrb: rnrbResult.transferableRnrb,
      charitableRate,
      taxableEstate,
      ihtDue,
      exemptionsApplied: encode(exemptions),
      sevenYearTransfers: encode(sevenYearTransfers),
      taperRelief,
      calculationDetails: encode({
        grossEstate,
        totalLiabilities,
        cltNrbReduction,
        applicableRate,
        totalAllowances,
      }),
    },
  });

  await audit({
    tenantId: matter.tenantId,
    matterId,
    actorRole: "system",
    eventType: "iht.calculated",
    entityType: "IhtCalculation",
    entityId: record.id,
    metadata: {
      personId,
      scenarioId,
      ihtDue,
      requirementRefs: ["ADD-001", "ADD-002", "ADD-003", "ADD-004", "ADD-005", "ADD-006"],
    },
  });

  return {
    id: record.id,
    matterId,
    personId,
    scenarioId,
    netEstate,
    nrb: thresholds.nrb,
    nrbUsed,
    rnrb: rnrbResult.rnrb,
    rnrbTapering: rnrbResult.rnrbTapering,
    transferableNrb: nrbResult.transferableNrb,
    transferableRnrb: rnrbResult.transferableRnrb,
    charitableRate,
    taxableEstate,
    ihtDue,
    exemptionsApplied: exemptions,
    taperRelief,
    effectiveDate,
  };
}

// ---------------------------------------------------------------------------
// ADD-007: Household IHT (both spouses, second-death projection)
// ---------------------------------------------------------------------------

export async function calculateHouseholdIht(
  matterId: string,
  scenarioId: string,
  effectiveDate: Date
): Promise<IhtHouseholdResult> {
  const relationships = await prisma.relationship.findMany({ where: { matterId } });
  const people = await prisma.person.findMany({ where: { matterId } });

  // Find spouse pairs
  const spouseRels = relationships.filter((r) => r.relationshipType === "spouse");
  const personIds = new Set<string>();

  // Collect all persons who are part of a spouse pair (or all persons if no spouse)
  for (const rel of spouseRels) {
    personIds.add(rel.fromPersonId);
    personIds.add(rel.toPersonId);
  }

  // If no spouse relationship, just calc for all persons
  if (personIds.size === 0) {
    for (const p of people) {
      personIds.add(p.id);
    }
  }

  const results: IhtCalculationResult[] = [];
  for (const pid of personIds) {
    const result = await calculateIhtForPerson(matterId, pid, scenarioId, effectiveDate);
    results.push(result);
  }

  const combinedIht = results.reduce((sum, r) => sum + r.ihtDue, 0);

  // Second death projection: if there are two spouses, project what happens on second death
  let secondDeathProjection: IhtHouseholdResult["secondDeathProjection"] = null;

  if (spouseRels.length > 0 && results.length >= 2) {
    // Assume first person listed dies first, second is survivor
    const firstDeath = results[0];
    const survivor = results[1];
    const thresholds = getIhtThresholds(effectiveDate);

    // On first death, estate passes to survivor via spouse exemption,
    // so NRB is unused and 100% transfers. If the first death had IHT
    // due (e.g. non-spouse beneficiaries), only the unused portion transfers.
    const spouseExemptionApplied = firstDeath.ihtDue === 0;
    const firstNrbUsedPct = spouseExemptionApplied
      ? 0
      : (firstDeath.nrbUsed / firstDeath.nrb) * 100;
    const transferableNrbPercent = Math.max(0, 100 - firstNrbUsedPct);
    const transferableRnrbPercent = transferableNrbPercent; // simplified

    // Survivor's projected estate = their own net estate + what they inherit from first death
    // (spouse exemption means the inherited amount is not taxed at first death)
    const projectedNetEstate = survivor.netEstate + firstDeath.netEstate;

    // Look up actual real estate assets for the survivor to determine RNRB eligibility
    const survivorAssets = await prisma.asset.findMany({
      where: { matterId, ownerPersonId: survivor.personId },
    });
    const allMatterAssets = await prisma.asset.findMany({ where: { matterId } });
    const qualifyingPropertyValue = allMatterAssets
      .filter((a) => a.assetClass === "real_estate")
      .reduce((sum, a) => sum + a.valuation * (a.ownershipShare / 100), 0);

    // Check if any dispositions go to direct descendants
    const allDispositions = await prisma.disposition.findMany({ where: { matterId } });
    const childRels = relationships.filter(
      (r) => r.relationshipType === "child" && r.fromPersonId === survivor.personId
    );
    const childIds = new Set(childRels.map((r) => r.toPersonId));
    const toDescendants = qualifyingPropertyValue > 0 && (
      allDispositions.some((d) => d.beneficiaryPersonId && childIds.has(d.beneficiaryPersonId)) ||
      childRels.length > 0
    );

    // Recalculate with transferred bands
    const nrbResult = calculateNrb(projectedNetEstate, thresholds, transferableNrbPercent);
    const rnrbResult = calculateRnrb(
      projectedNetEstate,
      qualifyingPropertyValue,
      toDescendants,
      thresholds,
      transferableRnrbPercent
    );

    const totalAllowances = nrbResult.totalNrb + rnrbResult.effectiveRnrb;
    const taxableEstate = Math.max(0, projectedNetEstate - totalAllowances);
    const projectedIht = taxableEstate * thresholds.standardRate;

    secondDeathProjection = {
      survivorPersonId: survivor.personId,
      projectedNetEstate,
      transferableNrbPercent,
      transferableRnrbPercent,
      projectedIht,
      totalFamilyIht: firstDeath.ihtDue + projectedIht,
    };
  }

  return {
    matterId,
    scenarioId,
    persons: results,
    combinedIht,
    secondDeathProjection,
  };
}

// ---------------------------------------------------------------------------
// ADD-009 / ADD-010: IHT Scenario Comparison
// ---------------------------------------------------------------------------

export async function compareIhtScenarios(
  matterId: string,
  scenarioIds: string[],
  effectiveDate: Date
): Promise<IhtScenarioComparison> {
  const scenarios = await prisma.scenario.findMany({
    where: { id: { in: scenarioIds }, matterId },
  });

  const results: IhtScenarioComparison["scenarios"] = [];

  for (const scenario of scenarios) {
    const household = await calculateHouseholdIht(matterId, scenario.id, effectiveDate);
    results.push({
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      householdIht: household.combinedIht,
      secondDeathIht: household.secondDeathProjection?.projectedIht ?? 0,
      totalFamilyIht: household.secondDeathProjection?.totalFamilyIht ?? household.combinedIht,
    });
  }

  // Best scenario has lowest totalFamilyIht
  const sorted = [...results].sort((a, b) => a.totalFamilyIht - b.totalFamilyIht);
  const bestScenarioId = sorted[0]?.scenarioId ?? "";
  const worst = sorted[sorted.length - 1]?.totalFamilyIht ?? 0;
  const best = sorted[0]?.totalFamilyIht ?? 0;
  const maxSavings = worst - best;

  await audit({
    tenantId: (await prisma.matter.findUniqueOrThrow({ where: { id: matterId } })).tenantId,
    matterId,
    actorRole: "system",
    eventType: "iht.scenarios_compared",
    entityType: "IhtCalculation",
    metadata: {
      scenarioIds,
      bestScenarioId,
      maxSavings,
      requirementRefs: ["ADD-009", "ADD-010"],
    },
  });

  return {
    matterId,
    scenarios: results,
    bestScenarioId,
    maxSavings,
  };
}
