import { describe, expect, it } from "vitest";
import { prisma } from "../server/db";
import { TABLE_CATALOG } from "../shared/constants";
import { backOfficeTableCatalog } from "../server/services/configurationService";

describe("canonical schema and seeded configuration", () => {
  it("maintains the BRD canonical table catalog", () => {
    const catalog = backOfficeTableCatalog();
    expect(catalog.length).toBe(TABLE_CATALOG.length);
    expect(catalog.map((table) => table.tableName)).toContain("ConflictOfLawsMemo");
    expect(catalog.map((table) => table.tableName)).toContain("AiEvaluationRun");
    expect(catalog.map((table) => table.tableName)).toContain("UplOpinion");
    expect(catalog.map((table) => table.tableName)).toContain("PackVelocityRecord");
  });

  it("seeds Phase-1 jurisdiction packs and governance gates", async () => {
    const [packs, rules, gates, uplOpinions] = await Promise.all([
      prisma.jurisdictionPack.findMany({ where: { status: "active" } }),
      prisma.rule.findMany({ where: { status: "active" } }),
      prisma.releaseGate.findMany(),
      prisma.uplOpinion.findMany({ where: { status: "current" } })
    ]);

    expect(packs.map((pack) => pack.jurisdictionCode).sort()).toEqual(["EW", "PT"]);
    expect(rules.length).toBeGreaterThanOrEqual(6);
    expect(gates.every((gate) => gate.status === "pass")).toBe(true);
    expect(uplOpinions).toHaveLength(2);
  });
});
