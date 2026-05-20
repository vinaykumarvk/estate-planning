import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const connectionLimit = process.env.PRISMA_CONNECTION_LIMIT
  ? parseInt(process.env.PRISMA_CONNECTION_LIMIT, 10)
  : undefined;

function buildDatasourceUrl(): string | undefined {
  if (!connectionLimit) return undefined;
  const base = process.env.DATABASE_URL ?? "";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}connection_limit=${connectionLimit}`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.PRISMA_LOG === "query" ? ["query", "error", "warn"] : ["error", "warn"],
    ...(connectionLimit ? { datasourceUrl: buildDatasourceUrl() } : {})
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
