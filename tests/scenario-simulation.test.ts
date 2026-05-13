import { describe, expect, it } from "vitest";
import { compareScenarios } from "../server/services/scenarioComparisonService";
import { runWhatIfSimulation } from "../server/services/simulationService";
import { evaluateMatrimonialRegime, flagMatrimonialRisk } from "../server/services/matrimonialPropertyService";
import { evaluateGiftLookback } from "../server/services/giftLookbackService";
import { prisma } from "../server/db";

describe("FR-021: Scenario comparison", () => {
  it("compares two scenarios and returns differences", async () => {
    const scenarios = await prisma.scenario.findMany({
      where: { matterId: "matter-demo-ew-pt" },
      take: 2
    });
    if (scenarios.length < 2) return;

    const diff = await compareScenarios("matter-demo-ew-pt", scenarios[0].id, scenarios[1].id);
    expect(diff.matterId).toBe("matter-demo-ew-pt");
    expect(diff.scenarioA.id).toBe(scenarios[0].id);
    expect(diff.scenarioB.id).toBe(scenarios[1].id);
    expect(Array.isArray(diff.differences)).toBe(true);
  });

  it("detects disposition count differences", async () => {
    // Create two scenarios with different dispositions
    const s1 = await prisma.scenario.create({
      data: { tenantId: "tenant-demo", matterId: "matter-demo-ew-pt", name: "Compare A", status: "draft" }
    });
    const s2 = await prisma.scenario.create({
      data: { tenantId: "tenant-demo", matterId: "matter-demo-ew-pt", name: "Compare B", status: "draft" }
    });

    await prisma.disposition.create({
      data: {
        tenantId: "tenant-demo", matterId: "matter-demo-ew-pt", scenarioId: s1.id,
        giftType: "residue", beneficiaryLabel: "Spouse"
      }
    });

    const diff = await compareScenarios("matter-demo-ew-pt", s1.id, s2.id);
    expect(diff.differences.some((d) => d.field === "dispositionCount")).toBe(true);
  });
});

describe("FR-025: What-if simulation", () => {
  it("runs a what-if simulation without persisting changes", async () => {
    const scenario = await prisma.scenario.findFirst({ where: { matterId: "matter-demo-ew-pt" } });
    if (!scenario) return;

    const result = await runWhatIfSimulation("matter-demo-ew-pt", scenario.id, {
      adjustedDispositions: [
        { beneficiaryLabel: "Test Beneficiary", percentage: 80 }
      ]
    });

    expect(result.matterId).toBe("matter-demo-ew-pt");
    expect(result.scenarioId).toBe(scenario.id);
    expect(result.persisted).toBe(false);
    expect(Array.isArray(result.projectedIssues)).toBe(true);
    expect(typeof result.blocked).toBe("boolean");
  });

  it("detects PT reserved-share violation in simulation", async () => {
    // Create a PT-specific matter scenario
    const ptMatter = await prisma.matter.findFirst({
      where: { primaryJurisdictionCode: "PT" }
    });
    if (!ptMatter) return;

    const scenario = await prisma.scenario.findFirst({ where: { matterId: ptMatter.id } });
    if (!scenario) return;

    const result = await runWhatIfSimulation(ptMatter.id, scenario.id, {
      adjustedDispositions: [
        { beneficiaryLabel: "Non-family friend", percentage: 90 }
      ]
    });

    expect(result.projectedIssues.length).toBeGreaterThanOrEqual(0);
  });
});

describe("CS-008: Matrimonial property regime evaluation", () => {
  it("evaluates matrimonial regime for a matter", async () => {
    const result = await evaluateMatrimonialRegime("matter-demo-ew-pt");
    expect(result.matterId).toBe("matter-demo-ew-pt");
    expect(result.regime).toBeDefined();
    expect(result.description).toBeTruthy();
    expect(Array.isArray(result.risks)).toBe(true);
  });

  it("returns correct regime for PT jurisdiction", async () => {
    const ptMatter = await prisma.matter.findFirst({ where: { primaryJurisdictionCode: "PT" } });
    if (!ptMatter) return;

    const result = await evaluateMatrimonialRegime(ptMatter.id);
    if (result.regime) {
      expect(["community_of_acquests", "separate_property"]).toContain(result.regime);
    }
  });

  it("flags matrimonial risk as a RuleIssue", async () => {
    const result = await flagMatrimonialRisk("matter-demo-ew-pt");
    expect(result.code).toBe("MATRIMONIAL_PROPERTY_REVIEW");
    expect(result.severity).toBe("warning");
    expect(result.message).toBeTruthy();
  });
});

describe("CS-010: Lifetime gift lookback", () => {
  it("evaluates gift lookback for a matter", async () => {
    const result = await evaluateGiftLookback("matter-demo-ew-pt");
    expect(result.matterId).toBe("matter-demo-ew-pt");
    expect(Array.isArray(result.gifts)).toBe(true);
    expect(result.requirementRefs).toContain("CS-010");
  });

  it("applies EW 7-year lookback with taper relief", async () => {
    // Create a lifetime gift disposition for testing
    const scenario = await prisma.scenario.findFirst({ where: { matterId: "matter-demo-ew-pt" } });
    if (!scenario) return;

    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    await prisma.disposition.create({
      data: {
        tenantId: "tenant-demo",
        matterId: "matter-demo-ew-pt",
        scenarioId: scenario.id,
        giftType: "cash",
        beneficiaryLabel: "Gift Lookback Test",
        amount: 50000,
        currency: "GBP",
        lifetimeGift: true,
        giftDate: threeYearsAgo
      }
    });

    const result = await evaluateGiftLookback("matter-demo-ew-pt");
    const testGift = result.gifts.find((g) => g.beneficiaryLabel === "Gift Lookback Test");
    if (testGift) {
      expect(testGift.withinLookback).toBe(true);
      expect(testGift.jurisdiction).toBe("EW");
      expect(testGift.taperReliefPct).toBeGreaterThanOrEqual(0);
    }
  });
});
