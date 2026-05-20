import { useState } from "react";
import { MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiQuery } from "../hooks/useApiQuery";
import { useApiMutation } from "../hooks/useApiMutation";
import { FormTextarea } from "../primitives/FormTextarea";
import { FormSelect } from "../primitives/FormSelect";
import { StatusBadge } from "../primitives/StatusBadge";

interface ReviewComment {
  id: string;
  commentType: string;
  body: string;
  authorUserId: string;
  createdAt: string;
}

export function ReviewInterface() {
  const { t } = useTranslation();
  const { workspace } = useMatterContext();
  const reviews = workspace?.reviews ?? [];
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(reviews[0]?.id ?? null);
  const { data, refetch } = useApiQuery<{ comments: ReviewComment[] }>(selectedReviewId ? `/api/planning/reviews/${selectedReviewId}/comments` : null);
  const mutation = useApiMutation();
  const [body, setBody] = useState("");
  const [commentType, setCommentType] = useState("general");

  async function handleAddComment() {
    if (!selectedReviewId || !body.trim()) return;
    await mutation.mutate(`/api/planning/reviews/${selectedReviewId}/comments`, {
      reviewId: selectedReviewId,
      authorUserId: "user-solicitor",
      commentType,
      body,
    });
    setBody("");
    refetch();
  }

  async function handleApprove() {
    if (!selectedReviewId) return;
    await mutation.mutate(`/api/planning/reviews/${selectedReviewId}/approve`, {
      actorUserId: "user-solicitor",
    });
  }

  return (
    <div className="panel">
      <h3>{t("review.title")}</h3>
      <div className="form-field">
        <label className="form-field__label" htmlFor="review-select">{t("review.select_review")}</label>
        <select id="review-select" className="form-field__select" value={selectedReviewId ?? ""} onChange={(e) => setSelectedReviewId(e.target.value)}>
          <option value="">{t("common.select")}</option>
          {reviews.map((r) => (
            <option key={r.id} value={r.id}>{r.reviewType} - {r.status}</option>
          ))}
        </select>
      </div>

      {selectedReviewId && (
        <>
          <div className="button-row" style={{ margin: "12px 0" }}>
            <button type="button" onClick={handleApprove} disabled={mutation.loading}>
              <CheckCircle aria-hidden="true" size={14} /> {t("review.approve")}
            </button>
          </div>

          <div className="comment-thread">
            {(data?.comments ?? []).map((c) => (
              <div key={c.id} className="comment">
                <div className="comment__header">
                  <strong>{c.authorUserId}</strong>
                  <StatusBadge status={c.commentType} />
                </div>
                <p>{c.body}</p>
              </div>
            ))}
          </div>

          <div className="form-stack" style={{ marginTop: 12 }}>
            <FormSelect name="commentType" labelKey="review.comment_type" value={commentType} options={[
              { value: "general", labelKey: "options.comment_general" },
              { value: "issue", labelKey: "options.comment_issue" },
              { value: "suggestion", labelKey: "options.comment_suggestion" },
              { value: "approval", labelKey: "options.comment_approval" },
            ]} onChange={setCommentType} />
            <FormTextarea name="body" labelKey="review.comment" value={body} onChange={setBody} />
            <button type="button" onClick={handleAddComment} disabled={!body.trim() || mutation.loading}>
              <MessageSquare aria-hidden="true" size={14} /> {t("review.add_comment")}
            </button>
          </div>
          {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
        </>
      )}
    </div>
  );
}
