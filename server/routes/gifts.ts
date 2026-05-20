import { Router } from "express";
import { asyncHandler } from "./asyncHandler";
import {
  addLifetimeGift,
  getLifetimeGifts,
  updateLifetimeGift,
  deleteLifetimeGift,
  calculateGiftTimeline,
  calculateExemptionAvailability,
} from "../services/lifetimeGiftService";
import { calculateBalanceSheet } from "../services/balanceSheetService";

export const giftsRouter = Router({ mergeParams: true });

// GET /api/matters/:matterId/gifts/timeline?referenceDate=
// (must be before /:giftId to avoid matching "timeline" as a giftId)
giftsRouter.get(
  "/timeline",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const { matterId } = request.params;
    const referenceDate = request.query.referenceDate
      ? new Date(request.query.referenceDate as string)
      : new Date();
    const timeline = await calculateGiftTimeline(matterId, tenantId, referenceDate);
    response.json({ timeline });
  })
);

// GET /api/matters/:matterId/gifts/exemptions?taxYear=
giftsRouter.get(
  "/exemptions",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const { matterId } = request.params;
    const taxYear = parseInt(request.query.taxYear as string, 10) || new Date().getFullYear();
    const exemptions = await calculateExemptionAvailability(matterId, tenantId, taxYear);
    response.json({ exemptions });
  })
);

// GET /api/matters/:matterId/gifts
giftsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const { matterId } = request.params;
    const gifts = await getLifetimeGifts(matterId, tenantId);
    response.json({ gifts });
  })
);

// POST /api/matters/:matterId/gifts
giftsRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const { matterId } = request.params;
    const gift = await addLifetimeGift({ ...request.body, tenantId, matterId });
    response.status(201).json({ gift });
  })
);

// PATCH /api/matters/:matterId/gifts/:giftId
giftsRouter.patch(
  "/:giftId",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const { giftId } = request.params;
    const gift = await updateLifetimeGift(giftId, tenantId, request.body);
    response.json({ gift });
  })
);

// DELETE /api/matters/:matterId/gifts/:giftId
giftsRouter.delete(
  "/:giftId",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const { giftId } = request.params;
    await deleteLifetimeGift(giftId, tenantId);
    response.json({ deleted: true });
  })
);

// --- Balance Sheet (mounted alongside gifts under matters) ---

export const balanceSheetRouter = Router({ mergeParams: true });

// GET /api/matters/:matterId/balance-sheet
balanceSheetRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const { matterId } = request.params;
    const balanceSheet = await calculateBalanceSheet(matterId, tenantId);
    response.json({ balanceSheet });
  })
);
