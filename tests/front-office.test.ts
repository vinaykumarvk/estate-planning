import { describe, expect, it } from "vitest";
import { calculateIntakeScore } from "../server/services/intakeService";
import { addAsset, createMatter, getMatterWorkspace } from "../server/services/matterService";
import { prisma } from "../server/db";

describe("front-office planning mode", () => {
  it("loads a matter workspace with intake, people, assets, and audit", async () => {
    const workspace = await getMatterWorkspace("matter-demo-ew-pt");
    expect(workspace.matter.title).toContain("Morgan family");
    expect(workspace.people.length).toBeGreaterThanOrEqual(3);
    expect(workspace.assets.length).toBeGreaterThanOrEqual(2);
    expect(workspace.auditEvents.length).toBeGreaterThan(0);
  });

  it("calculates intake completeness and missing critical modules", async () => {
    const intake = await calculateIntakeScore("matter-demo-ew-pt");
    expect(intake.score).toBeGreaterThanOrEqual(75);
    expect(intake.missingCritical).not.toContain("privacy consent");
  });

  it("creates a new B2B planning matter and asset with audit evidence", async () => {
    const matter = await createMatter({
      tenantId: "tenant-demo",
      title: "Portugal resident will",
      primaryJurisdictionCode: "PT",
      additionalJurisdictions: [],
      languageOfRecord: "pt-PT",
      createdByUserId: "user-notary",
      jointMatter: false
    });

    const asset = await addAsset({
      tenantId: "tenant-demo",
      matterId: matter.id,
      assetClass: "bank_account",
      description: "Lisbon bank account",
      jurisdictionCode: "PT",
      situsCountry: "PT",
      currency: "EUR",
      valuation: 65000,
      valuationDate: new Date(),
      valuationSource: "statement",
      confidenceLevel: "high",
      ownershipType: "sole",
      evidenceRefs: ["statement-2026"]
    });

    const audits = await prisma.auditEvent.findMany({ where: { matterId: matter.id } });
    expect(asset.situsCountry).toBe("PT");
    expect(audits.map((event) => event.eventType)).toEqual(expect.arrayContaining(["matter.created", "asset.created"]));
  });
});
