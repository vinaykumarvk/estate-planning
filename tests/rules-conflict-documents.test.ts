import { describe, expect, it } from "vitest";
import { generateConflictMemo, recordConflictReviewerRationale } from "../server/services/conflictOfLawsService";
import { approveReview, finalizeDocument, generateWillDraft } from "../server/services/documentAssemblyService";
import { evaluateMatterRules } from "../server/services/ruleEngine";
import { prisma } from "../server/db";

describe("middle-office rules, conflict memos, and documents", () => {
  it("evaluates traceable rule issues for a cross-border matter", async () => {
    const summary = await evaluateMatterRules("matter-demo-ew-pt", "scenario-demo-residue");
    expect(summary.reviewRequired).toBe(true);
    expect(summary.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["CROSS_BORDER_ASSETS", "MINOR_BENEFICIARY"]));
    expect(summary.issues.every((issue) => issue.ruleCode && issue.sourceCode)).toBe(true);
  });

  it("generates a conflict-of-laws memo and records reviewer rationale", async () => {
    const memo = await generateConflictMemo("matter-demo-ew-pt");
    expect(memo.riskAreas.length).toBeGreaterThan(0);
    expect(memo.reviewStatus).toBe("pending");

    const reviewed = await recordConflictReviewerRationale(memo.memoId, "user-solicitor", "Reviewed cross-border facts and confirmed professional advice path.");
    expect(reviewed.reviewStatus).toBe("approved");
    expect(reviewed.reviewerRationale).toContain("Reviewed cross-border");
  });

  it("generates a versioned will draft and blocks finalization until reviews are approved", async () => {
    const draft = await generateWillDraft("matter-demo-ew-pt", "en-GB");
    expect(draft.content).toContain("Template version");
    expect(draft.hash).toHaveLength(8);

    await expect(finalizeDocument(draft.documentId, "user-solicitor")).rejects.toThrow(/mandatory reviews/i);

    const pendingReviews = await prisma.review.findMany({
      where: { matterId: "matter-demo-ew-pt", status: { not: "approved" }, mandatory: true }
    });
    for (const review of pendingReviews) {
      await approveReview(review.id, "user-solicitor", "Approved for test finalization.");
    }

    const finalized = await finalizeDocument(draft.documentId, "user-solicitor");
    expect(finalized.status).toBe("finalized");
    expect(finalized.executionStatus).toBe("awaiting_execution");
  });
});
