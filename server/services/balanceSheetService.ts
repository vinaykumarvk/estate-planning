import { prisma } from "../db";
import type { AssetClassSummary, BalanceSheetResult } from "../../shared/types";

export async function calculateBalanceSheet(
  matterId: string,
  tenantId: string
): Promise<BalanceSheetResult> {
  const [assets, liabilities] = await Promise.all([
    prisma.asset.findMany({ where: { matterId, tenantId } }),
    prisma.liability.findMany({ where: { matterId, tenantId } }),
  ]);

  // Group assets by assetClass
  const classMap = new Map<string, { count: number; totalValue: number; currency: string }>();
  let totalAssets = 0;

  for (const asset of assets) {
    const existing = classMap.get(asset.assetClass);
    if (existing) {
      existing.count += 1;
      existing.totalValue += asset.valuation;
    } else {
      classMap.set(asset.assetClass, {
        count: 1,
        totalValue: asset.valuation,
        currency: asset.currency,
      });
    }
    totalAssets += asset.valuation;
  }

  const byAssetClass: AssetClassSummary[] = Array.from(classMap.entries()).map(
    ([assetClass, summary]) => ({
      assetClass,
      count: summary.count,
      totalValue: summary.totalValue,
      currency: summary.currency,
    })
  );

  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
  const netWorth = totalAssets - totalLiabilities;

  // Flag stale valuations (>12 months old)
  const staleValuations = flagStaleValuations(assets, 12);

  return {
    matterId,
    totalAssets,
    totalLiabilities,
    netWorth,
    byAssetClass,
    staleValuations,
  };
}

function flagStaleValuations(
  assets: Array<{
    id: string;
    description: string;
    valuationDate: Date;
  }>,
  thresholdMonths: number
) {
  const now = new Date();
  const stale: BalanceSheetResult["staleValuations"] = [];

  for (const asset of assets) {
    const valuationDate = new Date(asset.valuationDate);
    const monthsDiff =
      (now.getFullYear() - valuationDate.getFullYear()) * 12 +
      (now.getMonth() - valuationDate.getMonth());

    if (monthsDiff > thresholdMonths) {
      stale.push({
        assetId: asset.id,
        description: asset.description,
        valuationDate: asset.valuationDate,
        monthsStale: monthsDiff,
      });
    }
  }

  return stale;
}

async function flagStaleValuationsForMatter(
  matterId: string,
  tenantId: string,
  thresholdMonths: number = 12
) {
  const assets = await prisma.asset.findMany({ where: { matterId, tenantId } });
  return flagStaleValuations(assets, thresholdMonths);
}
