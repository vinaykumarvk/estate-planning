import "dotenv/config";
import { createApp } from "./app";
import { prisma } from "./db";

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";
const server = app.listen(port, host, () => {
  process.stdout.write(`Estate planning API listening on http://${host}:${port}\n`);
});

function shutdown(signal: string) {
  process.stdout.write(`\n${signal} received – shutting down\n`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
