import { useState, useEffect, useCallback } from "react";
import { Target, Plus, Trash2, Link, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiMutation } from "../hooks/useApiMutation";
import { useApiQuery } from "../hooks/useApiQuery";
import { T } from "../primitives/T";
import { Modal } from "../primitives/Modal";
import { FormField } from "../primitives/FormField";
import { FormSelect } from "../primitives/FormSelect";
import { FormActions } from "../primitives/FormActions";
import { StatusBadge } from "../primitives/StatusBadge";
import { EmptyState } from "../primitives/EmptyState";
import { ConfirmDialog } from "../primitives/ConfirmDialog";

interface GoalRecord {
  id: string;
  goalText: string;
  category: string;
  priority: string;
  status: string;
  linkedScenarioIds: string[];
  notes: string | null;
}

interface GapAnalysis {
  totalGoals: number;
  addressedCount: number;
  unaddressedCount: number;
  completionPercent: number;
  gaps: Array<{ goalId: string; goalText: string; category: string; reason: string }>;
}

const CATEGORY_OPTIONS = [
  { value: "minimize_iht", labelKey: "goals.cat_minimize_iht" },
  { value: "protect_family_home", labelKey: "goals.cat_protect_family_home" },
  { value: "provide_for_dependants", labelKey: "goals.cat_provide_for_dependants" },
  { value: "cross_border_coordination", labelKey: "goals.cat_cross_border_coordination" },
  { value: "islamic_compliance", labelKey: "goals.cat_islamic_compliance" },
  { value: "business_succession", labelKey: "goals.cat_business_succession" },
  { value: "charitable_giving", labelKey: "goals.cat_charitable_giving" },
  { value: "asset_protection", labelKey: "goals.cat_asset_protection" },
  { value: "tax_efficiency", labelKey: "goals.cat_tax_efficiency" },
];

const PRIORITY_OPTIONS = [
  { value: "high", labelKey: "goals.priority_high" },
  { value: "medium", labelKey: "goals.priority_medium" },
  { value: "low", labelKey: "goals.priority_low" },
];

export function GoalsDashboard() {
  const { t } = useTranslation();
  const { matterId } = useMatterContext();
  const mutation = useApiMutation();
  const goalsQuery = useApiQuery<{ goals: GoalRecord[] }>(`/api/matters/${matterId}/goals`);
  const gapQuery = useApiQuery<{ analysis: GapAnalysis }>(`/api/matters/${matterId}/goals/gap-analysis`);

  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [goalText, setGoalText] = useState("");
  const [category, setCategory] = useState("minimize_iht");
  const [priority, setPriority] = useState("medium");
  const [notes, setNotes] = useState("");

  const goals = goalsQuery.data?.goals ?? [];
  const analysis = gapQuery.data?.analysis;

  function resetForm() {
    setGoalText("");
    setCategory("minimize_iht");
    setPriority("medium");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await mutation.mutate(`/api/matters/${matterId}/goals`, {
      goalText,
      category,
      priority,
      notes: notes || undefined,
      linkedScenarioIds: [],
    });
    setShowAdd(false);
    resetForm();
    goalsQuery.refetch();
    gapQuery.refetch();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await mutation.mutate(`/api/goals/${deleteId}`, undefined, "DELETE");
    setDeleteId(null);
    goalsQuery.refetch();
    gapQuery.refetch();
  }

  const priorityVariant = (p: string) => p === "high" ? "danger" : p === "medium" ? "warning" : "default";
  const statusVariant = (s: string) => s === "addressed" ? "success" : s === "partially_addressed" ? "warning" : "default";

  return (
    <div className="content-grid">
      <section className="panel span-2">
        <div className="panel-header">
          <h3><Target aria-hidden="true" size={16} /> <T k="goals.title" /></h3>
          <button type="button" onClick={() => setShowAdd(true)}>
            <Plus aria-hidden="true" size={14} /> <T k="goals.add_goal" />
          </button>
        </div>

        {analysis && (
          <>
            <div className="metric-grid">
              <div className="metric">
                <span><T k="goals.total_goals" /></span>
                <strong>{analysis.totalGoals}</strong>
              </div>
              <div className="metric">
                <span><T k="goals.addressed" /></span>
                <strong className="text-success">{analysis.addressedCount}</strong>
              </div>
              <div className="metric">
                <span><T k="goals.unaddressed" /></span>
                <strong className={analysis.unaddressedCount > 0 ? "text-danger" : ""}>{analysis.unaddressedCount}</strong>
              </div>
            </div>
            <div className="progress mt-2">
              <span style={{ width: `${analysis.completionPercent}%` }} />
            </div>
          </>
        )}

        {goals.length === 0 ? (
          <EmptyState messageKey="goals.empty" actionKey="goals.add_goal" onAction={() => setShowAdd(true)} />
        ) : (
          <ul className="compact-list mt-2">
            {goals.map((goal) => (
              <li key={goal.id}>
                <span>{goal.goalText}</span>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <StatusBadge status={t(`goals.cat_${goal.category}`)} variant="default" />
                  <StatusBadge status={goal.priority} variant={priorityVariant(goal.priority)} />
                  <StatusBadge status={goal.status} variant={statusVariant(goal.status)} />
                </div>
                <em>
                  {goal.linkedScenarioIds.length > 0
                    ? `${goal.linkedScenarioIds.length} scenario${goal.linkedScenarioIds.length > 1 ? "s" : ""} linked`
                    : t("goals.linked_scenarios") + ": 0"
                  }
                </em>
                {goal.notes && <em>{goal.notes}</em>}
                <div className="list-item-actions">
                  <button type="button" className="icon-button icon-button--danger" onClick={() => setDeleteId(goal.id)} aria-label={t("common.delete")}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {analysis && analysis.gaps.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <h3><AlertTriangle aria-hidden="true" size={16} /> <T k="goals.gap_analysis" /></h3>
            <StatusBadge status={`${analysis.gaps.length} gaps`} variant="warning" />
          </div>
          <ul className="issue-list">
            {analysis.gaps.map((gap) => (
              <li key={gap.goalId} className="warning">
                <span>{gap.goalText}</span>
                <strong>{t(`goals.cat_${gap.category}`)}</strong>
                <em>{gap.reason}</em>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal open={showAdd} titleKey="goals.add_goal" onClose={() => { setShowAdd(false); resetForm(); }}>
        <form onSubmit={handleSubmit}>
          <FormField name="goalText" labelKey="goals.goal_text" value={goalText} onChange={setGoalText} required />
          <FormSelect name="category" labelKey="goals.category" value={category} options={CATEGORY_OPTIONS} onChange={setCategory} />
          <FormSelect name="priority" labelKey="goals.priority" value={priority} options={PRIORITY_OPTIONS} onChange={setPriority} />
          <FormField name="notes" labelKey="goals.notes" value={notes} onChange={setNotes} />
          {mutation.error && <div className="form-field__error" role="alert">{mutation.error}</div>}
          <FormActions onCancel={() => { setShowAdd(false); resetForm(); }} loading={mutation.loading} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        titleKey="goals.delete_title"
        messageKey="goals.delete_confirm"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
