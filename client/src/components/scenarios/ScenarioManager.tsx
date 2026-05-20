import { useState } from "react";
import { Plus, GitCompare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { createScenarioSchema } from "../../../../shared/schemas";
import { useMatterContext } from "../hooks/useMatterContext";
import { useFormState } from "../hooks/useFormState";
import { useApiMutation } from "../hooks/useApiMutation";
import { FormField } from "../primitives/FormField";
import { FormCheckbox } from "../primitives/FormCheckbox";
import { FormActions } from "../primitives/FormActions";
import { Modal } from "../primitives/Modal";
import { EmptyState } from "../primitives/EmptyState";
import { StatusBadge } from "../primitives/StatusBadge";
import { DispositionList } from "../dispositions/DispositionList";

export function ScenarioManager() {
  const { t } = useTranslation();
  const { matterId, workspace, refreshWorkspace } = useMatterContext();
  const form = useFormState(createScenarioSchema, {
    tenantId: "tenant-demo",
    matterId,
    name: "",
    comparisonBase: false as boolean,
  });
  const mutation = useApiMutation();
  const compareMutation = useApiMutation();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [compareResult, setCompareResult] = useState<Record<string, unknown> | null>(null);

  const scenarios = workspace?.scenarios ?? [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.validate()) return;
    const result = await mutation.mutate(`/api/matters/${matterId}/scenarios`, form.values);
    if (result) {
      form.reset();
      setShowCreate(false);
      refreshWorkspace();
    }
  }

  async function handleCompare() {
    const result = await compareMutation.mutate(`/api/planning/matters/${matterId}/scenarios/compare`, {
      scenarioIdA: scenarios[0]?.id,
      scenarioIdB: scenarios[1]?.id,
    });
    if (result) setCompareResult(result as Record<string, unknown>);
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>{t("scenarios.title")}</h3>
        <div className="button-row">
          {scenarios.length >= 2 && (
            <button type="button" onClick={handleCompare} disabled={compareMutation.loading}>
              <GitCompare aria-hidden="true" size={14} /> {t("scenarios.compare")}
            </button>
          )}
          <button type="button" onClick={() => setShowCreate(true)}>
            <Plus aria-hidden="true" size={14} /> {t("scenarios.create")}
          </button>
        </div>
      </div>

      {scenarios.length === 0 ? (
        <EmptyState messageKey="scenarios.empty" actionKey="scenarios.create" onAction={() => setShowCreate(true)} />
      ) : (
        <ul className="compact-list">
          {scenarios.map((s) => (
            <li key={s.id} className="scenario-item">
              <button type="button" className="scenario-item__toggle" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                <span>{s.name}</span>
                <StatusBadge status={s.status} />
              </button>
              {expandedId === s.id && <DispositionList scenarioId={s.id} />}
            </li>
          ))}
        </ul>
      )}

      {compareResult && (
        <div className="panel mt-3">
          <h4>{t("scenarios.comparison_result")}</h4>
          <pre className="compare-output">{JSON.stringify(compareResult, null, 2)}</pre>
        </div>
      )}

      <Modal open={showCreate} titleKey="scenarios.create" onClose={() => setShowCreate(false)}>
        <form onSubmit={handleCreate} className="form-stack">
          <FormField name="name" labelKey="scenarios.name" value={form.values.name} error={form.errors.name} required onChange={(v) => form.handleChange("name", v)} />
          <FormCheckbox name="comparisonBase" labelKey="scenarios.comparison_base" checked={form.values.comparisonBase ?? false} onChange={(v) => form.handleChange("comparisonBase", v)} />
          {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
          <FormActions onCancel={() => setShowCreate(false)} loading={mutation.loading} />
        </form>
      </Modal>
    </div>
  );
}
