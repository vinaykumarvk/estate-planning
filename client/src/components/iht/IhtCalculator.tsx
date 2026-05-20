import { useState } from "react";
import { Calculator, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiMutation } from "../hooks/useApiMutation";
import { useApiQuery } from "../hooks/useApiQuery";
import { T } from "../primitives/T";
import { StatusBadge } from "../primitives/StatusBadge";
import { EmptyState } from "../primitives/EmptyState";
import { IhtWaterfallChart } from "../charts/IhtWaterfallChart";
import { ScenarioComparisonChart } from "../charts/ScenarioComparisonChart";

interface IhtThresholds {
  nrb: number;
  rnrb: number;
  rnrbTaperThreshold: number;
  standardRate: number;
  charitableRate: number;
  annualExemption: number;
  smallGiftLimit: number;
}

interface IhtCalcResult {
  id: string;
  personId: string;
  netEstate: number;
  nrb: number;
  nrbUsed: number;
  rnrb: number;
  rnrbTapering: number;
  transferableNrb: number;
  transferableRnrb: number;
  charitableRate: boolean;
  taxableEstate: number;
  ihtDue: number;
  taperRelief: number;
  exemptionsApplied: Record<string, number>;
  effectiveDate: string;
}

interface HouseholdResult {
  matterId: string;
  scenarioId: string;
  persons: IhtCalcResult[];
  combinedIht: number;
  secondDeathProjection: {
    survivorPersonId: string;
    projectedNetEstate: number;
    transferableNrbPercent: number;
    transferableRnrbPercent: number;
    projectedIht: number;
    totalFamilyIht: number;
  } | null;
}

interface ComparisonResult {
  scenarios: Array<{
    scenarioId: string;
    scenarioName: string;
    householdIht: number;
    secondDeathIht: number;
    totalFamilyIht: number;
  }>;
  bestScenarioId: string;
  maxSavings: number;
}

export function IhtCalculator() {
  const { t } = useTranslation();
  const { matterId, workspace } = useMatterContext();
  const mutation = useApiMutation();
  const thresholdsQuery = useApiQuery<{ thresholds: IhtThresholds }>(
    `/api/iht/matters/${matterId}/iht/thresholds`
  );
  const [householdResult, setHouseholdResult] = useState<HouseholdResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  const people = workspace?.people ?? [];
  const scenarios = workspace?.scenarios ?? [];
  const thresholds = thresholdsQuery.data?.thresholds;

  async function runHouseholdCalc() {
    if (!scenarios[0]) return;
    const result = await mutation.mutate(
      `/api/iht/matters/${matterId}/iht/household`,
      { scenarioId: scenarios[0].id, effectiveDate: new Date().toISOString() }
    );
    if (result) setHouseholdResult((result as { household: HouseholdResult }).household);
  }

  async function runComparison() {
    if (scenarios.length < 2) return;
    const result = await mutation.mutate(
      `/api/iht/matters/${matterId}/iht/compare`,
      { scenarioIds: scenarios.map((s) => s.id), effectiveDate: new Date().toISOString() }
    );
    if (result) setComparison((result as { comparison: ComparisonResult }).comparison);
  }

  const fmt = (n: number) => `\u00A3${n.toLocaleString()}`;

  return (
    <div className="content-grid">
      <section className="panel span-2">
        <div className="panel-header">
          <h3><Calculator aria-hidden="true" size={16} /> <T k="iht.title" /></h3>
          <div className="button-row">
            <button type="button" onClick={runHouseholdCalc} disabled={mutation.loading || !scenarios.length}>
              {mutation.loading ? t("common.loading") : t("iht.calculate_household")}
            </button>
            {scenarios.length >= 2 && (
              <button type="button" onClick={runComparison} disabled={mutation.loading}>
                <T k="iht.compare_scenarios" />
              </button>
            )}
          </div>
        </div>

        {thresholds && (
          <div className="metric-grid">
            <div className="metric"><span><T k="iht.nrb" /></span><strong>{fmt(thresholds.nrb)}</strong></div>
            <div className="metric"><span><T k="iht.rnrb" /></span><strong>{fmt(thresholds.rnrb)}</strong></div>
            <div className="metric"><span><T k="iht.standard_rate" /></span><strong>{(thresholds.standardRate * 100).toFixed(0)}%</strong></div>
            <div className="metric"><span><T k="iht.charitable_rate" /></span><strong>{(thresholds.charitableRate * 100).toFixed(0)}%</strong></div>
            <div className="metric"><span><T k="iht.annual_exemption" /></span><strong>{fmt(thresholds.annualExemption)}</strong></div>
            <div className="metric"><span><T k="iht.taper_threshold" /></span><strong>{fmt(thresholds.rnrbTaperThreshold)}</strong></div>
          </div>
        )}

        {mutation.error && <div className="form-field__error" role="alert">{mutation.error}</div>}
      </section>

      {householdResult && (
        <>
          {householdResult.persons.map((person) => {
            const p = people.find((pp) => pp.id === person.personId);
            return (
              <section className="panel" key={person.id}>
                <div className="panel-header">
                  <h3>{p?.legalName ?? person.personId}</h3>
                  <StatusBadge status={person.ihtDue > 0 ? "taxable" : "nil_band"} variant={person.ihtDue > 0 ? "warning" : "success"} />
                </div>
                <div className="metric-grid">
                  <div className="metric"><span><T k="iht.net_estate" /></span><strong>{fmt(person.netEstate)}</strong></div>
                  <div className="metric"><span><T k="iht.nrb_used" /></span><strong>{fmt(person.nrbUsed)}</strong></div>
                  <div className="metric"><span><T k="iht.rnrb" /></span><strong>{fmt(person.rnrb)}</strong></div>
                  <div className="metric"><span><T k="iht.taxable_estate" /></span><strong>{fmt(person.taxableEstate)}</strong></div>
                  <div className="metric"><span><T k="iht.taper_relief" /></span><strong>{fmt(person.taperRelief)}</strong></div>
                  <div className="metric"><span><T k="iht.iht_due" /></span><strong className={person.ihtDue > 0 ? "text-danger" : ""}>{fmt(person.ihtDue)}</strong></div>
                </div>
                <IhtWaterfallChart calculation={person} />
              </section>
            );
          })}

          <section className="panel">
            <div className="panel-header">
              <h3><T k="iht.household_summary" /></h3>
            </div>
            <div className="metric-grid">
              <div className="metric"><span><T k="iht.combined_iht" /></span><strong className="text-danger">{fmt(householdResult.combinedIht)}</strong></div>
            </div>
            {householdResult.secondDeathProjection && (
              <>
                <h4 className="mt-3"><TrendingDown aria-hidden="true" size={14} /> <T k="iht.second_death_projection" /></h4>
                <div className="metric-grid">
                  <div className="metric"><span><T k="iht.projected_estate" /></span><strong>{fmt(householdResult.secondDeathProjection.projectedNetEstate)}</strong></div>
                  <div className="metric"><span><T k="iht.transferable_nrb" /></span><strong>{householdResult.secondDeathProjection.transferableNrbPercent.toFixed(1)}%</strong></div>
                  <div className="metric"><span><T k="iht.projected_iht" /></span><strong className="text-danger">{fmt(householdResult.secondDeathProjection.projectedIht)}</strong></div>
                  <div className="metric"><span><T k="iht.total_family_iht" /></span><strong className="text-danger">{fmt(householdResult.secondDeathProjection.totalFamilyIht)}</strong></div>
                </div>
              </>
            )}
          </section>
        </>
      )}

      {!householdResult && !mutation.loading && (
        <section className="panel">
          <EmptyState messageKey="iht.empty" actionKey="iht.calculate_household" onAction={runHouseholdCalc} />
        </section>
      )}

      {comparison && (
        <section className="panel span-2">
          <div className="panel-header">
            <h3><T k="iht.scenario_comparison" /></h3>
            <strong className="text-success"><T k="iht.max_savings" />: {fmt(comparison.maxSavings)}</strong>
          </div>
          <ScenarioComparisonChart comparison={comparison} />
          <ul className="compact-list mt-2">
            {comparison.scenarios.map((s) => (
              <li key={s.scenarioId} className={s.scenarioId === comparison.bestScenarioId ? "highlight" : ""}>
                <span>{s.scenarioName}</span>
                <strong>{fmt(s.householdIht)}</strong>
                <em>{fmt(s.totalFamilyIht)}</em>
                {s.scenarioId === comparison.bestScenarioId && <StatusBadge status="best" variant="success" />}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
