import { Router } from "express";
import { asyncHandler } from "./asyncHandler";
import { assertFeatureEnabled } from "../services/featureGateService";

export const deferredRouter = Router();

deferredRouter.post(
  "/:featureCode/use",
  asyncHandler(async (request, response) => {
    await assertFeatureEnabled(String(request.params.featureCode), String(request.body.tenantId), request.body.matterId);
    response.json({ enabled: true });
  })
);
