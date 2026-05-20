import { describe, expect, it } from "vitest";
import {
  assessGrobRisk,
  buildEstatePlanningReview,
  calculateQuickSuccessionRelief
} from "../server/services/estatePlanningReviewService";
import { buildEstatePlanningDocumentContent } from "../server/services/documentAssemblyService";

type ReviewFacts = Parameters<typeof buildEstatePlanningReview>[0];

const now = new Date("2026-05-17T00:00:00.000Z");

function record(
  recordType: ReviewFacts["records"][number]["recordType"],
  payload: Record<string, unknown>,
  overrides: Partial<ReviewFacts["records"][number]> = {}
): ReviewFacts["records"][number] {
  return {
    id: `${recordType}-1`,
    matterId: "matter-1",
    personId: "person-1",
    recordType,
    title: recordType.replaceAll("_", " "),
    status: "active",
    reviewStatus: "reviewed",
    payload,
    evidenceRefs: [`${recordType}-evidence`],
    effectiveDate: now,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function completeFacts(): ReviewFacts {
  return {
    matter: {
      id: "matter-1",
      primaryJurisdictionCode: "EW",
      additionalJurisdictions: ["PT"]
    },
    people: [
      {
        id: "person-1",
        legalName: "James Morgan",
        dateOfBirth: new Date("1970-01-01T00:00:00.000Z"),
        domicileCountry: "EW",
        residenceCountry: "EW",
        taxResidency: "EW"
      }
    ],
    assets: [
      {
        id: "asset-bank",
        assetClass: "bank_account",
        description: "Savings",
        situsCountry: "EW",
        currency: "GBP",
        valuation: 150_000,
        valuationDate: now,
        ownershipType: "sole",
        ownershipShare: 100,
        beneficiaryDesignation: null,
        todPod: false,
        dynamicFields: "{}",
        evidenceRefs: JSON.stringify(["bank-statement"]),
        digitalAccessMethod: null,
        volatilityFlag: false
      },
      {
        id: "asset-pension",
        assetClass: "pension",
        description: "Workplace pension",
        situsCountry: "EW",
        currency: "GBP",
        valuation: 200_000,
        valuationDate: now,
        ownershipType: "sole",
        ownershipShare: 100,
        beneficiaryDesignation: "Spouse",
        todPod: true,
        dynamicFields: "{}",
        evidenceRefs: JSON.stringify(["pension-statement"]),
        digitalAccessMethod: null,
        volatilityFlag: false
      },
      {
        id: "asset-crypto",
        assetClass: "cryptocurrency",
        description: "Bitcoin",
        situsCountry: "EW",
        currency: "GBP",
        valuation: 40_000,
        valuationDate: now,
        ownershipType: "sole",
        ownershipShare: 100,
        beneficiaryDesignation: null,
        todPod: false,
        dynamicFields: "{}",
        evidenceRefs: JSON.stringify(["wallet-inventory"]),
        digitalAccessMethod: "hardware wallet with executor instruction",
        volatilityFlag: true
      }
    ],
    liabilities: [{ id: "liability-1", amount: 25_000, currency: "GBP" }],
    lifetimeGifts: [
      {
        id: "gift-1",
        value: 10_000,
        currency: "GBP",
        exemptionClaimed: "normal_expenditure",
        petOrClt: "exempt",
        evidenceRefs: JSON.stringify(["gift-bank-evidence"])
      }
    ],
    ihtCalculations: [{ id: "iht-1", personId: "person-1", ihtDue: 100_000, createdAt: now }],
    wills: [
      { id: "will-ew", jurisdictionCode: "EW", status: "draft", assetIds: "[]" },
      { id: "will-pt", jurisdictionCode: "PT", status: "draft", assetIds: "[]" }
    ],
    domicileRecords: [
      {
        id: "domicile-1",
        personId: "person-1",
        evidenceSummary: "Long-term residence and intention evidence reviewed.",
        snapBackRisk: false,
        snapBackReason: null
      }
    ],
    clientGoals: [
      { id: "goal-1", status: "addressed", linkedScenarioIds: JSON.stringify(["scenario-1"]) }
    ],
    records: [
      record("income_record", { annualAmount: 220_000, currency: "GBP" }),
      record("expense_record", { annualAmount: 120_000, currency: "GBP" }),
      record("protection_policy", { coverAmount: 200_000, currency: "GBP", inTrust: true, outsideEstate: true }),
      record("pension_nomination", { beneficiary: "Spouse", nominationDate: "2026-04-15" }),
      record("trust_structure", { trustType: "discretionary", taxTreatment: "relevant_property_regime" }),
      record("incapacity_instrument", { instrumentType: "property_financial", status: "registered" }, { id: "lpa-finance" }),
      record("incapacity_instrument", { instrumentType: "health_welfare", status: "registered" }, { id: "lpa-health" }),
      record("dta_position", { countryA: "EW", countryB: "PT", reliefType: "unilateral_credit_review" }),
      record("grob_assessment", { giftValue: 50_000, retainedBenefit: false }),
      record("professional_referral", { advisorType: "local_tax_notary", jurisdiction: "PT" })
    ],
    referenceDate: now
  };
}

describe("core estate planning remediation review", () => {
  it("scores a complete estate planning file without requirement gaps", () => {
    const review = buildEstatePlanningReview(completeFacts());

    expect(review.fitmentPercent).toBe(100);
    expect(review.gapRequirementCount).toBe(0);
    expect(review.blockerCount).toBe(0);
    expect(review.summaries.cashFlow.annualSurplus).toBe(100_000);
    expect(review.summaries.liquidity.fundingGap).toBe(0);
  });

  it("surfaces estate-planning blockers when core evidence is missing", () => {
    const facts = completeFacts();
    facts.records = [];
    facts.domicileRecords = [];
    facts.wills = [];
    facts.clientGoals = [];
    facts.ihtCalculations = [];

    const review = buildEstatePlanningReview(facts);

    expect(review.fitmentPercent).toBeLessThan(50);
    expect(review.blockerCount).toBeGreaterThanOrEqual(3);
    expect(review.requirements.find((item) => item.code === "CORE-CF-001")?.status).toBe("gap");
    expect(review.requirements.find((item) => item.code === "CORE-WILL-001")?.status).toBe("gap");
    expect(review.requirements.find((item) => item.code === "CORE-DOM-001")?.status).toBe("gap");
  });

  it("calculates quick succession relief and GROB risk bands", () => {
    expect(calculateQuickSuccessionRelief({
      inheritedValue: 300_000,
      firstDeathTaxPaid: 80_000,
      yearsSinceFirstDeath: 2.5,
      currentIhtAttributable: 60_000
    })).toEqual({
      reliefRate: 0.6,
      reliefAmount: 36_000,
      yearsSinceFirstDeath: 2.5
    });

    expect(assessGrobRisk({
      giftValue: 500_000,
      retainedBenefit: true,
      fullMarketRentPaid: false,
      evidenceRefs: []
    }).risk).toBe("high");
  });

  it("builds estate planning document content from the fitment review", () => {
    const review = buildEstatePlanningReview(completeFacts());
    const content = buildEstatePlanningDocumentContent("estate_planning_summary", review);

    expect(content).toContain("Estate Planning Summary Report");
    expect(content).toContain("Core estate fitment: 100%");
    expect(content).toContain("Funding and liquidity");
  });
});
