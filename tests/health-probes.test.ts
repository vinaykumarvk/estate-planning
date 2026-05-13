import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../server/app";

const app = createApp();

describe("health probes (NFR-001)", () => {
  it("returns liveness probe with status ok", async () => {
    const res = await request(app).get("/api/health/live");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("returns readiness probe with DB check", async () => {
    const res = await request(app).get("/api/health/ready");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ready");
    expect(res.body.tenants).toBeGreaterThan(0);
  });

  it("returns backward-compatible health endpoint", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.tenants).toBeDefined();
    expect(res.body.packs).toBeDefined();
    expect(res.body.brd).toBeDefined();
  });
});
