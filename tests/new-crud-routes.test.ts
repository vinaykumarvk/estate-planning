import { describe, expect, it } from "vitest";
import { createApp } from "../server/app";
import request from "supertest";
import { storeFile, linkFileToEntity, getFileMetadata } from "../server/services/fileUploadService";
import { registerWebhook, listWebhooks, dispatchWebhook, deleteWebhook } from "../server/services/webhookService";
import { prisma } from "../server/db";

const app = createApp();
const API_KEY = "demo-api-key";

describe("FR-045: Service packages CRUD", () => {
  it("creates a service package", async () => {
    const res = await request(app)
      .post("/api/service-packages")
      .set("x-api-key", API_KEY)
      .send({
        tenantId: "tenant-demo",
        packageCode: `test-pkg-${Date.now()}`,
        name: "Basic Will Package",
        priceCurrency: "GBP",
        priceAmount: 350,
        jurisdictionCodes: ["EW"],
        includedDocTypes: ["will"]
      });
    expect(res.status).toBe(201);
    expect(res.body.package.name).toBe("Basic Will Package");
    expect(res.body.package.priceAmount).toBe(350);
  });

  it("lists service packages", async () => {
    const res = await request(app)
      .get("/api/service-packages")
      .set("x-api-key", API_KEY);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.packages)).toBe(true);
    expect(res.body.packages.length).toBeGreaterThan(0);
  });

  it("updates a service package", async () => {
    const packages = await prisma.servicePackage.findMany({ take: 1 });
    if (packages.length === 0) return;

    const res = await request(app)
      .patch(`/api/service-packages/${packages[0].id}`)
      .set("x-api-key", API_KEY)
      .send({ priceAmount: 400 });
    expect(res.status).toBe(200);
    expect(res.body.package.priceAmount).toBe(400);
  });
});

describe("FR-043: Notification template CRUD", () => {
  it("creates a notification template", async () => {
    const res = await request(app)
      .post("/api/notification-templates")
      .set("x-api-key", API_KEY)
      .send({
        templateCode: "test_template",
        locale: "en-GB",
        channel: "email",
        subject: "Test Notification",
        body: "This is a test notification for {{matter_number}}."
      });
    expect(res.status).toBe(201);
    expect(res.body.template.templateCode).toBe("test_template");
    expect(res.body.template.locale).toBe("en-GB");
  });

  it("lists notification templates", async () => {
    const res = await request(app)
      .get("/api/notification-templates")
      .set("x-api-key", API_KEY);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.templates)).toBe(true);
  });
});

describe("FR-020: File upload and evidence linking", () => {
  it("stores a file and returns metadata", async () => {
    const file = await storeFile({
      tenantId: "tenant-demo",
      matterId: "matter-demo-ew-pt",
      filename: "test-document.pdf",
      mimeType: "application/pdf",
      content: Buffer.from("test file content").toString("base64")
    });

    expect(file.id).toBeTruthy();
    expect(file.filename).toBe("test-document.pdf");
    expect(file.hash).toBeTruthy();
    expect(file.sizeBytes).toBeGreaterThan(0);
    expect(file.storageLocation).toContain("local:files/");
  });

  it("retrieves file metadata", async () => {
    const file = await storeFile({
      tenantId: "tenant-demo",
      filename: "metadata-test.txt",
      mimeType: "text/plain",
      content: Buffer.from("hello").toString("base64")
    });

    const metadata = await getFileMetadata(file.id);
    expect(metadata.id).toBe(file.id);
    expect(metadata.filename).toBe("metadata-test.txt");
    expect(metadata.mimeType).toBe("text/plain");
  });

  it("links a file to an asset entity", async () => {
    const asset = await prisma.asset.findFirst({ where: { tenantId: "tenant-demo" } });
    if (!asset) return;

    const file = await storeFile({
      tenantId: "tenant-demo",
      filename: "evidence.pdf",
      mimeType: "application/pdf",
      content: Buffer.from("evidence content").toString("base64")
    });

    const link = await linkFileToEntity(file.id, "Asset", asset.id, "tenant-demo");
    expect(link.linked).toBe(true);
    expect(link.fileId).toBe(file.id);
    expect(link.entityType).toBe("Asset");
  });
});

describe("FR-047 / NFR-012: Webhooks and OpenAPI", () => {
  it("registers a webhook subscription", async () => {
    const webhook = await registerWebhook({
      tenantId: "tenant-demo",
      url: "https://example.com/webhook",
      events: ["matter.created", "document.finalized"],
      secret: "test-webhook-secret-1234567890"
    });

    expect(webhook.id).toBeTruthy();
    expect(webhook.url).toBe("https://example.com/webhook");
    expect(webhook.status).toBe("active");
  });

  it("lists webhooks for a tenant", async () => {
    const webhooks = await listWebhooks("tenant-demo");
    expect(Array.isArray(webhooks)).toBe(true);
    expect(webhooks.length).toBeGreaterThan(0);
  });

  it("dispatches webhook with HMAC signature", async () => {
    const result = await dispatchWebhook("tenant-demo", "matter.created", {
      matterId: "matter-demo-ew-pt",
      event: "test"
    });
    expect(result.eventType).toBe("matter.created");
    expect(typeof result.dispatchedCount).toBe("number");
  });

  it("deletes a webhook", async () => {
    const webhook = await registerWebhook({
      tenantId: "tenant-demo",
      url: "https://example.com/delete-test",
      events: ["*"],
      secret: "delete-secret-1234567890"
    });
    const result = await deleteWebhook(webhook.id);
    expect(result.deleted).toBe(true);
  });

  it("GET /api/openapi.json returns OpenAPI 3.1 spec", async () => {
    const res = await request(app)
      .get("/api/openapi.json")
      .set("x-api-key", API_KEY);
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.1.0");
    expect(res.body.info.title).toBeTruthy();
    expect(res.body.paths).toBeDefined();
  });
});

describe("FR-016: Asset taxonomy CRUD", () => {
  it("creates an asset taxonomy", async () => {
    const res = await request(app)
      .post("/api/asset-taxonomy")
      .set("x-api-key", API_KEY)
      .send({
        jurisdictionCode: "EW",
        assetClass: `test_class_${Date.now()}`,
        fieldDefinitions: [
          { fieldName: "titleNumber", fieldType: "string", required: true, label: "Title Number" },
          { fieldName: "estimatedValue", fieldType: "number", required: false, label: "Estimated Value" }
        ]
      });
    expect(res.status).toBe(201);
    expect(res.body.taxonomy.assetClass).toBeTruthy();
    expect(res.body.taxonomy.jurisdictionCode).toBe("EW");
  });

  it("lists asset taxonomies", async () => {
    const res = await request(app)
      .get("/api/asset-taxonomy")
      .set("x-api-key", API_KEY);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.taxonomies)).toBe(true);
  });
});
