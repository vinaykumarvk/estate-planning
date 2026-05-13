import { execFileSync } from "node:child_process";

// Use Prisma db push for PostgreSQL (works for both dev and production)
const result = execFileSync("npx", ["prisma", "db", "push", "--accept-data-loss"], {
  encoding: "utf8",
  stdio: "inherit"
});

process.stdout.write("Schema pushed to PostgreSQL\n");
