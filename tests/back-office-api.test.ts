import { describe, expect, it } from "vitest";
import { assertPackPublishable, backOfficeTableCatalog } from "../server/services/configurationService";
import { exportMatterBundle } from "../server/services/exportService";
import { assertFeatureEnabled } from "../server/services/featureGateService";
import { phaseOneKpis } from "../server/services/reportingService";
import { complianceEvidenceStatus, securityControlStatus } from "../server/services/securityService";

describe("back-office governance, exports, and gated modules", () => {
  it("keeps Phase-1 packs publishable through governance gates", async () => {
    const ew = await assertPackPublishable("pack-ew");
    const pt = await assertPackPublishable("pack-pt");
    expect(ew.publishable).toBe(true);
    expect(pt.publishable).toBe(true);
  });

  it("exports matter data, audit logs, and configuration snapshots", async () => {
    const bundle = await exportMatterBundle("matter-demo-ew-pt", "user-solicitor");
    expect(bundle.matterId).toBe("matter-demo-ew-pt");
    expect(bundle.documents.length).toBeGreaterThanOrEqual(0);
    expect(bundle.auditEvents.length).toBeGreaterThan(0);
    expect(bundle.configurationSnapshot).toBeTruthy();
  });

  it("blocks deferred features until the configured phase and controls are satisfied", async () => {
    await expect(assertFeatureEnabled("FR-032", "tenant-demo", "matter-demo-ew-pt")).rejects.toThrow(/gated/i);
  });

  it("reports KPI and table-maintenance coverage", async () => {
    const kpis = await phaseOneKpis();
    const tables = backOfficeTableCatalog();
    expect(kpis.activePacks).toBeGreaterThanOrEqual(2);
    expect(tables.filter((table) => table.area === "legal_content_operations").length).toBeGreaterThan(0);
  });

  it("reports security and privacy control status for BRD operations", async () => {
    const controls = await securityControlStatus();
    expect(controls.apiAuthentication).toBe("active_api_key_gate");
    expect(controls.auditCoverage).toBe("active");
    expect(controls.cyberInsurance).toBe("active_10m_plus");
    expect(controls.uplOpinions).toBe("current_for_phase_1");
  });

  it("returns compliance evidence status with SOC2/ISO tracking and gate pass rates (SEC-016)", async () => {
    const evidence = await complianceEvidenceStatus();
    expect(evidence.soc2.status).toBe("tracking");
    expect(evidence.iso27001.status).toBe("tracking");
    expect(evidence.totalGates).toBeGreaterThan(0);
    expect(evidence.gatePassRate).toBeGreaterThanOrEqual(0);
    expect(evidence.activeInsurance.length).toBeGreaterThan(0);
    expect(evidence.uplOpinions.length).toBeGreaterThanOrEqual(2);
    expect(evidence.requirementRefs).toContain("SEC-016");
  });
});
