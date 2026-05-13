import { Router } from "express";
import { asyncHandler } from "./asyncHandler";
import { exportMatterBundle } from "../services/exportService";

export const exportsRouter = Router();

exportsRouter.get(
  "/matters/:matterId",
  asyncHandler(async (request, response) => {
    response.json({ bundle: await exportMatterBundle(request.params.matterId, String(request.query.requestedBy ?? "system")) });
  })
);
