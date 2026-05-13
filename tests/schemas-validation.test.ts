import { describe, expect, it } from "vitest";
import {
  createLiabilitySchema,
  createTaskSchema,
  createInvitationSchema,
  createMessageSchema,
  createNotificationSchema,
  createReviewCommentSchema,
  createRelationshipSchema,
  paginationSchema
} from "../shared/schemas";

describe("Zod schema validation", () => {
  it("validates createLiabilitySchema with valid input", () => {
    const result = createLiabilitySchema.safeParse({
      tenantId: "t1",
      matterId: "m1",
      liabilityType: "mortgage",
      description: "Home mortgage",
      currency: "GBP",
      amount: 250000
    });
    expect(result.success).toBe(true);
  });

  it("rejects createLiabilitySchema with invalid currency length", () => {
    const result = createLiabilitySchema.safeParse({
      tenantId: "t1",
      matterId: "m1",
      liabilityType: "mortgage",
      description: "Home mortgage",
      currency: "GBPP",
      amount: 250000
    });
    expect(result.success).toBe(false);
  });

  it("validates createTaskSchema with defaults", () => {
    const result = createTaskSchema.safeParse({
      tenantId: "t1",
      title: "Review assets",
      ownerRole: "solicitor"
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("pending");
    }
  });

  it("validates createInvitationSchema with email", () => {
    const result = createInvitationSchema.safeParse({
      tenantId: "t1",
      matterId: "m1",
      inviteeEmail: "test@example.com",
      role: "viewer",
      expiresAt: new Date().toISOString()
    });
    expect(result.success).toBe(true);
  });

  it("rejects createInvitationSchema with invalid email", () => {
    const result = createInvitationSchema.safeParse({
      tenantId: "t1",
      matterId: "m1",
      inviteeEmail: "not-an-email",
      role: "viewer",
      expiresAt: new Date().toISOString()
    });
    expect(result.success).toBe(false);
  });

  it("validates createMessageSchema", () => {
    const result = createMessageSchema.safeParse({
      tenantId: "t1",
      matterId: "m1",
      senderUserId: "u1",
      body: "Hello"
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe("en-GB");
      expect(result.data.sensitivity).toBe("confidential");
    }
  });

  it("validates paginationSchema with bounds", () => {
    const valid = paginationSchema.safeParse({ page: 1, pageSize: 50 });
    expect(valid.success).toBe(true);

    const tooLarge = paginationSchema.safeParse({ page: 1, pageSize: 200 });
    expect(tooLarge.success).toBe(false);

    const negative = paginationSchema.safeParse({ page: -1, pageSize: 10 });
    expect(negative.success).toBe(false);

    const defaults = paginationSchema.safeParse({});
    expect(defaults.success).toBe(true);
    if (defaults.success) {
      expect(defaults.data.page).toBe(1);
      expect(defaults.data.pageSize).toBe(20);
    }
  });

  it("validates createReviewCommentSchema", () => {
    const result = createReviewCommentSchema.safeParse({
      reviewId: "r1",
      authorUserId: "u1",
      commentType: "issue",
      body: "This needs clarification"
    });
    expect(result.success).toBe(true);
  });
});
