import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "./asyncHandler";
import { createIhtCalculationSchema } from "../../shared/schemas";
import {
  calculateIhtForPerson,
  calculateHouseholdIht,
  compareIhtScenarios,
  getIhtThresholds,
} from "../services/ihtCalculationService";
import { decode } from "../services/json";

export const ihtRouter = Router();

// POST /api/iht/matters/:matterId/iht/calculate — single person IHT calculation
ihtRouter.post(
  "/matters/:matterId/iht/calculate",
  asyncHandler(async (request, response) => {
    const { personId, scenarioId, effectiveDate } = request.body;
    const matterId = request.params.matterId;

    // Validate via schema (tenantId from locals)
    const tenantId = response.locals.tenantId as string;
    createIhtCalculationSchema.parse({
      tenantId,
      matterId,
      personId,
      scenarioId,
      effectiveDate,
    });

    const result = await calculateIhtForPerson(
      matterId,
      personId,
      scenarioId,
      new Date(effectiveDate)
    );
    response.status(201).json({ calculation: result });
  })
);

// POST /api/iht/matters/:matterId/iht/household — household IHT calculation
ihtRouter.post(
  "/matters/:matterId/iht/household",
  asyncHandler(async (request, response) => {
    const { scenarioId, effectiveDate } = request.body;
    const matterId = request.params.matterId;

    const result = await calculateHouseholdIht(
      matterId,
      scenarioId,
      new Date(effectiveDate)
    );
    response.status(201).json({ household: result });
  })
);

// POST /api/iht/matters/:matterId/iht/compare — compare IHT across scenarios
ihtRouter.post(
  "/matters/:matterId/iht/compare",
  asyncHandler(async (request, response) => {
    const { scenarioIds, effectiveDate } = request.body;
    const matterId = request.params.matterId;

    const result = await compareIhtScenarios(
      matterId,
      scenarioIds,
      new Date(effectiveDate)
    );
    response.json({ comparison: result });
  })
);

// GET /api/iht/matters/:matterId/iht/calculations — list saved calculations
ihtRouter.get(
  "/matters/:matterId/iht/calculations",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const calculations = await prisma.ihtCalculation.findMany({
      where: { matterId: request.params.matterId, tenantId },
      orderBy: { createdAt: "desc" },
    });

    const mapped = calculations.map((c) => ({
      ...c,
      exemptionsApplied: decode(c.exemptionsApplied, {}),
      sevenYearTransfers: decode(c.sevenYearTransfers, []),
      calculationDetails: decode(c.calculationDetails, {}),
    }));

    response.json({ calculations: mapped });
  })
);

// GET /api/iht/matters/:matterId/iht/thresholds — return current thresholds
ihtRouter.get(
  "/matters/:matterId/iht/thresholds",
  asyncHandler(async (request, response) => {
    const thresholds = getIhtThresholds(new Date());
    response.json({ thresholds });
  })
);
