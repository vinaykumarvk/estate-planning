import { describe, expect, it } from "vitest";
import { createDsr, processDsrAccess, processDsrDeletion, getDsrStatus, listDsrs } from "../server/services/dsrService";
import { evaluateRetention, purgeExpiredRecords } from "../server/services/retentionService";
import { prisma } from "../server/db";

describe("CR-010 / SEC-007: DSR processing", () => {
  it("creates a DSR with 30-day deadline", async () => {
    const dsr = await createDsr({
      tenantId: "tenant-demo",
      personId: (await prisma.person.findFirst({ where: { tenantId: "tenant-demo" } }))!.id,
      requestType: "access",
      legalBasis: "GDPR Art 15"
    });

    expect(dsr.status).toBe("pending");
    expect(dsr.requestType).toBe("access");
    expect(new Date(dsr.dueAt).getTime()).toBeGreaterThan(Date.now());

    // 30-day window
    const daysDiff = (new Date(dsr.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBeGreaterThan(28);
    expect(daysDiff).toBeLessThan(31);
  });

  it("processes DSR access request and returns data bundle", async () => {
    const person = await prisma.person.findFirst({ where: { tenantId: "tenant-demo" } });
    if (!person) return;

    const dsr = await createDsr({
      tenantId: "tenant-demo",
      personId: person.id,
      requestType: "access",
      legalBasis: "GDPR Art 15"
    });

    const bundle = await processDsrAccess(dsr.id);
    expect(bundle.dsrId).toBe(dsr.id);
    expect(bundle.personId).toBe(person.id);
    expect(bundle.exportedAt).toBeTruthy();
    expect(bundle.data).toBeDefined();
    expect(bundle.data.person).toBeDefined();

    const status = await getDsrStatus(dsr.id);
    expect(status.status).toBe("completed");
  });

  it("processes DSR deletion and anonymizes person data", async () => {
    // Create a person specifically for deletion test
    const person = await prisma.person.create({
      data: {
        tenantId: "tenant-demo",
        matterId: "matter-demo-ew-pt",
        legalName: "Deletion Test Person",
        email: "delete@test.com",
        phone: "+44 7911 999999",
        dateOfBirth: new Date("1980-01-01"),
        nationality: "GB",
        residenceCountry: "GB"
      }
    });

    const dsr = await createDsr({
      tenantId: "tenant-demo",
      personId: person.id,
      requestType: "deletion",
      legalBasis: "GDPR Art 17"
    });

    const result = await processDsrDeletion(dsr.id);
    expect(result.dsrId).toBe(dsr.id);
    expect(result.anonymizedFields.length).toBeGreaterThan(0);
    expect(result.anonymizedFields).toContain("legalName");
    expect(result.legalHoldPrevented).toBe(false);

    // Verify anonymization
    const anonymized = await prisma.person.findUnique({ where: { id: person.id } });
    expect(anonymized!.legalName).toBe("[REDACTED]");
    expect(anonymized!.email).toBeNull();
  });

  it("lists DSRs for a tenant", async () => {
    const dsrs = await listDsrs("tenant-demo");
    expect(Array.isArray(dsrs)).toBe(true);
    expect(dsrs.length).toBeGreaterThan(0);
  });
});

describe("SEC-009: Retention policy enforcement", () => {
  it("evaluates retention policies and finds records", async () => {
    const result = await evaluateRetention("tenant-demo");
    expect(result.tenantId).toBe("tenant-demo");
    expect(typeof result.policies).toBe("number");
    expect(Array.isArray(result.expiredRecords)).toBe(true);
    expect(result.requirementRefs).toContain("SEC-009");
  });

  it("purge with dryRun=true does not delete", async () => {
    const countBefore = await prisma.auditEvent.count({ where: { tenantId: "tenant-demo" } });
    const result = await purgeExpiredRecords("tenant-demo", true);
    expect(result.dryRun).toBe(true);
    const countAfter = await prisma.auditEvent.count({ where: { tenantId: "tenant-demo" } });
    expect(countAfter).toBeGreaterThanOrEqual(countBefore);
  });
});

describe("SEC-005: Data sensitivity classification", () => {
  it("documents have sensitivityClass field defaulting to confidential", async () => {
    const doc = await prisma.document.findFirst();
    if (doc) {
      expect(doc.sensitivityClass).toBeTruthy();
      expect(doc.sensitivityClass).toBe("confidential");
    }
  });

  it("persons have sensitivityClass field", async () => {
    const person = await prisma.person.findFirst();
    if (person) {
      expect(person.sensitivityClass).toBeTruthy();
    }
  });
});

describe("NFR-011: Privacy by design — field-level sensitivity", () => {
  it("DSR deletion respects legal hold on open matters", async () => {
    const person = await prisma.person.create({
      data: {
        tenantId: "tenant-demo",
        matterId: "matter-demo-ew-pt",
        legalName: "Legal Hold Test Person",
        email: "hold@test.com"
      }
    });

    // Create a matter in review status to trigger legal hold
    const holdMatter = await prisma.matter.create({
      data: {
        tenantId: "tenant-demo",
        matterNumber: `M-HOLD-TEST-${Date.now()}`,
        title: "Legal Hold Test",
        mode: "single",
        primaryJurisdictionCode: "EW",
        status: "review",
        languageOfRecord: "en-GB",
        engagementStatus: "active",
        createdByUserId: "user-solicitor"
      }
    });

    const dsr = await createDsr({
      tenantId: "tenant-demo",
      personId: person.id,
      requestType: "deletion",
      legalBasis: "GDPR Art 17"
    });

    const result = await processDsrDeletion(dsr.id);
    expect(result.legalHoldPrevented).toBe(true);
    expect(result.anonymizedFields).toHaveLength(0);

    // Verify person data was NOT anonymized
    const preserved = await prisma.person.findUnique({ where: { id: person.id } });
    expect(preserved!.legalName).toBe("Legal Hold Test Person");

    // Cleanup
    await prisma.matter.delete({ where: { id: holdMatter.id } });
  });
});
