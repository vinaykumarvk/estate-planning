import { prisma } from "../db";
import { createLifetimeGiftSchema, updateLifetimeGiftSchema } from "../../shared/schemas";
import { encode } from "./json";
import { audit } from "./auditService";
import type { GiftClassification, GiftExemption, TaperBand, GiftTimelineResult } from "../../shared/types";

const NRB = 325000;
const SEVEN_YEARS_MS = 7 * 365.25 * 24 * 60 * 60 * 1000;

const TAPER_BANDS: Array<{ min: number; max: number; band: TaperBand; reliefPercent: number }> = [
  { min: 0, max: 3, band: "0-3", reliefPercent: 0 },
  { min: 3, max: 4, band: "3-4", reliefPercent: 20 },
  { min: 4, max: 5, band: "4-5", reliefPercent: 40 },
  { min: 5, max: 6, band: "5-6", reliefPercent: 60 },
  { min: 6, max: 7, band: "6-7", reliefPercent: 80 },
];

function classifyGift(exemptionClaimed: GiftExemption): GiftClassification {
  if (["annual", "small_gift", "normal_expenditure", "marriage", "charity", "spouse"].includes(exemptionClaimed)) {
    return "exempt";
  }
  return "pet";
}

function getTaperBand(yearsElapsed: number): { band: TaperBand; reliefPercent: number } {
  for (const tb of TAPER_BANDS) {
    if (yearsElapsed >= tb.min && yearsElapsed < tb.max) {
      return { band: tb.band, reliefPercent: tb.reliefPercent };
    }
  }
  return { band: "7+", reliefPercent: 100 };
}

export async function addLifetimeGift(input: unknown) {
  const data = createLifetimeGiftSchema.parse(input);
  const gift = await prisma.lifetimeGift.create({
    data: {
      tenantId: data.tenantId,
      matterId: data.matterId,
      donorPersonId: data.donorPersonId,
      recipientPersonId: data.recipientPersonId,
      giftDate: data.giftDate,
      value: data.value,
      currency: data.currency,
      assetType: data.assetType,
      relationship: data.relationship,
      exemptionClaimed: data.exemptionClaimed,
      petOrClt: data.petOrClt,
      description: data.description,
      evidenceRefs: encode(data.evidenceRefs),
    },
  });

  await audit({
    tenantId: gift.tenantId,
    matterId: gift.matterId,
    actorRole: "professional",
    eventType: "lifetime_gift.created",
    entityType: "LifetimeGift",
    entityId: gift.id,
    metadata: { requirementRefs: ["ADD-022", "ADD-023"] },
  });

  return gift;
}

export async function getLifetimeGifts(matterId: string, tenantId: string) {
  return prisma.lifetimeGift.findMany({
    where: { matterId, tenantId },
    orderBy: { giftDate: "desc" },
  });
}

export async function updateLifetimeGift(giftId: string, tenantId: string, input: unknown) {
  const data = updateLifetimeGiftSchema.parse(input);
  const updateData: Record<string, unknown> = { ...data };
  if (data.evidenceRefs) {
    updateData.evidenceRefs = encode(data.evidenceRefs);
  }

  // Verify ownership before updating
  const existing = await prisma.lifetimeGift.findFirst({ where: { id: giftId, tenantId } });
  if (!existing) throw new Error("Gift not found or access denied");

  const gift = await prisma.lifetimeGift.update({
    where: { id: giftId },
    data: updateData,
  });

  await audit({
    tenantId: gift.tenantId,
    matterId: gift.matterId,
    actorRole: "professional",
    eventType: "lifetime_gift.updated",
    entityType: "LifetimeGift",
    entityId: gift.id,
    metadata: { requirementRefs: ["ADD-022", "ADD-023"] },
  });

  return gift;
}

export async function deleteLifetimeGift(giftId: string, tenantId: string) {
  // Verify ownership before deleting
  const existing = await prisma.lifetimeGift.findFirst({ where: { id: giftId, tenantId } });
  if (!existing) throw new Error("Gift not found or access denied");

  const gift = await prisma.lifetimeGift.delete({ where: { id: giftId } });

  await audit({
    tenantId: gift.tenantId,
    matterId: gift.matterId,
    actorRole: "professional",
    eventType: "lifetime_gift.deleted",
    entityType: "LifetimeGift",
    entityId: gift.id,
    metadata: { requirementRefs: ["ADD-022", "ADD-023"] },
  });

  return gift;
}

export async function calculateGiftTimeline(
  matterId: string,
  tenantId: string,
  referenceDate: Date
): Promise<GiftTimelineResult> {
  const gifts = await prisma.lifetimeGift.findMany({
    where: { matterId, tenantId },
    orderBy: { giftDate: "asc" },
  });

  const timelineGifts: GiftTimelineResult["gifts"] = [];
  let cumulativeTotal = 0;

  for (const gift of gifts) {
    const yearsElapsed = (referenceDate.getTime() - gift.giftDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    // Only include gifts within 7 years
    if (yearsElapsed < 0 || yearsElapsed >= 7) continue;

    const { band, reliefPercent } = getTaperBand(yearsElapsed);
    const projectedFallOffDate = new Date(gift.giftDate.getTime() + SEVEN_YEARS_MS);

    const isExempt = classifyGift(gift.exemptionClaimed as GiftExemption) === "exempt";
    const nrbImpact = isExempt ? 0 : gift.value;

    if (!isExempt) {
      cumulativeTotal += gift.value;
    }

    timelineGifts.push({
      id: gift.id,
      matterId: gift.matterId,
      donorPersonId: gift.donorPersonId,
      recipientPersonId: gift.recipientPersonId,
      giftDate: gift.giftDate,
      value: gift.value,
      currency: gift.currency,
      assetType: gift.assetType,
      relationship: gift.relationship,
      exemptionClaimed: gift.exemptionClaimed as GiftExemption,
      petOrClt: gift.petOrClt as GiftClassification,
      description: gift.description,
      taperBand: band,
      yearsElapsed: Math.round(yearsElapsed * 100) / 100,
      taperReliefPercent: reliefPercent,
      projectedFallOffDate,
      nrbImpact,
    });
  }

  const nrbRemaining = Math.max(0, NRB - cumulativeTotal);

  return {
    matterId,
    referenceDate,
    gifts: timelineGifts,
    cumulativeTotal,
    nrbRemaining,
  };
}

export async function calculateExemptionAvailability(
  matterId: string,
  tenantId: string,
  taxYear: number
) {
  const ANNUAL_EXEMPTION = 3000;
  const SMALL_GIFT_LIMIT = 250;

  // Tax year runs 6 April to 5 April
  const taxYearStart = new Date(taxYear, 3, 6); // April 6
  const taxYearEnd = new Date(taxYear + 1, 3, 5); // April 5

  const prevTaxYearStart = new Date(taxYear - 1, 3, 6);
  const prevTaxYearEnd = new Date(taxYear, 3, 5);

  // Get gifts in current tax year
  const currentYearGifts = await prisma.lifetimeGift.findMany({
    where: {
      matterId,
      tenantId,
      giftDate: { gte: taxYearStart, lte: taxYearEnd },
    },
  });

  // Get gifts in previous tax year (for carry-forward)
  const prevYearGifts = await prisma.lifetimeGift.findMany({
    where: {
      matterId,
      tenantId,
      giftDate: { gte: prevTaxYearStart, lte: prevTaxYearEnd },
    },
  });

  // Calculate annual exemption usage
  const currentAnnualUsed = currentYearGifts
    .filter((g) => g.exemptionClaimed === "annual")
    .reduce((sum, g) => sum + g.value, 0);

  const prevAnnualUsed = prevYearGifts
    .filter((g) => g.exemptionClaimed === "annual")
    .reduce((sum, g) => sum + g.value, 0);

  const prevYearCarryForward = Math.max(0, ANNUAL_EXEMPTION - prevAnnualUsed);
  const totalAnnualAvailable = ANNUAL_EXEMPTION + prevYearCarryForward;
  const annualRemaining = Math.max(0, totalAnnualAvailable - currentAnnualUsed);

  // Count small gifts per recipient
  const smallGiftsByRecipient: Record<string, number> = {};
  for (const gift of currentYearGifts) {
    if (gift.exemptionClaimed === "small_gift" && gift.recipientPersonId) {
      smallGiftsByRecipient[gift.recipientPersonId] =
        (smallGiftsByRecipient[gift.recipientPersonId] ?? 0) + gift.value;
    }
  }

  return {
    taxYear,
    annualExemption: {
      total: totalAnnualAvailable,
      used: currentAnnualUsed,
      remaining: annualRemaining,
      carryForwardFromPrevYear: prevYearCarryForward,
    },
    smallGifts: {
      limit: SMALL_GIFT_LIMIT,
      byRecipient: smallGiftsByRecipient,
    },
  };
}
