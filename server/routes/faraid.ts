import { Router } from "express";
import { asyncHandler } from "./asyncHandler";
import { calculateFaraidSchema } from "../../shared/schemas";
import {
  calculateFaraid,
  compareWithStatutory,
  listFaraidCalculations,
  getFaraidCalculation,
} from "../services/faraidService";
import type { FaraidCalculationResult } from "../../shared/types";

export const faraidRouter = Router();

// POST /api/faraid/calculate
faraidRouter.post(
  "/calculate",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const input = calculateFaraidSchema.parse({ ...request.body, tenantId });
    const result = await calculateFaraid(input);
    response.status(201).json({ calculation: result });
  })
);

// GET /api/faraid/matters/:matterId
faraidRouter.get(
  "/matters/:matterId",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const calculations = await listFaraidCalculations(
      request.params.matterId,
      tenantId
    );
    response.json({ calculations });
  })
);

// GET /api/faraid/:id
faraidRouter.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const calculation = await getFaraidCalculation(request.params.id, tenantId);
    if (!calculation) {
      response.status(404).json({ error: "Not found" });
      return;
    }
    response.json({
      calculation: {
        ...calculation,
        heirs: JSON.parse(calculation.heirs as string),
      },
    });
  })
);

// POST /api/faraid/:id/compare
faraidRouter.post(
  "/:id/compare",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const record = await getFaraidCalculation(request.params.id, tenantId);
    if (!record) {
      response.status(404).json({ error: "Not found" });
      return;
    }

    const faraidResult: FaraidCalculationResult = {
      id: record.id,
      matterId: record.matterId,
      deceasedPersonId: record.deceasedPersonId,
      netEstate: record.netEstate,
      currency: record.currency,
      method: record.method as "standard" | "awl" | "radd",
      heirs: JSON.parse(record.heirs as string),
      totalAllocated: record.totalAllocated,
      totalPercentage: 100,
    };
    const jurisdictionCode =
      (request.body.jurisdictionCode as string) || "NG";
    const comparison = await compareWithStatutory(
      faraidResult,
      jurisdictionCode
    );
    response.json({ comparison });
  })
);
