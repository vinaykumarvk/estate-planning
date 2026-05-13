import { Router } from "express";
import { asyncHandler } from "./asyncHandler";
import { phaseOneKpis, reportsIndex } from "../services/reportingService";

export const reportsRouter = Router();

reportsRouter.get(
  "/phase-1-kpis",
  asyncHandler(async (_request, response) => {
    response.json({ kpis: await phaseOneKpis() });
  })
);

reportsRouter.get(
  "/snapshots",
  asyncHandler(async (_request, response) => {
    response.json({ reports: await reportsIndex() });
  })
);
