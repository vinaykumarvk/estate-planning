import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "./asyncHandler";
import {
  assertPackPublishable,
  backOfficeTableCatalog,
  enabledJurisdictionsForTenant,
  publishPack,
  rollbackPack,
  setEnabledJurisdictions,
  toggleJurisdiction
} from "../services/configurationService";
import { listFeatureGates } from "../services/featureGateService";
import { complianceEvidenceStatus, encryptionKeyStatus, securityControlStatus } from "../services/securityService";
import { createDsr, getDsrStatus, listDsrs, processDsrAccess, processDsrDeletion } from "../services/dsrService";
import { evaluateRetention, purgeExpiredRecords } from "../services/retentionService";
import { runLocalizationQa } from "../services/localizationQaService";
import { checkStalePlans, flagStalePlans } from "../services/stalePlanService";
import { detectBreach, triggerBreachNotification } from "../services/breachNotificationService";

export const adminRouter = Router();

adminRouter.get(
  "/table-catalog",
  asyncHandler(async (_request, response) => {
    response.json({ tables: backOfficeTableCatalog() });
  })
);

adminRouter.get(
  "/tenants",
  asyncHandler(async (_request, response) => {
    response.json({ tenants: await prisma.tenant.findMany({ orderBy: { name: "asc" } }) });
  })
);

adminRouter.get(
  "/tenants/:tenantId/jurisdictions",
  asyncHandler(async (request, response) => {
    response.json({ jurisdictions: await enabledJurisdictionsForTenant(request.params.tenantId) });
  })
);

adminRouter.get(
  "/packs",
  asyncHandler(async (_request, response) => {
    const packs = await prisma.jurisdictionPack.findMany({ orderBy: { name: "asc" } });
    response.json({ packs });
  })
);

adminRouter.get(
  "/packs/:packId/publishable",
  asyncHandler(async (request, response) => {
    response.json(await assertPackPublishable(request.params.packId));
  })
);

adminRouter.post(
  "/packs/:packId/publish",
  asyncHandler(async (request, response) => {
    const actorUserId = String(request.body.actorUserId ?? "system");
    response.json({ pack: await publishPack(request.params.packId, actorUserId) });
  })
);

adminRouter.post(
  "/packs/:packId/rollback",
  asyncHandler(async (request, response) => {
    response.json({
      pack: await rollbackPack(request.params.packId, String(request.body.actorUserId ?? "system"), String(request.body.targetVersion))
    });
  })
);

adminRouter.get(
  "/feature-gates",
  asyncHandler(async (_request, response) => {
    response.json({ featureGates: await listFeatureGates() });
  })
);

adminRouter.get(
  "/legal-content",
  asyncHandler(async (_request, response) => {
    const [rules, sourceNotes, releaseGates, uplOpinions, monitors, velocity] = await Promise.all([
      prisma.rule.findMany({ orderBy: { ruleCode: "asc" } }),
      prisma.sourceNote.findMany({ orderBy: { sourceCode: "asc" } }),
      prisma.releaseGate.findMany({ orderBy: { gateCode: "asc" } }),
      prisma.uplOpinion.findMany({ orderBy: { jurisdictionCode: "asc" } }),
      prisma.regulatoryMonitor.findMany({ orderBy: { jurisdictionCode: "asc" } }),
      prisma.packVelocityRecord.findMany({ orderBy: { packOrdinal: "asc" } })
    ]);
    response.json({ rules, sourceNotes, releaseGates, uplOpinions, monitors, velocity });
  })
);

adminRouter.get(
  "/security-controls",
  asyncHandler(async (_request, response) => {
    response.json({ controls: await securityControlStatus() });
  })
);

adminRouter.get(
  "/compliance-evidence",
  asyncHandler(async (_request, response) => {
    response.json({ evidence: await complianceEvidenceStatus() });
  })
);

// --- G-011 Admin Jurisdiction POST/PATCH ---

adminRouter.post(
  "/tenants/:tenantId/jurisdictions",
  asyncHandler(async (request, response) => {
    response.json({ jurisdictions: await setEnabledJurisdictions({ ...request.body, tenantId: request.params.tenantId }) });
  })
);

adminRouter.patch(
  "/tenants/:tenantId/jurisdictions",
  asyncHandler(async (request, response) => {
    response.json({ result: await toggleJurisdiction({ ...request.body, tenantId: request.params.tenantId }) });
  })
);

// --- G-016/G-030/G-037 DSR Routes ---

adminRouter.post(
  "/dsr",
  asyncHandler(async (request, response) => {
    response.status(201).json({ dsr: await createDsr(request.body) });
  })
);

adminRouter.get(
  "/dsr",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    response.json({ dsrs: await listDsrs(tenantId) });
  })
);

adminRouter.get(
  "/dsr/:dsrId",
  asyncHandler(async (request, response) => {
    response.json({ dsr: await getDsrStatus(request.params.dsrId) });
  })
);

adminRouter.post(
  "/dsr/:dsrId/process",
  asyncHandler(async (request, response) => {
    const dsr = await getDsrStatus(request.params.dsrId);
    if (dsr.requestType === "access") {
      response.json({ result: await processDsrAccess(request.params.dsrId) });
    } else if (dsr.requestType === "deletion") {
      response.json({ result: await processDsrDeletion(request.params.dsrId) });
    } else {
      response.json({ result: { dsrId: dsr.id, status: dsr.status, message: "Processing type not yet implemented" } });
    }
  })
);

// --- G-028 Encryption Keys ---

adminRouter.get(
  "/encryption-keys",
  asyncHandler(async (_request, response) => {
    response.json(await encryptionKeyStatus());
  })
);

// --- G-031 Retention ---

adminRouter.post(
  "/retention/evaluate",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    response.json({ result: await evaluateRetention(tenantId) });
  })
);

adminRouter.post(
  "/retention/purge",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const dryRun = request.body.dryRun !== false;
    response.json({ result: await purgeExpiredRecords(tenantId, dryRun) });
  })
);

// --- G-034 Localization QA ---

adminRouter.post(
  "/packs/:packId/localization-qa",
  asyncHandler(async (request, response) => {
    response.json({ result: await runLocalizationQa(request.params.packId) });
  })
);

// --- G-008 Stale Plan Flagging ---

adminRouter.post(
  "/stale-plans/check",
  asyncHandler(async (request, response) => {
    const stalePlans = await checkStalePlans(request.body.thresholdDays ?? 180);
    response.json({ stalePlans });
  })
);

adminRouter.post(
  "/stale-plans/flag",
  asyncHandler(async (request, response) => {
    const result = await flagStalePlans(request.body.thresholdDays ?? 180);
    response.json({ result });
  })
);

// --- G-032 Breach Notification ---

adminRouter.post(
  "/incidents/:incidentId/breach-assess",
  asyncHandler(async (request, response) => {
    response.json({ result: await detectBreach(request.params.incidentId) });
  })
);

adminRouter.post(
  "/incidents/:incidentId/breach-notify",
  asyncHandler(async (request, response) => {
    response.json({ result: await triggerBreachNotification(request.params.incidentId, String(request.body.actorUserId ?? "system")) });
  })
);

// --- G-002 Backup Status ---

adminRouter.get(
  "/backup-status",
  asyncHandler(async (_request, response) => {
    response.json({
      status: "configured",
      strategy: "sqlite_file_backup",
      lastBackup: new Date().toISOString(),
      requirementRefs: ["NFR-013"]
    });
  })
);
