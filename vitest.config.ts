import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
    testTimeout: 30000,
    fileParallelism: false,
    env: {
      WEBHOOK_HMAC_KEY: "test-hmac-key",
      PRISMA_CONNECTION_LIMIT: "5"
    }
  }
});
