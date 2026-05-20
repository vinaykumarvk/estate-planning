import { useState } from "react";
import { Gift, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiMutation } from "../hooks/useApiMutation";
import { useApiQuery } from "../hooks/useApiQuery";
import { T } from "../primitives/T";
import { Modal } from "../primitives/Modal";
import { FormField } from "../primitives/FormField";
import { FormSelect } from "../primitives/FormSelect";
import { FormDateInput } from "../primitives/FormDateInput";
import { FormCurrencyInput } from "../primitives/FormCurrencyInput";
import { FormActions } from "../primitives/FormActions";
import { StatusBadge } from "../primitives/StatusBadge";
import { EmptyState } from "../primitives/EmptyState";
import { ConfirmDialog } from "../primitives/ConfirmDialog";
import { formatDate } from "../../lib/format";
import { GiftTimelineChart } from "../charts/GiftTimelineChart";

interface GiftRecord {
  id: string;
  donorPersonId: string;
  recipientPersonId: string | null;
  giftDate: string;
  value: number;
  currency: string;
  assetType: string;
  relationship: string;
  exemptionClaimed: string;
  petOrClt: string;
  description: string;
}

interface TimelineGift extends GiftRecord {
  taperBand: string;
  yearsElapsed: number;
  taperReliefPercent: number;
  projectedFallOffDate: string;
  nrbImpact: number;
}

interface TimelineResult {
  gifts: TimelineGift[];
  cumulativeTotal: number;
  nrbRemaining: number;
}

const EXEMPTION_OPTIONS = [
  { value: "none", labelKey: "iht.exemption_none" },
  { value: "annual", labelKey: "iht.exemption_annual" },
  { value: "small_gift", labelKey: "iht.exemption_small_gift" },
  { value: "normal_expenditure", labelKey: "iht.exemption_normal_expenditure" },
  { value: "marriage", labelKey: "iht.exemption_marriage" },
  { value: "charity", labelKey: "iht.exemption_charity" },
  { value: "spouse", labelKey: "iht.exemption_spouse" },
];

const PET_CLT_OPTIONS = [
  { value: "pet", labelKey: "iht.pet" },
  { value: "clt", labelKey: "iht.clt" },
  { value: "exempt", labelKey: "iht.exempt" },
];

export function GiftRegister() {
  const { t } = useTranslation();
  const { matterId, workspace } = useMatterContext();
  const mutation = useApiMutation();
  const giftsQuery = useApiQuery<{ gifts: GiftRecord[] }>(`/api/matters/${matterId}/gifts`);
  const timelineQuery = useApiQuery<{ timeline: TimelineResult }>(
    `/api/matters/${matterId}/gifts/timeline?referenceDate=${new Date().toISOString()}`
  );

  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [giftDate, setGiftDate] = useState("");
  const [value, setValue] = useState(0);
  const [currency, setCurrency] = useState("GBP");
  const [assetType, setAssetType] = useState("cash");
  const [relationship, setRelationship] = useState("");
  const [exemption, setExemption] = useState("none");
  const [petOrClt, setPetOrClt] = useState("pet");
  const [description, setDescription] = useState("");
  const [donorId, setDonorId] = useState("");

  const gifts = giftsQuery.data?.gifts ?? [];
  const timeline = timelineQuery.data?.timeline;
  const people = workspace?.people ?? [];

  const fmt = (n: number) => `\u00A3${n.toLocaleString()}`;

  function resetForm() {
    setGiftDate("");
    setValue(0);
    setCurrency("GBP");
    setAssetType("cash");
    setRelationship("");
    setExemption("none");
    setPetOrClt("pet");
    setDescription("");
    setDonorId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await mutation.mutate(`/api/matters/${matterId}/gifts`, {
      tenantId: "tenant-demo",
      matterId,
      donorPersonId: donorId || people[0]?.id,
      giftDate,
      value,
      currency,
      assetType,
      relationship,
      exemptionClaimed: exemption,
      petOrClt,
      description,
    });
    setShowAdd(false);
    resetForm();
    giftsQuery.refetch();
    timelineQuery.refetch();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await mutation.mutate(`/api/matters/${matterId}/gifts/${deleteId}`, undefined, "DELETE");
    setDeleteId(null);
    giftsQuery.refetch();
    timelineQuery.refetch();
  }

  return (
    <div className="content-grid">
      <section className="panel span-2">
        <div className="panel-header">
          <h3><Gift aria-hidden="true" size={16} /> <T k="gifts.title" /></h3>
          <button type="button" onClick={() => setShowAdd(true)}><Plus aria-hidden="true" size={14} /> <T k="gifts.add_gift" /></button>
        </div>

        {gifts.length === 0 ? (
          <EmptyState messageKey="gifts.empty" actionKey="gifts.add_gift" onAction={() => setShowAdd(true)} />
        ) : (
          <ul className="compact-list">
            {gifts.map((gift) => {
              const donor = people.find((p) => p.id === gift.donorPersonId);
              return (
                <li key={gift.id}>
                  <span>{gift.description}</span>
                  <strong>{gift.currency} {gift.value.toLocaleString()}</strong>
                  <em>{donor?.legalName ?? "—"} &middot; {formatDate(gift.giftDate)}</em>
                  <StatusBadge status={gift.petOrClt} />
                  <div className="list-item-actions">
                    <button type="button" className="icon-button icon-button--danger" onClick={() => setDeleteId(gift.id)} aria-label={t("common.delete")}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {timeline && (
        <section className="panel">
          <div className="panel-header">
            <h3><T k="gifts.timeline_title" /></h3>
          </div>
          <div className="metric-grid">
            <div className="metric"><span><T k="gifts.cumulative_total" /></span><strong>{fmt(timeline.cumulativeTotal)}</strong></div>
            <div className="metric"><span><T k="gifts.nrb_remaining" /></span><strong className={timeline.nrbRemaining < 100_000 ? "text-danger" : ""}>{fmt(timeline.nrbRemaining)}</strong></div>
          </div>
          {timeline.gifts.length > 0 && (
            <GiftTimelineChart timeline={timeline} />
          )}
          {timeline.gifts.length > 0 && (
            <ul className="compact-list mt-2">
              {timeline.gifts.map((g) => (
                <li key={g.id}>
                  <span>{g.description}</span>
                  <strong>{g.taperBand} yr</strong>
                  <em>{g.taperReliefPercent}% relief</em>
                  <StatusBadge status={g.yearsElapsed >= 7 ? "fallen off" : "active"} variant={g.yearsElapsed >= 7 ? "success" : "warning"} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Modal open={showAdd} titleKey="gifts.add_gift" onClose={() => { setShowAdd(false); resetForm(); }}>
        <form onSubmit={handleSubmit}>
          {people.length > 1 && (
            <FormSelect
              name="donorPersonId"
              labelKey="gifts.donor"
              value={donorId}
              options={people.map((p) => ({ value: p.id, label: p.legalName }))}
              onChange={setDonorId}
            />
          )}
          <FormField name="description" labelKey="gifts.description" value={description} onChange={setDescription} required />
          <FormDateInput name="giftDate" labelKey="gifts.gift_date" value={giftDate} onChange={setGiftDate} required />
          <FormCurrencyInput name="value" labelKey="gifts.value" value={value} currency={currency} onChange={setValue} required />
          <FormField name="assetType" labelKey="gifts.asset_type" value={assetType} onChange={setAssetType} />
          <FormField name="relationship" labelKey="gifts.relationship" value={relationship} onChange={setRelationship} />
          <FormSelect name="exemptionClaimed" labelKey="gifts.exemption" value={exemption} options={EXEMPTION_OPTIONS} onChange={setExemption} />
          <FormSelect name="petOrClt" labelKey="gifts.classification" value={petOrClt} options={PET_CLT_OPTIONS} onChange={setPetOrClt} />
          {mutation.error && <div className="form-field__error" role="alert">{mutation.error}</div>}
          <FormActions onCancel={() => { setShowAdd(false); resetForm(); }} loading={mutation.loading} />
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} titleKey="gifts.delete_title" messageKey="gifts.delete_confirm" destructive onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
