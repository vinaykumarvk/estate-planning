import { prisma } from "../db";
import type { ScenarioDiff } from "../../shared/types";
import { audit } from "./auditService";

export async function compareScenarios(matterId: string, scenarioIdA: string, scenarioIdB: string): Promise<ScenarioDiff> {
  const [scenarioA, scenarioB, dispositionsA, dispositionsB] = await Promise.all([
    prisma.scenario.findUniqueOrThrow({ where: { id: scenarioIdA } }),
    prisma.scenario.findUniqueOrThrow({ where: { id: scenarioIdB } }),
    prisma.disposition.findMany({ where: { matterId, scenarioId: scenarioIdA }, orderBy: { createdAt: "asc" } }),
    prisma.disposition.findMany({ where: { matterId, scenarioId: scenarioIdB }, orderBy: { createdAt: "asc" } })
  ]);

  const differences: ScenarioDiff["differences"] = [];

  // Compare disposition counts
  if (dispositionsA.length !== dispositionsB.length) {
    differences.push({
      field: "dispositionCount",
      scenarioAValue: dispositionsA.length,
      scenarioBValue: dispositionsB.length
    });
  }

  // Compare beneficiary labels
  const labelsA = dispositionsA.map((d) => d.beneficiaryLabel).sort();
  const labelsB = dispositionsB.map((d) => d.beneficiaryLabel).sort();
  const allLabels = [...new Set([...labelsA, ...labelsB])];
  for (const label of allLabels) {
    const dA = dispositionsA.find((d) => d.beneficiaryLabel === label);
    const dB = dispositionsB.find((d) => d.beneficiaryLabel === label);
    if (!dA || !dB) {
      differences.push({
        field: `beneficiary:${label}`,
        scenarioAValue: dA ? dA.giftType : "absent",
        scenarioBValue: dB ? dB.giftType : "absent"
      });
    } else {
      if (dA.percentage !== dB.percentage) {
        differences.push({ field: `${label}:percentage`, scenarioAValue: dA.percentage, scenarioBValue: dB.percentage });
      }
      if (dA.giftType !== dB.giftType) {
        differences.push({ field: `${label}:giftType`, scenarioAValue: dA.giftType, scenarioBValue: dB.giftType });
      }
      if (dA.amount !== dB.amount) {
        differences.push({ field: `${label}:amount`, scenarioAValue: dA.amount, scenarioBValue: dB.amount });
      }
    }
  }

  // Compare scenario-level fields
  if (scenarioA.comparisonBase !== scenarioB.comparisonBase) {
    differences.push({ field: "comparisonBase", scenarioAValue: scenarioA.comparisonBase, scenarioBValue: scenarioB.comparisonBase });
  }

  const matter = await prisma.matter.findUniqueOrThrow({ where: { id: matterId } });
  await audit({
    tenantId: matter.tenantId,
    matterId,
    actorRole: "system",
    eventType: "scenarios.compared",
    entityType: "Scenario",
    metadata: { scenarioIdA, scenarioIdB, differenceCount: differences.length, requirementRefs: ["FR-021"] }
  });

  return {
    matterId,
    scenarioA: { id: scenarioA.id, name: scenarioA.name },
    scenarioB: { id: scenarioB.id, name: scenarioB.name },
    differences
  };
}
