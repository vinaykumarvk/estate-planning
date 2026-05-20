import { prisma } from "../db";
import { audit } from "./auditService";
import { encode } from "./json";
import type {
  FaraidHeirInput,
  FaraidHeirShare,
  FaraidCalculationResult,
  StatutoryComparisonResult,
} from "../../shared/types";

// ---------------------------------------------------------------------------
// Quranic fixed shares (fard)
// ---------------------------------------------------------------------------

const FIXED_SHARES: Record<
  string,
  { withChildren: number | null; withoutChildren: number | null }
> = {
  husband: { withChildren: 1 / 4, withoutChildren: 1 / 2 },
  wife: { withChildren: 1 / 8, withoutChildren: 1 / 4 },
  father: { withChildren: 1 / 6, withoutChildren: null },
  mother: { withChildren: 1 / 6, withoutChildren: 1 / 3 },
  daughter: { withChildren: null, withoutChildren: 1 / 2 },
  grandmother: { withChildren: 1 / 6, withoutChildren: 1 / 6 },
  grandfather: { withChildren: 1 / 6, withoutChildren: null },
  full_sister: { withChildren: null, withoutChildren: 1 / 2 },
  paternal_sister: { withChildren: null, withoutChildren: 1 / 2 },
  maternal_brother: { withChildren: null, withoutChildren: 1 / 6 },
  maternal_sister: { withChildren: null, withoutChildren: 1 / 6 },
};

// ---------------------------------------------------------------------------
// Blocking rules (hajb)
// ---------------------------------------------------------------------------

function getBlockedHeirs(heirs: FaraidHeirInput[]): Map<string, string> {
  const blocked = new Map<string, string>();
  const types = new Set(heirs.map((h) => h.heirType));

  // Father blocks grandfather, all siblings, nephews
  if (types.has("father")) {
    if (types.has("grandfather"))
      blocked.set("grandfather", "Blocked by father");
    if (types.has("full_brother"))
      blocked.set("full_brother", "Blocked by father");
    if (types.has("full_sister"))
      blocked.set("full_sister", "Blocked by father");
    if (types.has("paternal_brother"))
      blocked.set("paternal_brother", "Blocked by father");
    if (types.has("paternal_sister"))
      blocked.set("paternal_sister", "Blocked by father");
    if (types.has("maternal_brother"))
      blocked.set("maternal_brother", "Blocked by father");
    if (types.has("maternal_sister"))
      blocked.set("maternal_sister", "Blocked by father");
    if (types.has("paternal_uncle"))
      blocked.set("paternal_uncle", "Blocked by father");
  }

  // Son blocks grandson, granddaughter
  if (types.has("son")) {
    if (types.has("grandson")) blocked.set("grandson", "Blocked by son");
    if (types.has("granddaughter"))
      blocked.set("granddaughter", "Blocked by son");
  }

  // Full brother blocks paternal half-siblings
  if (types.has("full_brother")) {
    if (types.has("paternal_brother"))
      blocked.set("paternal_brother", "Blocked by full brother");
    if (types.has("paternal_sister"))
      blocked.set("paternal_sister", "Blocked by full brother");
  }

  // Children block maternal siblings
  if (types.has("son") || types.has("daughter")) {
    if (types.has("maternal_brother"))
      blocked.set("maternal_brother", "Blocked by children");
    if (types.has("maternal_sister"))
      blocked.set("maternal_sister", "Blocked by children");
  }

  // Grandfather blocks paternal uncle
  if (types.has("grandfather")) {
    if (types.has("paternal_uncle"))
      blocked.set("paternal_uncle", "Blocked by grandfather");
  }

  return blocked;
}

// ---------------------------------------------------------------------------
// Compute fixed shares for each heir
// ---------------------------------------------------------------------------

function computeFixedShares(
  heirs: FaraidHeirInput[],
  blockedHeirs: Map<string, string>
): FaraidHeirShare[] {
  const hasChildren = heirs.some(
    (h) =>
      ["son", "daughter", "grandson", "granddaughter"].includes(h.heirType) &&
      !blockedHeirs.has(h.heirType)
  );
  const hasSon = heirs.some(
    (h) => h.heirType === "son" && !blockedHeirs.has("son")
  );
  const results: FaraidHeirShare[] = [];

  for (const heir of heirs) {
    if (blockedHeirs.has(heir.heirType)) {
      results.push({
        heirType: heir.heirType,
        name: heir.name,
        personId: heir.personId,
        quranicFraction: "0",
        percentage: 0,
        amount: 0,
        blocked: true,
        blockReason: blockedHeirs.get(heir.heirType),
      });
      continue;
    }

    let fraction: number | null = null;
    let fractionStr = "residuary";
    const count = heir.count ?? 1;

    switch (heir.heirType) {
      case "husband":
        fraction = hasChildren ? 1 / 4 : 1 / 2;
        fractionStr = hasChildren ? "1/4" : "1/2";
        break;
      case "wife":
        fraction = (hasChildren ? 1 / 8 : 1 / 4) / count;
        fractionStr = hasChildren ? `1/8 \u00F7 ${count}` : `1/4 \u00F7 ${count}`;
        break;
      case "father":
        fraction = hasChildren ? 1 / 6 : null;
        fractionStr = hasChildren ? "1/6" : "residuary";
        break;
      case "mother":
        fraction = hasChildren ? 1 / 6 : 1 / 3;
        fractionStr = hasChildren ? "1/6" : "1/3";
        break;
      case "daughter":
        if (hasSon) {
          fraction = null;
          fractionStr = "residuary (1:2 with son)";
        } else {
          const daughterCount = heirs
            .filter((h) => h.heirType === "daughter")
            .reduce((s, h) => s + (h.count ?? 1), 0);
          fraction = daughterCount === 1 ? 1 / 2 : 2 / 3 / daughterCount;
          fractionStr = daughterCount === 1 ? "1/2" : `2/3 \u00F7 ${daughterCount}`;
        }
        break;
      case "son":
        fraction = null;
        fractionStr = "residuary";
        break;
      case "grandson":
        fraction = null;
        fractionStr = "residuary";
        break;
      case "granddaughter":
        fraction = null;
        fractionStr = "residuary";
        break;
      case "grandmother":
        fraction = 1 / 6;
        fractionStr = "1/6";
        break;
      case "grandfather":
        fraction = hasChildren ? 1 / 6 : null;
        fractionStr = hasChildren ? "1/6" : "residuary";
        break;
      case "full_brother":
        if (!hasChildren) {
          fraction = null;
          fractionStr = "residuary";
        }
        break;
      case "full_sister":
        if (!hasChildren) {
          const sisterCount = heirs
            .filter((h) => h.heirType === "full_sister")
            .reduce((s, h) => s + (h.count ?? 1), 0);
          const hasFullBrother = heirs.some(
            (h) => h.heirType === "full_brother"
          );
          if (hasFullBrother) {
            fraction = null;
            fractionStr = "residuary (1:2 with brother)";
          } else {
            fraction = sisterCount === 1 ? 1 / 2 : 2 / 3 / sisterCount;
            fractionStr =
              sisterCount === 1 ? "1/2" : `2/3 \u00F7 ${sisterCount}`;
          }
        }
        break;
      case "paternal_brother":
        fraction = null;
        fractionStr = "residuary";
        break;
      case "paternal_sister":
        if (!hasChildren) {
          const pSisterCount = heirs
            .filter((h) => h.heirType === "paternal_sister")
            .reduce((s, h) => s + (h.count ?? 1), 0);
          const hasPatBrother = heirs.some(
            (h) => h.heirType === "paternal_brother"
          );
          if (hasPatBrother) {
            fraction = null;
            fractionStr = "residuary (1:2 with brother)";
          } else {
            fraction = pSisterCount === 1 ? 1 / 2 : 2 / 3 / pSisterCount;
            fractionStr =
              pSisterCount === 1 ? "1/2" : `2/3 \u00F7 ${pSisterCount}`;
          }
        }
        break;
      case "maternal_brother":
      case "maternal_sister": {
        const maternalCount = heirs
          .filter(
            (h) =>
              (h.heirType === "maternal_brother" ||
                h.heirType === "maternal_sister") &&
              !blockedHeirs.has(h.heirType)
          )
          .reduce((s, h) => s + (h.count ?? 1), 0);
        fraction = maternalCount === 1 ? 1 / 6 : (1 / 3) / maternalCount;
        fractionStr =
          maternalCount === 1 ? "1/6" : `1/3 \u00F7 ${maternalCount}`;
        break;
      }
      case "paternal_uncle":
        fraction = null;
        fractionStr = "residuary";
        break;
    }

    results.push({
      heirType: heir.heirType,
      name: heir.name,
      personId: heir.personId,
      quranicFraction: fractionStr,
      percentage: fraction !== null ? fraction * 100 : 0,
      amount: 0,
      blocked: false,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Distribute residuary shares and detect awl / radd
// ---------------------------------------------------------------------------

function distributeResiduary(
  shares: FaraidHeirShare[],
  netEstate: number
): { shares: FaraidHeirShare[]; method: "standard" | "awl" | "radd" } {
  const fixedTotal = shares
    .filter((s) => !s.blocked && s.percentage > 0)
    .reduce((sum, s) => sum + s.percentage, 0);
  const residuaryHeirs = shares.filter(
    (s) => !s.blocked && s.percentage === 0
  );

  if (fixedTotal > 100 && residuaryHeirs.length === 0) {
    // AWL: proportional reduction when shares exceed 100%
    const factor = 100 / fixedTotal;
    for (const s of shares) {
      if (!s.blocked) {
        s.percentage *= factor;
        s.amount = (s.percentage / 100) * netEstate;
      }
    }
    return { shares, method: "awl" };
  }

  const residuaryPercent = 100 - fixedTotal;

  if (residuaryHeirs.length > 0 && residuaryPercent > 0) {
    // Distribute residuary among residuary heirs
    // Sons get 2x daughters (asaba)
    let totalShares = 0;
    const shareWeights: number[] = [];
    for (const h of residuaryHeirs) {
      const weight = [
        "son",
        "full_brother",
        "paternal_brother",
        "grandson",
        "father",
        "grandfather",
        "paternal_uncle",
      ].includes(h.heirType)
        ? 2
        : 1;
      shareWeights.push(weight);
      totalShares += weight;
    }

    for (let i = 0; i < residuaryHeirs.length; i++) {
      residuaryHeirs[i].percentage =
        (shareWeights[i] / totalShares) * residuaryPercent;
    }
  }

  // Check for RADD: if no residuary heirs and total < 100
  if (residuaryHeirs.length === 0 && fixedTotal < 100) {
    // Redistribute excess to blood relatives (not spouse)
    const bloodRelatives = shares.filter(
      (s) =>
        !s.blocked &&
        s.percentage > 0 &&
        s.heirType !== "husband" &&
        s.heirType !== "wife"
    );
    if (bloodRelatives.length > 0) {
      const bloodTotal = bloodRelatives.reduce(
        (sum, s) => sum + s.percentage,
        0
      );
      const excess = 100 - fixedTotal;
      for (const s of bloodRelatives) {
        s.percentage += (s.percentage / bloodTotal) * excess;
      }
      // Compute amounts
      for (const s of shares) {
        if (!s.blocked) {
          s.amount = (s.percentage / 100) * netEstate;
        }
      }
      return { shares, method: "radd" };
    }
  }

  // Standard: compute amounts
  for (const s of shares) {
    if (!s.blocked) {
      s.amount = (s.percentage / 100) * netEstate;
    }
  }

  return { shares, method: "standard" };
}

// ---------------------------------------------------------------------------
// Public API: calculate Faraid distribution
// ---------------------------------------------------------------------------

export async function calculateFaraid(input: {
  tenantId: string;
  matterId: string;
  deceasedPersonId: string;
  netEstate: number;
  currency: string;
  heirs: FaraidHeirInput[];
}): Promise<FaraidCalculationResult> {
  const blockedHeirs = getBlockedHeirs(input.heirs);
  const initialShares = computeFixedShares(input.heirs, blockedHeirs);
  const { shares, method } = distributeResiduary(
    initialShares,
    input.netEstate
  );

  const totalAllocated = shares
    .filter((s) => !s.blocked)
    .reduce((sum, s) => sum + s.amount, 0);
  const totalPercentage = shares
    .filter((s) => !s.blocked)
    .reduce((sum, s) => sum + s.percentage, 0);

  // Persist to database
  const record = await prisma.faraidCalculation.create({
    data: {
      tenantId: input.tenantId,
      matterId: input.matterId,
      deceasedPersonId: input.deceasedPersonId,
      netEstate: input.netEstate,
      currency: input.currency,
      method,
      heirs: encode(shares),
      totalAllocated,
    },
  });

  // Audit trail
  await audit({
    tenantId: input.tenantId,
    matterId: input.matterId,
    actorRole: "system",
    eventType: "faraid_calculated",
    entityType: "FaraidCalculation",
    entityId: record.id,
    metadata: { method, heirCount: shares.length, totalAllocated },
  });

  return {
    id: record.id,
    matterId: input.matterId,
    deceasedPersonId: input.deceasedPersonId,
    netEstate: input.netEstate,
    currency: input.currency,
    method,
    heirs: shares,
    totalAllocated,
    totalPercentage,
  };
}

// ---------------------------------------------------------------------------
// Compare Faraid shares with statutory intestacy law
// ---------------------------------------------------------------------------

export async function compareWithStatutory(
  faraidResult: FaraidCalculationResult,
  jurisdictionCode: string
): Promise<StatutoryComparisonResult[]> {
  // Simplified statutory intestacy shares for African jurisdictions
  const statutoryRules: Record<string, Record<string, number>> = {
    NG: {
      husband: 0,
      wife: 33.33,
      son: 0,
      daughter: 0,
      father: 0,
      mother: 0,
    },
    KE: {
      husband: 0,
      wife: 33.33,
      son: 0,
      daughter: 0,
      father: 0,
      mother: 0,
    },
    GH: {
      husband: 0,
      wife: 25,
      son: 0,
      daughter: 0,
      father: 0,
      mother: 0,
    },
  };

  const rules = statutoryRules[jurisdictionCode] ?? statutoryRules.NG;
  const netEstate = faraidResult.netEstate;

  // Calculate children's equal share under statutory law
  const activeHeirs = faraidResult.heirs.filter((h) => !h.blocked);
  const childTypes = ["son", "daughter", "grandson", "granddaughter"];
  const childHeirs = activeHeirs.filter((h) =>
    childTypes.includes(h.heirType)
  );
  const spouseHeirs = activeHeirs.filter(
    (h) => h.heirType === "husband" || h.heirType === "wife"
  );
  const spousePercent =
    spouseHeirs.length > 0
      ? rules[spouseHeirs[0].heirType] || 33.33
      : 0;
  const remainingPercent = 100 - spousePercent;
  const childShare =
    childHeirs.length > 0 ? remainingPercent / childHeirs.length : 0;

  return activeHeirs.map((heir) => {
    let statutoryPercent = 0;
    if (heir.heirType === "husband" || heir.heirType === "wife") {
      statutoryPercent = spousePercent;
    } else if (childTypes.includes(heir.heirType)) {
      statutoryPercent = childShare;
    }

    const statutoryShare = (statutoryPercent / 100) * netEstate;

    return {
      heirType: heir.heirType,
      name: heir.name,
      faraidShare: heir.amount,
      faraidPercent: heir.percentage,
      statutoryShare,
      statutoryPercent,
      difference: heir.amount - statutoryShare,
    };
  });
}

// ---------------------------------------------------------------------------
// List / get persisted calculations
// ---------------------------------------------------------------------------

export async function listFaraidCalculations(
  matterId: string,
  tenantId: string
) {
  return prisma.faraidCalculation.findMany({
    where: { matterId, tenantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFaraidCalculation(id: string, tenantId: string) {
  return prisma.faraidCalculation.findFirst({
    where: { id, tenantId },
  });
}
