import { Router } from "express";
import { asyncHandler } from "./asyncHandler";
import { estatePlanningRecordTypeSchema } from "../../shared/schemas";
import {
  archiveEstatePlanningRecord,
  assessGrobRisk,
  calculateQuickSuccessionRelief,
  createEstatePlanningRecord,
  generateEstatePlanningReview,
  listEstatePlanningRecords,
  updateEstatePlanningRecord
} from "../services/estatePlanningReviewService";
import {
  archiveCoreEstateData,
  createCoreEstateData,
  listCoreEstateData,
  updateCoreEstateData,
  type CoreEstateDataset
} from "../services/coreEstateDataService";

export const estatePlanningRouter = Router({ mergeParams: true });

const CORE_DATASETS = new Set<CoreEstateDataset>([
  "cash-flow",
  "protection-policies",
  "trusts",
  "incapacity-instruments",
  "tax-positions",
  "relief-assessments",
  "outside-estate-nominations"
]);

function parseCoreDataset(value: string): CoreEstateDataset {
  if (!CORE_DATASETS.has(value as CoreEstateDataset)) {
    throw new Error("Unknown core estate dataset");
  }
  return value as CoreEstateDataset;
}

estatePlanningRouter.get(
  "/records",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const recordType = request.query.recordType
      ? estatePlanningRecordTypeSchema.parse(request.query.recordType)
      : undefined;
    const records = await listEstatePlanningRecords(request.params.matterId, tenantId, recordType);
    response.json({ records });
  })
);

estatePlanningRouter.post(
  "/records",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const record = await createEstatePlanningRecord({
      ...request.body,
      tenantId,
      matterId: request.params.matterId
    });
    response.status(201).json({ record });
  })
);

estatePlanningRouter.patch(
  "/records/:recordId",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const record = await updateEstatePlanningRecord(request.params.recordId, tenantId, request.body);
    response.json({ record });
  })
);

estatePlanningRouter.delete(
  "/records/:recordId",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const record = await archiveEstatePlanningRecord(request.params.recordId, tenantId);
    response.json({ record, archived: true });
  })
);

estatePlanningRouter.get(
  "/review",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const referenceDate = request.query.referenceDate
      ? new Date(String(request.query.referenceDate))
      : new Date();
    const review = await generateEstatePlanningReview(request.params.matterId, tenantId, referenceDate);
    response.json({ review });
  })
);

estatePlanningRouter.post(
  "/quick-succession",
  asyncHandler(async (request, response) => {
    response.json({ result: calculateQuickSuccessionRelief(request.body) });
  })
);

estatePlanningRouter.post(
  "/grob-assessment",
  asyncHandler(async (request, response) => {
    response.json({ result: assessGrobRisk(request.body) });
  })
);

estatePlanningRouter.get(
  "/:dataset",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const dataset = parseCoreDataset(request.params.dataset);
    response.json({ records: await listCoreEstateData(dataset, request.params.matterId, tenantId) });
  })
);

estatePlanningRouter.post(
  "/:dataset",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const dataset = parseCoreDataset(request.params.dataset);
    const record = await createCoreEstateData(dataset, request.params.matterId, tenantId, request.body);
    response.status(201).json({ record });
  })
);

estatePlanningRouter.patch(
  "/:dataset/:recordId",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const dataset = parseCoreDataset(request.params.dataset);
    response.json({ record: await updateCoreEstateData(dataset, request.params.recordId, tenantId, request.body) });
  })
);

estatePlanningRouter.delete(
  "/:dataset/:recordId",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const dataset = parseCoreDataset(request.params.dataset);
    response.json({ record: await archiveCoreEstateData(dataset, request.params.recordId, tenantId), archived: true });
  })
);
