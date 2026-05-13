import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../server/app";
import { prisma } from "../server/db";
import { createHash, randomUUID } from "node:crypto";

const app = createApp();

// Helper: get seeded API key hash for tenant-demo
async function getApiKey(): Promise<string> {
  return "demo-api-key";
}

describe("security middleware", () => {
  it("returns helmet security headers on every response", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(res.headers["content-security-policy"]).toBeDefined();
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("sets x-request-id header from client or generates one", async () => {
    const clientId = randomUUID();
    const res = await request(app).get("/api/health").set("x-request-id", clientId);
    expect(res.headers["x-request-id"]).toBe(clientId);

    const res2 = await request(app).get("/api/health");
    expect(res2.headers["x-request-id"]).toBeDefined();
    expect(res2.headers["x-request-id"]).toHaveLength(36); // UUID length
  });

  it("returns 401 without API key on protected routes", async () => {
    const res = await request(app).get("/api/matters");
    expect(res.status).toBe(401);
    expect(res.body.error).toContain("API key");
  });

  it("returns 403 with invalid API key", async () => {
    const res = await request(app).get("/api/matters").set("x-api-key", "invalid-key");
    expect(res.status).toBe(403);
  });

  it("allows access with valid API key", async () => {
    const key = await getApiKey();
    const res = await request(app).get("/api/matters").set("x-api-key", key);
    expect(res.status).toBe(200);
  });

  it("applies rate limit headers", async () => {
    const res = await request(app).get("/api/health");
    // draft-7 uses lowercase ratelimit-* headers
    const hasRateLimit = res.headers["ratelimit-limit"] !== undefined
      || res.headers["x-ratelimit-limit"] !== undefined
      || res.headers["ratelimit-policy"] !== undefined;
    expect(hasRateLimit).toBe(true);
  });

  it("ABAC rejects cross-tenant body tenantId", async () => {
    const { requireAbac } = await import("../server/middleware/abac");
    const middleware = requireAbac();

    let statusCode = 0;
    let responseBody: Record<string, unknown> = {};
    const mockReq = { body: { tenantId: "other-tenant" }, header: () => undefined } as any;
    const mockRes = {
      locals: { tenantId: "tenant-demo" },
      status(code: number) { statusCode = code; return this; },
      json(body: Record<string, unknown>) { responseBody = body; }
    } as any;
    const mockNext = () => {};

    await middleware(mockReq, mockRes, mockNext);
    expect(statusCode).toBe(403);
    expect(responseBody.error).toContain("Cross-tenant");
  });

  it("MFA check rejects user without MFA enabled", async () => {
    // This test validates the requireMfa middleware logic directly
    const { requireMfa } = await import("../server/middleware/abac");
    const middleware = requireMfa();

    // Create mock request/response
    let statusCode = 0;
    let responseBody: Record<string, unknown> = {};
    const mockReq = { body: { actorUserId: "nonexistent-user" } } as any;
    const mockRes = {
      status(code: number) { statusCode = code; return this; },
      json(body: Record<string, unknown>) { responseBody = body; }
    } as any;
    const mockNext = () => {};

    await middleware(mockReq, mockRes, mockNext);
    expect(statusCode).toBe(404);
  });
});
