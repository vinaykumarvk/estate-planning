import { describe, expect, it } from "vitest";
import { setEnabledJurisdictions, toggleJurisdiction } from "../server/services/configurationService";
import { checkStalePlans, flagStalePlans } from "../server/services/stalePlanService";
import { detectBreach, triggerBreachNotification } from "../server/services/breachNotificationService";
import { encryptionKeyStatus } from "../server/services/securityService";
import { createApp } from "../server/app";
import request from "supertest";
import { prisma } from "../server/db";

const app = createApp();
const API_KEY = "demo-api-key";

describe("FR-001: Admin jurisdiction management", () => {
  it("sets enabled jurisdictions for a tenant", async () => {
    const result = await setEnabledJurisdictions({
      tenantId: "tenant-demo",
      actorUserId: "user-solicitor",
      jurisdictionCodes: ["EW", "PT"]
    });
    expect(result).toEqual(expect.arrayContaining(["EW", "PT"]));
  });

  it("rejects invalid jurisdiction codes", async () => {
    await expect(
      setEnabledJurisdictions({
        tenantId: "tenant-demo",
        actorUserId: "user-solicitor",
        jurisdictionCodes: ["EW", "INVALID_CODE"]
      })
    ).rejects.toThrow();
  });

  it("toggles a jurisdiction on and off", async () => {
    const onResult = await toggleJurisdiction({
      tenantId: "tenant-demo",
      actorUserId: "user-solicitor",
      jurisdictionCode: "EW",
      enabled: true
    });
    expect(onResult.jurisdictions).toContain("EW");

    const offResult = await toggleJurisdiction({
      tenantId: "tenant-demo",
      actorUserId: "user-solicitor",
      jurisdictionCode: "EW",
      enabled: false
    });
    expect(offResult.jurisdictions).not.toContain("EW");

    // Re-enable for other tests
    await toggleJurisdiction({
      tenantId: "tenant-demo",
      actorUserId: "user-solicitor",
      jurisdictionCode: "EW",
      enabled: true
    });
  });
});

describe("CR-015: Stale-plan flagging", () => {
  it("checks for stale plans", async () => {
    const result = await checkStalePlans(180);
    expect(Array.isArray(result)).toBe(true);
    for (const plan of result) {
      expect(plan.matterId).toBeTruthy();
      expect(plan.daysSinceUpdate).toBeGreaterThanOrEqual(180);
    }
  });

  it("flags stale plans and creates tasks", async () => {
    const result = await flagStalePlans(180);
    expect(typeof result.flaggedCount).toBe("number");
    expect(Array.isArray(result.matterIds)).toBe(true);
    expect(result.requirementRefs).toContain("CR-015");
  });
});

describe("SEC-014: Breach notification workflow", () => {
  it("detects breach from an incident", async () => {
    const incident = await prisma.incident.create({
      data: {
        tenantId: "tenant-demo",
        incidentClass: "data_exposure",
        title: "Test Data Exposure Incident",
        description: "Test incident for breach detection",
        affectedUsers: 50,
        status: "open"
      }
    });

    const assessment = await detectBreach(incident.id);
    expect(assessment.incidentId).toBe(incident.id);
    expect(typeof assessment.isPersonalDataBreach).toBe("boolean");
    expect(assessment.affectedUsers).toBe(50);
    expect(assessment.severity).toBe("medium");
    expect(assessment.gdprNotificationRequired).toBe(true);
    expect(assessment.deadlineHours).toBe(72);
  });

  it("triggers breach notification", async () => {
    const incident = await prisma.incident.create({
      data: {
        tenantId: "tenant-demo",
        incidentClass: "unauthorized_access",
        title: "Test Unauthorized Access Incident",
        description: "Test incident for notification",
        affectedUsers: 200,
        status: "open"
      }
    });

    const result = await triggerBreachNotification(incident.id, "user-admin");
    expect(result.incidentId).toBe(incident.id);
    expect(result.notified).toBe(true);
    expect(result.notifiedAt).toBeTruthy();

    // Verify incident was updated
    const updated = await prisma.incident.findUnique({ where: { id: incident.id } });
    expect(updated!.breachNotified).toBe(true);
  });
});

describe("SEC-001: Encryption key management", () => {
  it("reports encryption key status", async () => {
    const status = await encryptionKeyStatus();
    expect(status).toBeDefined();
    expect(typeof status.activeKeys).toBe("number");
    expect(typeof status.overdueRotations).toBe("number");
    expect(Array.isArray(status.keys)).toBe(true);
  });
});

describe("SEC-015 / SEC-017 / NFR-013: Operational controls", () => {
  it("GET /api/admin/backup-status returns backup configuration", async () => {
    const res = await request(app)
      .get("/api/admin/backup-status")
      .set("x-api-key", API_KEY);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("configured");
    expect(res.body.strategy).toBeTruthy();
    expect(res.body.requirementRefs).toContain("NFR-013");
  });

  it("GET /api/admin/encryption-keys returns key status", async () => {
    const res = await request(app)
      .get("/api/admin/encryption-keys")
      .set("x-api-key", API_KEY);
    expect(res.status).toBe(200);
    expect(res.body.activeKeys).toBeDefined();
  });
});
