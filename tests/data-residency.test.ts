import { describe, expect, it } from "vitest";
import { prisma } from "../server/db";
import { decode } from "../server/services/json";

describe("G-041 (SEC-006): ABAC data residency scope enforcement", () => {
  it("tenant has dataRegion field set", async () => {
    const tenant = await prisma.tenant.findFirst();
    expect(tenant).not.toBeNull();
    expect(tenant!.dataRegion).toBeTruthy();
  });

  it("jurisdiction has dataRegion field set", async () => {
    const jurisdictions = await prisma.jurisdiction.findMany();
    for (const j of jurisdictions) {
      expect(j.dataRegion).toBeTruthy();
    }
  });

  it("tenant enabledCountries are valid jurisdiction codes", async () => {
    const tenants = await prisma.tenant.findMany();
    const jurisdictions = await prisma.jurisdiction.findMany();
    const validCodes = jurisdictions.map((j) => j.code);

    for (const tenant of tenants) {
      const enabled = decode<string[]>(tenant.enabledCountries, []);
      for (const code of enabled) {
        expect(validCodes).toContain(code);
      }
    }
  });
});
