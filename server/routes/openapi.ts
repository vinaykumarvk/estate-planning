import { Router } from "express";
import { asyncHandler } from "./asyncHandler";

export const openapiRouter = Router();

const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Estate Planning Platform API",
    version: "1.0.0",
    description: "API for the Estate Planning Platform covering planning, administration, and configuration workflows."
  },
  servers: [{ url: "/api", description: "Default API server" }],
  paths: {
    "/health": { get: { summary: "Health check", operationId: "healthCheck", responses: { "200": { description: "OK" } } } },
    "/health/live": { get: { summary: "Liveness probe", operationId: "liveProbe", responses: { "200": { description: "OK" } } } },
    "/health/ready": { get: { summary: "Readiness probe", operationId: "readyProbe", responses: { "200": { description: "Ready" }, "503": { description: "Not ready" } } } },
    "/matters": {
      get: { summary: "List matters", operationId: "listMatters", responses: { "200": { description: "OK" } } },
      post: { summary: "Create matter", operationId: "createMatter", responses: { "201": { description: "Created" } } }
    },
    "/matters/{matterId}": {
      get: { summary: "Get matter workspace", operationId: "getMatterWorkspace", parameters: [{ name: "matterId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } }
    },
    "/planning/matters/{matterId}/rules/evaluate": {
      post: { summary: "Evaluate rules", operationId: "evaluateRules", responses: { "200": { description: "OK" } } }
    },
    "/planning/matters/{matterId}/documents/will": {
      post: { summary: "Generate will draft", operationId: "generateWill", responses: { "201": { description: "Created" } } }
    },
    "/planning/matters/{matterId}/conflict-of-laws": {
      post: { summary: "Generate conflict memo", operationId: "generateConflictMemo", responses: { "201": { description: "Created" } } }
    },
    "/planning/matters/{matterId}/hague-validity": {
      post: { summary: "Evaluate Hague 1961 formal validity", operationId: "evaluateHague", responses: { "200": { description: "OK" } } }
    },
    "/planning/matters/{matterId}/eu650-evaluation": {
      post: { summary: "Evaluate EU 650/2012", operationId: "evaluateEU650", responses: { "200": { description: "OK" } } }
    },
    "/admin/tenants": { get: { summary: "List tenants", operationId: "listTenants", responses: { "200": { description: "OK" } } } },
    "/admin/packs": { get: { summary: "List packs", operationId: "listPacks", responses: { "200": { description: "OK" } } } },
    "/admin/dsr": {
      post: { summary: "Create DSR", operationId: "createDsr", responses: { "201": { description: "Created" } } },
      get: { summary: "List DSRs", operationId: "listDsrs", responses: { "200": { description: "OK" } } }
    }
  },
  components: {
    securitySchemes: {
      apiKey: { type: "apiKey", in: "header", name: "x-api-key" }
    }
  },
  security: [{ apiKey: [] }]
};

openapiRouter.get(
  "/openapi.json",
  asyncHandler(async (_request, response) => {
    response.json(OPENAPI_SPEC);
  })
);
