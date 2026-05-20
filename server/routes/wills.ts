import { Router } from "express";
import { asyncHandler } from "./asyncHandler";
import {
  addWillRecord,
  getWillRecords,
  updateWillRecord,
  deleteWillRecord,
  checkRevocationClauseConflicts,
  getAssetWillCoverage,
  getUnassignedAssets,
  generateWillCoordinationSummary,
} from "../services/willCoordinationService";
import {
  createDomicileRecord,
  getDomicileRecords,
  updateDomicileRecord,
  assessSnapBackRisk,
} from "../services/domicileTrackingService";

export const willsRouter = Router();

// --- Will Coordination (ADD-054 to ADD-056) ---

willsRouter.get(
  "/matters/:matterId/wills",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const wills = await getWillRecords(request.params.matterId, tenantId);
    response.json({ wills });
  })
);

willsRouter.post(
  "/matters/:matterId/wills",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const will = await addWillRecord({ ...request.body, matterId: request.params.matterId, tenantId });
    response.status(201).json({ will });
  })
);

willsRouter.patch(
  "/matters/:matterId/wills/:willId",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const will = await updateWillRecord(request.params.willId, tenantId, request.body);
    response.json({ will });
  })
);

willsRouter.delete(
  "/matters/:matterId/wills/:willId",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const result = await deleteWillRecord(request.params.willId, tenantId);
    response.json(result);
  })
);

willsRouter.get(
  "/matters/:matterId/wills/conflicts",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const conflicts = await checkRevocationClauseConflicts(request.params.matterId, tenantId);
    response.json({ conflicts });
  })
);

willsRouter.get(
  "/matters/:matterId/wills/coverage",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const coverage = await getAssetWillCoverage(request.params.matterId, tenantId);
    response.json({ coverage });
  })
);

willsRouter.get(
  "/matters/:matterId/wills/unassigned-assets",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const unassignedAssets = await getUnassignedAssets(request.params.matterId, tenantId);
    response.json({ unassignedAssets });
  })
);

willsRouter.get(
  "/matters/:matterId/wills/summary",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const summary = await generateWillCoordinationSummary(request.params.matterId, tenantId);
    response.json({ summary });
  })
);

// --- Domicile Tracking (ADD-064) ---

willsRouter.post(
  "/persons/:personId/domicile",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const record = await createDomicileRecord({ ...request.body, personId: request.params.personId, tenantId });
    response.status(201).json({ record });
  })
);

willsRouter.get(
  "/persons/:personId/domicile",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const records = await getDomicileRecords(request.params.personId, tenantId);
    response.json({ records });
  })
);

willsRouter.patch(
  "/persons/:personId/domicile/:recordId",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const record = await updateDomicileRecord(request.params.recordId, tenantId, request.body);
    response.json({ record });
  })
);

willsRouter.get(
  "/persons/:personId/domicile/snap-back-risk",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const assessment = await assessSnapBackRisk(request.params.personId, tenantId);
    response.json({ assessment });
  })
);
