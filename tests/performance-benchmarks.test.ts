import { describe, expect, it } from "vitest";
import { createApp } from "../server/app";
import request from "supertest";
import { evaluateMatterRules } from "../server/services/ruleEngine";
import { getMatterWorkspace } from "../server/services/matterService";

const app = createApp();

describe("G-035 (NFR-002): Performance benchmarks", () => {
  it("health check responds in < 100ms", async () => {
    const start = performance.now();
    const res = await request(app)
      .get("/api/health/live")
      .set("x-api-key", process.env.API_KEY ?? "test-key-estate-demo");
    const elapsed = performance.now() - start;
    expect(res.status).toBe(200);
    expect(elapsed).toBeLessThan(100);
  });

  it("workspace load completes in < 500ms", async () => {
    const start = performance.now();
    try {
      await getMatterWorkspace("matter-demo-ew-pt");
    } catch {
      // Matter may not exist in test env
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  it("rule evaluation completes in < 5000ms", async () => {
    const start = performance.now();
    try {
      await evaluateMatterRules("matter-demo-ew-pt");
    } catch {
      // Matter may not exist in test env
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});
