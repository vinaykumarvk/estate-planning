import { AlertTriangle, ClipboardCheck, Plus, RefreshCw, ShieldCheck, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiMutation } from "../hooks/useApiMutation";
import { useApiQuery } from "../hooks/useApiQuery";
import { Modal } from "../primitives/Modal";
import { FormActions } from "../primitives/FormActions";
import { FormCurrencyInput } from "../primitives/FormCurrencyInput";
import { FormField } from "../primitives/FormField";
import { FormSelect } from "../primitives/FormSelect";
import { StatusBadge } from "../primitives/StatusBadge";

interface EstateRequirementFit {
  code: string;
  area: string;
  requirement: string;
  status: "met" | "partial" | "gap" | "not_applicable";
  severity: "info" | "warning" | "blocker";
  evidence: string[];
  gap: string | null;
  recommendedAction: string | null;
}

interface EstatePlanningRecord {
  id: string;
  recordType: string;
  title: string;
  reviewStatus: string;
  evidenceRefs: string[];
  payload: Record<string, unknown>;
}

interface EstatePlanningReviewPayload {
  review: {
    fitmentPercent: number;
    metRequirementCount: number;
    partialRequirementCount: number;
    gapRequirementCount: number;
    blockerCount: number;
    summaries: {
      cashFlow: {
        annualIncome: number;
        annualExpenses: number;
        annualSurplus: number;
        normalExpenditureGiftTotal: number;
        evidenceGaps: string[];
      };
      liquidity: {
        liquidAssets: number;
        latestIhtDue: number;
        availableProtectionCover: number;
        fundingGap: number;
        liquidAssetCoveragePct: number;
      };
      protection: {
        totalCover: number;
        coverOutsideEstate: number;
        policiesMissingTrust: number;
        protectionGap: number;
      };
      crossBorderTax: {
        countries: string[];
        unresolvedPairs: string[];
      };
    };
    requirements: EstateRequirementFit[];
    records: EstatePlanningRecord[];
  };
}

interface GoalGapAnalysis {
  totalGoals: number;
  addressedCount: number;
  unaddressedCount: number;
  completionPercent: number;
  gaps: Array<{ goalId: string; goalText: string; category: string; reason: string }>;
}

const RECORD_TYPE_OPTIONS = [
  { value: "income_record", label: "Income record" },
  { value: "expense_record", label: "Expense record" },
  { value: "protection_policy", label: "Protection policy" },
  { value: "outside_estate_asset", label: "Outside-estate asset" },
  { value: "pension_nomination", label: "Pension nomination" },
  { value: "life_assurance_trust", label: "Life assurance trust" },
  { value: "trust_structure", label: "Trust structure" },
  { value: "deed_of_variation", label: "Deed of variation" },
  { value: "gift_received", label: "Gift received" },
  { value: "grob_assessment", label: "GROB assessment" },
  { value: "incapacity_instrument", label: "Incapacity instrument" },
  { value: "dta_position", label: "DTA position" },
  { value: "professional_referral", label: "Professional referral" },
];

const FREQUENCY_OPTIONS = [
  { value: "annual", label: "Annual" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "weekly", label: "Weekly" },
  { value: "one_off", label: "One off" },
];

const INSTRUMENT_OPTIONS = [
  { value: "", label: "Not applicable" },
  { value: "property_financial", label: "Property and financial affairs" },
  { value: "health_welfare", label: "Health and welfare" },
  { value: "advance_decision", label: "Advance decision" },
  { value: "enduring_power", label: "Enduring power" },
];

const REVIEW_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "accepted", label: "Accepted" },
  { value: "action_required", label: "Action required" },
];

export function EstatePlanningReview() {
  const { matterId, workspace } = useMatterContext();
  const reviewQuery = useApiQuery<EstatePlanningReviewPayload>(`/api/matters/${matterId}/estate-planning/review`);
  const goalQuery = useApiQuery<{ analysis: GoalGapAnalysis }>(`/api/matters/${matterId}/goals/gap-analysis`);
  const mutation = useApiMutation();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    recordType: "income_record",
    title: "",
    personId: "",
    reviewStatus: "pending",
    amount: 0,
    annualAmount: 0,
    currency: "GBP",
    frequency: "annual",
    countryA: "",
    countryB: "",
    instrumentType: "",
    trustType: "",
    taxTreatment: "",
    inTrust: false,
    outsideEstate: false,
    retainedBenefit: false,
    fullMarketRentPaid: false,
    evidenceRefs: "",
    notes: "",
    effectiveDate: "",
  });

  const review = reviewQuery.data?.review;
  const sortedRequirements = useMemo(() => {
    const order = { gap: 0, partial: 1, met: 2, not_applicable: 3 };
    return [...(review?.requirements ?? [])].sort((a, b) => order[a.status] - order[b.status]);
  }, [review?.requirements]);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm({
      recordType: "income_record",
      title: "",
      personId: "",
      reviewStatus: "pending",
      amount: 0,
      annualAmount: 0,
      currency: "GBP",
      frequency: "annual",
      countryA: "",
      countryB: "",
      instrumentType: "",
      trustType: "",
      taxTreatment: "",
      inTrust: false,
      outsideEstate: false,
      retainedBenefit: false,
      fullMarketRentPaid: false,
      evidenceRefs: "",
      notes: "",
      effectiveDate: "",
    });
  }

  async function submitRecord(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      amount: form.amount || undefined,
      annualAmount: form.annualAmount || undefined,
      currency: form.currency,
      frequency: form.frequency,
      countryA: form.countryA || undefined,
      countryB: form.countryB || undefined,
      instrumentType: form.instrumentType || undefined,
      trustType: form.trustType || undefined,
      taxTreatment: form.taxTreatment || undefined,
      inTrust: form.inTrust,
      outsideEstate: form.outsideEstate,
      retainedBenefit: form.retainedBenefit,
      fullMarketRentPaid: form.fullMarketRentPaid,
      notes: form.notes || undefined,
    };
    const result = await mutation.mutate(`/api/matters/${matterId}/estate-planning/records`, {
      recordType: form.recordType,
      title: form.title,
      personId: form.personId || undefined,
      reviewStatus: form.reviewStatus,
      payload,
      evidenceRefs: splitEvidence(form.evidenceRefs),
      effectiveDate: form.effectiveDate || undefined,
    });
    if (result) {
      setShowAdd(false);
      resetForm();
      reviewQuery.refetch();
    }
  }

  if (reviewQuery.loading) return <div className="loading-state">Loading estate planning review</div>;
  if (reviewQuery.error) return <div className="error-state" role="alert">{reviewQuery.error}</div>;
  if (!review) return <div className="empty-state">No estate planning review available</div>;

  return (
    <div className="content-grid">
      <section className="panel span-2">
        <div className="panel-header">
          <h3><ClipboardCheck aria-hidden="true" size={16} /> Core estate planning fitment</h3>
          <div className="button-row">
            <button type="button" onClick={reviewQuery.refetch}>
              <RefreshCw aria-hidden="true" size={14} /> Refresh
            </button>
            <button type="button" onClick={() => setShowAdd(true)}>
              <Plus aria-hidden="true" size={14} /> Add estate record
            </button>
          </div>
        </div>
        <div className="metric-grid">
          <div className="metric"><span>Fitment</span><strong>{review.fitmentPercent}%</strong></div>
          <div className="metric"><span>Met</span><strong className="text-success">{review.metRequirementCount}</strong></div>
          <div className="metric"><span>Partial</span><strong>{review.partialRequirementCount}</strong></div>
          <div className="metric"><span>Gaps</span><strong className={review.gapRequirementCount > 0 ? "text-danger" : "text-success"}>{review.gapRequirementCount}</strong></div>
        </div>
        <div className="progress mt-2">
          <span style={{ width: `${review.fitmentPercent}%` }} />
        </div>
      </section>

      {goalQuery.data?.analysis && (
        <section className="panel">
          <div className="panel-header">
            <h3><Target aria-hidden="true" size={16} /> Goal fulfilment</h3>
            <StatusBadge
              status={`${goalQuery.data.analysis.completionPercent}% complete`}
              variant={goalQuery.data.analysis.completionPercent === 100 ? "success" : goalQuery.data.analysis.completionPercent >= 50 ? "warning" : "danger"}
            />
          </div>
          <div className="metric-grid">
            <div className="metric"><span>Total goals</span><strong>{goalQuery.data.analysis.totalGoals}</strong></div>
            <div className="metric"><span>Addressed</span><strong className="text-success">{goalQuery.data.analysis.addressedCount}</strong></div>
            <div className="metric"><span>Unaddressed</span><strong className={goalQuery.data.analysis.unaddressedCount > 0 ? "text-danger" : ""}>{goalQuery.data.analysis.unaddressedCount}</strong></div>
          </div>
          <div className="progress mt-2">
            <span style={{ width: `${goalQuery.data.analysis.completionPercent}%` }} />
          </div>
          {goalQuery.data.analysis.gaps.length > 0 && (
            <ul className="issue-list mt-2">
              {goalQuery.data.analysis.gaps.map((gap) => (
                <li key={gap.goalId} className="warning">
                  <span>{gap.goalText}</span>
                  <em>{gap.reason}</em>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <h3><ShieldCheck aria-hidden="true" size={16} /> Funding summary</h3>
          <StatusBadge status={`${review.summaries.liquidity.liquidAssetCoveragePct}% covered`} variant={review.summaries.liquidity.fundingGap > 0 ? "warning" : "success"} />
        </div>
        <ul className="compact-list">
          <li><span>Liquid assets</span><strong>{formatMoney(review.summaries.liquidity.liquidAssets)}</strong></li>
          <li><span>Latest IHT due</span><strong>{formatMoney(review.summaries.liquidity.latestIhtDue)}</strong></li>
          <li><span>Protection outside estate</span><strong>{formatMoney(review.summaries.liquidity.availableProtectionCover)}</strong></li>
          <li><span>Funding gap</span><strong>{formatMoney(review.summaries.liquidity.fundingGap)}</strong></li>
        </ul>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Cash flow and gifts</h3>
          <StatusBadge status={review.summaries.cashFlow.evidenceGaps.length ? "Evidence gaps" : "Evidence ready"} variant={review.summaries.cashFlow.evidenceGaps.length ? "warning" : "success"} />
        </div>
        <ul className="compact-list">
          <li><span>Annual income</span><strong>{formatMoney(review.summaries.cashFlow.annualIncome)}</strong></li>
          <li><span>Annual expenses</span><strong>{formatMoney(review.summaries.cashFlow.annualExpenses)}</strong></li>
          <li><span>Annual surplus</span><strong>{formatMoney(review.summaries.cashFlow.annualSurplus)}</strong></li>
          <li><span>Normal-expenditure gifts</span><strong>{formatMoney(review.summaries.cashFlow.normalExpenditureGiftTotal)}</strong></li>
        </ul>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Protection and cross-border</h3>
          <StatusBadge status={`${review.summaries.crossBorderTax.countries.length} countries`} variant={review.summaries.crossBorderTax.unresolvedPairs.length ? "warning" : "success"} />
        </div>
        <ul className="compact-list">
          <li><span>Total cover</span><strong>{formatMoney(review.summaries.protection.totalCover)}</strong></li>
          <li><span>Cover outside estate</span><strong>{formatMoney(review.summaries.protection.coverOutsideEstate)}</strong></li>
          <li><span>Policies missing trust review</span><strong>{review.summaries.protection.policiesMissingTrust}</strong></li>
          <li><span>Unresolved DTA pairs</span><strong>{review.summaries.crossBorderTax.unresolvedPairs.length}</strong></li>
        </ul>
      </section>

      <section className="panel span-2">
        <div className="panel-header">
          <h3><AlertTriangle aria-hidden="true" size={16} /> Requirement gaps</h3>
          <StatusBadge status={`${review.blockerCount} blockers`} variant={review.blockerCount > 0 ? "danger" : "success"} />
        </div>
        <ul className="issue-list">
          {sortedRequirements.map((requirement) => (
            <li key={requirement.code} className={requirement.status === "gap" ? requirement.severity : requirement.status === "partial" ? "warning" : "info"}>
              <strong>{requirement.code}</strong>
              <span>{requirement.area}: {requirement.requirement}</span>
              <em>{requirement.status.replace("_", " ")}{requirement.gap ? ` - ${requirement.gap}` : ""}</em>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Estate evidence records</h3>
          <StatusBadge status={`${review.records.length} records`} />
        </div>
        <ul className="compact-list">
          {review.records.slice(0, 12).map((record) => (
            <li key={record.id}>
              <span>{record.title}</span>
              <strong>{record.recordType.replaceAll("_", " ")}</strong>
              <em>{record.reviewStatus} · {record.evidenceRefs.length} evidence refs</em>
            </li>
          ))}
        </ul>
      </section>

      <Modal open={showAdd} titleKey="Add estate planning record" onClose={() => { setShowAdd(false); resetForm(); }} wide>
        <form className="form-stack" onSubmit={submitRecord}>
          <div className="form-row">
            <FormSelect name="recordType" labelKey="Record type" value={form.recordType} options={RECORD_TYPE_OPTIONS} onChange={(value) => updateField("recordType", value)} />
            <FormSelect name="reviewStatus" labelKey="Review status" value={form.reviewStatus} options={REVIEW_STATUS_OPTIONS} onChange={(value) => updateField("reviewStatus", value)} />
          </div>
          <FormField name="title" labelKey="Title" value={form.title} required onChange={(value) => updateField("title", value)} />
          <div className="form-row">
            <FormSelect
              name="personId"
              labelKey="Person"
              value={form.personId}
              options={[{ value: "", label: "Matter level" }, ...(workspace?.people ?? []).map((person) => ({ value: person.id, label: person.legalName }))]}
              onChange={(value) => updateField("personId", value)}
            />
            <FormField name="effectiveDate" labelKey="Effective date" value={form.effectiveDate} type="date" onChange={(value) => updateField("effectiveDate", value)} />
          </div>
          <div className="form-row">
            <FormCurrencyInput name="amount" labelKey="Amount" value={form.amount} currency={form.currency} onChange={(value) => updateField("amount", value)} />
            <FormCurrencyInput name="annualAmount" labelKey="Annual amount" value={form.annualAmount} currency={form.currency} onChange={(value) => updateField("annualAmount", value)} />
          </div>
          <div className="form-row">
            <FormField name="currency" labelKey="Currency" value={form.currency} onChange={(value) => updateField("currency", value.toUpperCase())} />
            <FormSelect name="frequency" labelKey="Frequency" value={form.frequency} options={FREQUENCY_OPTIONS} onChange={(value) => updateField("frequency", value)} />
          </div>
          <div className="form-row">
            <FormField name="countryA" labelKey="Country A" value={form.countryA} onChange={(value) => updateField("countryA", value.toUpperCase())} />
            <FormField name="countryB" labelKey="Country B" value={form.countryB} onChange={(value) => updateField("countryB", value.toUpperCase())} />
          </div>
          <div className="form-row">
            <FormSelect name="instrumentType" labelKey="Instrument type" value={form.instrumentType} options={INSTRUMENT_OPTIONS} onChange={(value) => updateField("instrumentType", value)} />
            <FormField name="trustType" labelKey="Trust type" value={form.trustType} onChange={(value) => updateField("trustType", value)} />
          </div>
          <FormField name="taxTreatment" labelKey="Tax treatment" value={form.taxTreatment} onChange={(value) => updateField("taxTreatment", value)} />
          <fieldset className="form-field">
            <legend className="form-field__label">Flags</legend>
            <label className="form-field__checkbox-label"><input type="checkbox" checked={form.inTrust} onChange={(event) => updateField("inTrust", event.target.checked)} /> Held in trust</label>
            <label className="form-field__checkbox-label"><input type="checkbox" checked={form.outsideEstate} onChange={(event) => updateField("outsideEstate", event.target.checked)} /> Outside estate</label>
            <label className="form-field__checkbox-label"><input type="checkbox" checked={form.retainedBenefit} onChange={(event) => updateField("retainedBenefit", event.target.checked)} /> Retained benefit</label>
            <label className="form-field__checkbox-label"><input type="checkbox" checked={form.fullMarketRentPaid} onChange={(event) => updateField("fullMarketRentPaid", event.target.checked)} /> Full market rent paid</label>
          </fieldset>
          <FormField name="evidenceRefs" labelKey="Evidence refs" value={form.evidenceRefs} onChange={(value) => updateField("evidenceRefs", value)} />
          <FormField name="notes" labelKey="Notes" value={form.notes} onChange={(value) => updateField("notes", value)} />
          {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
          <FormActions onCancel={() => { setShowAdd(false); resetForm(); }} loading={mutation.loading} />
        </form>
      </Modal>
    </div>
  );
}

function splitEvidence(value: string): string[] {
  return value.split(",").map((part) => part.trim()).filter(Boolean);
}

function formatMoney(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
