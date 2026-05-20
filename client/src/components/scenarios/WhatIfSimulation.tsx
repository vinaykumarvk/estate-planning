import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiMutation } from "../hooks/useApiMutation";
import { FormField } from "../primitives/FormField";

export function WhatIfSimulation() {
  const { t } = useTranslation();
  const { matterId, workspace } = useMatterContext();
  const mutation = useApiMutation();
  const [scenarioId, setScenarioId] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const scenarios = workspace?.scenarios ?? [];

  async function handleSimulate() {
    if (!scenarioId) return;
    const res = await mutation.mutate(`/api/planning/matters/${matterId}/scenarios/${scenarioId}/simulate`, {});
    if (res) setResult(res as Record<string, unknown>);
  }

  return (
    <div className="panel">
      <h3>{t("scenarios.simulation_title")}</h3>
      <div className="form-stack">
        <div className="form-field">
          <label className="form-field__label" htmlFor="sim-scenario">{t("scenarios.select_scenario")}</label>
          <select id="sim-scenario" className="form-field__select" value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
            <option value="">{t("common.select")}</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <button type="button" onClick={handleSimulate} disabled={!scenarioId || mutation.loading}>
          {mutation.loading ? t("common.loading") : t("scenarios.run_simulation")}
        </button>
        {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
        {result && (
          <div className="simulation-result">
            <h4>{t("scenarios.simulation_result")}</h4>
            <pre className="compare-output">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
