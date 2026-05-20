import { useState, useCallback } from "react";
import { BookOpen, Plus, Trash2, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiMutation } from "../hooks/useApiMutation";
import { useApiQuery } from "../hooks/useApiQuery";
import { T } from "../primitives/T";
import { Modal } from "../primitives/Modal";
import { FormField } from "../primitives/FormField";
import { FormSelect } from "../primitives/FormSelect";
import { FormCurrencyInput } from "../primitives/FormCurrencyInput";
import { FormActions } from "../primitives/FormActions";
import { StatusBadge } from "../primitives/StatusBadge";
import { EmptyState } from "../primitives/EmptyState";
import { EstateCompositionChart } from "../charts/EstateCompositionChart";

interface FaraidHeirShare {
  heirType: string;
  name: string;
  personId?: string;
  quranicFraction: string;
  percentage: number;
  amount: number;
  blocked: boolean;
  blockReason?: string;
}

interface FaraidResult {
  id: string;
  method: string;
  netEstate: number;
  currency: string;
  heirs: FaraidHeirShare[];
  totalAllocated: number;
  totalPercentage: number;
}

interface StatutoryComparison {
  heirType: string;
  name: string;
  faraidShare: number;
  faraidPercent: number;
  statutoryShare: number;
  statutoryPercent: number;
  difference: number;
}

const HEIR_TYPES = [
  { value: "husband", labelKey: "faraid.heir_husband" },
  { value: "wife", labelKey: "faraid.heir_wife" },
  { value: "son", labelKey: "faraid.heir_son" },
  { value: "daughter", labelKey: "faraid.heir_daughter" },
  { value: "father", labelKey: "faraid.heir_father" },
  { value: "mother", labelKey: "faraid.heir_mother" },
  { value: "grandfather", labelKey: "faraid.heir_grandfather" },
  { value: "grandmother", labelKey: "faraid.heir_grandmother" },
  { value: "full_brother", labelKey: "faraid.heir_full_brother" },
  { value: "full_sister", labelKey: "faraid.heir_full_sister" },
  { value: "paternal_brother", labelKey: "faraid.heir_paternal_brother" },
  { value: "paternal_sister", labelKey: "faraid.heir_paternal_sister" },
  { value: "maternal_brother", labelKey: "faraid.heir_maternal_brother" },
  { value: "maternal_sister", labelKey: "faraid.heir_maternal_sister" },
  { value: "grandson", labelKey: "faraid.heir_grandson" },
  { value: "granddaughter", labelKey: "faraid.heir_granddaughter" },
  { value: "paternal_uncle", labelKey: "faraid.heir_paternal_uncle" },
];

interface HeirInput {
  heirType: string;
  name: string;
  personId?: string;
  count: number;
}

export function FaraidCalculator() {
  const { t } = useTranslation();
  const { matterId, workspace } = useMatterContext();
  const mutation = useApiMutation();
  const balanceQuery = useApiQuery<{ balanceSheet: { netWorth: number } }>(
    `/api/matters/${matterId}/balance-sheet`
  );

  const [heirs, setHeirs] = useState<HeirInput[]>([]);
  const [netEstate, setNetEstate] = useState(balanceQuery.data?.balanceSheet?.netWorth ?? 0);
  const [currency, setCurrency] = useState("GBP");
  const [result, setResult] = useState<FaraidResult | null>(null);
  const [comparison, setComparison] = useState<StatutoryComparison[] | null>(null);
  const [showAddHeir, setShowAddHeir] = useState(false);
  const [newHeirType, setNewHeirType] = useState("son");
  const [newHeirName, setNewHeirName] = useState("");
  const [newHeirCount, setNewHeirCount] = useState(1);

  const people = workspace?.people ?? [];

  const addHeir = useCallback(() => {
    setHeirs((prev) => [...prev, { heirType: newHeirType, name: newHeirName || t(`faraid.heir_${newHeirType}`), count: newHeirCount }]);
    setNewHeirName("");
    setNewHeirType("son");
    setNewHeirCount(1);
    setShowAddHeir(false);
  }, [newHeirType, newHeirName, newHeirCount, t]);

  const removeHeir = useCallback((index: number) => {
    setHeirs((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const autoDetect = useCallback(() => {
    if (!workspace) return;
    const relationships = (workspace as any).relationships ?? [];
    const detected: HeirInput[] = [];
    const testatorId = people[0]?.id;
    if (!testatorId) return;

    for (const rel of relationships) {
      if (rel.fromPersonId === testatorId || rel.toPersonId === testatorId) {
        const otherPersonId = rel.fromPersonId === testatorId ? rel.toPersonId : rel.fromPersonId;
        const other = people.find((p) => p.id === otherPersonId);
        if (!other) continue;

        const type = rel.relationshipType?.toLowerCase() ?? "";
        let heirType = "";
        if (type === "spouse" || type === "wife") heirType = "wife";
        else if (type === "husband") heirType = "husband";
        else if (type === "child" || type === "son") heirType = "son";
        else if (type === "daughter") heirType = "daughter";
        else if (type === "parent" || type === "father") heirType = "father";
        else if (type === "mother") heirType = "mother";
        else if (type === "sibling" || type === "brother") heirType = "full_brother";
        else if (type === "sister") heirType = "full_sister";

        if (heirType) {
          detected.push({ heirType, name: other.legalName, personId: other.id, count: 1 });
        }
      }
    }

    if (detected.length > 0) setHeirs(detected);
  }, [workspace, people]);

  async function handleCalculate() {
    if (heirs.length === 0) return;
    const calcResult = await mutation.mutate("/api/faraid/calculate", {
      matterId,
      deceasedPersonId: people[0]?.id ?? "deceased",
      netEstate: netEstate || balanceQuery.data?.balanceSheet?.netWorth || 1000000,
      currency,
      heirs,
    });
    if (calcResult) {
      setResult((calcResult as { calculation: FaraidResult }).calculation);
      setComparison(null);
    }
  }

  async function handleCompare() {
    if (!result) return;
    const compResult = await mutation.mutate(`/api/faraid/${result.id}/compare`, {
      jurisdictionCode: workspace?.matter?.primaryJurisdictionCode ?? "NG",
    });
    if (compResult) {
      setComparison((compResult as { comparison: StatutoryComparison[] }).comparison);
    }
  }

  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`;

  const pieData = result
    ? result.heirs
        .filter((h) => !h.blocked && h.amount > 0)
        .map((h) => ({
          assetClass: h.name,
          count: 1,
          totalValue: h.amount,
          currency,
        }))
    : [];

  return (
    <div className="content-grid">
      <section className="panel span-2">
        <div className="panel-header">
          <h3><BookOpen aria-hidden="true" size={16} /> <T k="faraid.title" /></h3>
          <div className="button-row">
            <button type="button" onClick={() => setShowAddHeir(true)}>
              <Plus aria-hidden="true" size={14} /> <T k="faraid.add_heir" />
            </button>
            <button type="button" onClick={autoDetect}>
              <Users aria-hidden="true" size={14} /> <T k="faraid.auto_detect" />
            </button>
          </div>
        </div>

        <div className="form-row">
          <FormCurrencyInput
            name="netEstate"
            labelKey="faraid.net_estate"
            value={netEstate || balanceQuery.data?.balanceSheet?.netWorth || 0}
            currency={currency}
            onChange={setNetEstate}
          />
          <FormSelect
            name="currency"
            labelKey="faraid.currency"
            value={currency}
            options={[
              { value: "GBP", label: "GBP (£)" },
              { value: "NGN", label: "NGN (₦)" },
              { value: "KES", label: "KES (KSh)" },
              { value: "ZAR", label: "ZAR (R)" },
              { value: "USD", label: "USD ($)" },
            ]}
            onChange={setCurrency}
          />
        </div>

        {heirs.length > 0 && (
          <ul className="compact-list mt-2">
            {heirs.map((heir, index) => (
              <li key={index}>
                <span>{heir.name}</span>
                <strong>{t(`faraid.heir_${heir.heirType}`)}</strong>
                {heir.count > 1 && <em>×{heir.count}</em>}
                <div className="list-item-actions">
                  <button type="button" className="icon-button icon-button--danger" onClick={() => removeHeir(index)} aria-label={t("faraid.remove_heir")}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="form-actions mt-2">
          <button type="button" onClick={handleCalculate} disabled={mutation.loading || heirs.length === 0}>
            {mutation.loading ? t("common.loading") : t("faraid.calculate")}
          </button>
        </div>

        {mutation.error && <div className="form-field__error mt-2" role="alert">{mutation.error}</div>}
      </section>

      {result && (
        <>
          <section className="panel">
            <div className="panel-header">
              <h3><T k="faraid.results" /></h3>
              <StatusBadge
                status={result.method}
                variant={result.method === "standard" ? "success" : result.method === "awl" ? "warning" : "default"}
              />
            </div>

            {pieData.length > 0 && (
              <EstateCompositionChart data={pieData} netWorth={result.totalAllocated} currency={currency} />
            )}

            <ul className="compact-list mt-2">
              {result.heirs.map((heir, index) => (
                <li key={index} className={heir.blocked ? "warning" : ""}>
                  <span>{heir.name}</span>
                  <strong>{heir.blocked ? t("common.no_data") : `${heir.percentage.toFixed(1)}%`}</strong>
                  <em>{heir.blocked ? heir.blockReason : `${fmt(heir.amount)} (${heir.quranicFraction})`}</em>
                  {heir.blocked && <StatusBadge status="blocked" variant="danger" />}
                </li>
              ))}
            </ul>

            <div className="metric-grid mt-2">
              <div className="metric">
                <span><T k="faraid.total_allocated" /></span>
                <strong>{fmt(result.totalAllocated)}</strong>
              </div>
              <div className="metric">
                <span><T k="faraid.method" /></span>
                <strong>{t(`faraid.method_${result.method}`)}</strong>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h3><T k="faraid.statutory_comparison" /></h3>
              <button type="button" onClick={handleCompare} disabled={mutation.loading}>
                <T k="iht.compare_scenarios" />
              </button>
            </div>

            {comparison ? (
              <ul className="compact-list">
                {comparison.map((item, index) => {
                  const diffClass = item.difference > 0 ? "text-success" : item.difference < 0 ? "text-danger" : "";
                  return (
                    <li key={index}>
                      <span>{item.name}</span>
                      <strong>{item.faraidPercent.toFixed(1)}% vs {item.statutoryPercent.toFixed(1)}%</strong>
                      <em className={diffClass}>
                        {item.difference > 0 ? "+" : ""}{fmt(item.difference)}
                      </em>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}><T k="faraid.conflict_advisory" /></p>
            )}
          </section>
        </>
      )}

      {!result && !mutation.loading && heirs.length === 0 && (
        <section className="panel">
          <EmptyState messageKey="faraid.empty" actionKey="faraid.add_heir" onAction={() => setShowAddHeir(true)} />
        </section>
      )}

      <Modal open={showAddHeir} titleKey="faraid.add_heir" onClose={() => setShowAddHeir(false)}>
        <form onSubmit={(e) => { e.preventDefault(); addHeir(); }}>
          <FormSelect
            name="heirType"
            labelKey="faraid.heir_type"
            value={newHeirType}
            options={HEIR_TYPES}
            onChange={setNewHeirType}
          />
          <FormField
            name="heirName"
            labelKey="faraid.heir_name"
            value={newHeirName}
            onChange={setNewHeirName}
          />
          {(newHeirType === "wife") && (
            <FormField
              name="count"
              labelKey="faraid.heir_type"
              value={String(newHeirCount)}
              onChange={(v) => setNewHeirCount(Math.max(1, parseInt(v) || 1))}
            />
          )}
          <FormActions onCancel={() => setShowAddHeir(false)} />
        </form>
      </Modal>
    </div>
  );
}
