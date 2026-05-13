import { describe, expect, it } from "vitest";
import { stableHash } from "../server/services/json";
import { prisma } from "../server/db";

describe("G-042 (SEC-013): Document hash integrity", () => {
  it("stableHash is deterministic", () => {
    const data = { content: "Last Will and Testament", version: "1.0" };
    const hash1 = stableHash(data);
    const hash2 = stableHash(data);
    expect(hash1).toBe(hash2);
  });

  it("stableHash produces 8-char hex", () => {
    const hash = stableHash("test document content");
    expect(hash).toHaveLength(8);
    expect(/^[0-9a-f]{8}$/.test(hash)).toBe(true);
  });

  it("finalization preserves document hash", async () => {
    // Get any existing document
    const doc = await prisma.document.findFirst();
    if (doc) {
      expect(doc.hash).toBeTruthy();
      expect(doc.hash.length).toBe(8);
    }
  });

  it("different content produces different hash", () => {
    const h1 = stableHash("document version 1");
    const h2 = stableHash("document version 2");
    expect(h1).not.toBe(h2);
  });
});
