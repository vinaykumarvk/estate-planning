/**
 * Post-build script: adds .js extensions to relative imports in compiled ESM output.
 * TypeScript with moduleResolution:"Bundler" omits extensions, but Node.js ESM requires them.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const files = execSync("find dist-server -name '*.js'", { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(Boolean);

let fixed = 0;
for (const file of files) {
  const original = readFileSync(file, "utf8");
  const updated = original.replace(
    /(?<=from\s+["'])(\.\.?\/[^"']+)(?=["'])/g,
    (match) => (match.endsWith(".js") ? match : match + ".js")
  );
  if (updated !== original) {
    writeFileSync(file, updated);
    fixed++;
  }
}

process.stdout.write(`Fixed ESM imports in ${fixed}/${files.length} files\n`);
