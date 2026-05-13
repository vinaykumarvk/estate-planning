import {
  BACK_OFFICE_REQUIREMENTS,
  DEFERRED_REQUIREMENTS,
  FRONT_OFFICE_REQUIREMENTS,
  MIDDLE_OFFICE_REQUIREMENTS,
  TABLE_CATALOG
} from "../shared/constants";

const implemented = new Set([
  ...FRONT_OFFICE_REQUIREMENTS,
  ...MIDDLE_OFFICE_REQUIREMENTS,
  ...BACK_OFFICE_REQUIREMENTS,
  ...DEFERRED_REQUIREMENTS
]);

const requiredTables = ["Matter", "Document", "RuleEvaluation", "ConflictOfLawsMemo", "AiEvaluationRun", "UplOpinion", "PackVelocityRecord"];
const missingTables = requiredTables.filter((table) => !TABLE_CATALOG.includes(table as never));

if (missingTables.length > 0) {
  process.stderr.write(`Missing required tables: ${missingTables.join(", ")}\n`);
  process.exit(1);
}

if (implemented.size < 100) {
  process.stderr.write(`Requirement registry is too small: ${implemented.size}\n`);
  process.exit(1);
}

process.stdout.write(`Requirement registry OK: ${implemented.size} requirement IDs, ${TABLE_CATALOG.length} tables.\n`);
