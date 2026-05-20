import { useTranslation } from "react-i18next";
import { createDispositionSchema } from "../../../../shared/schemas";
import { useMatterContext } from "../hooks/useMatterContext";
import { useFormState } from "../hooks/useFormState";
import { useApiMutation } from "../hooks/useApiMutation";
import { FormField } from "../primitives/FormField";
import { FormSelect } from "../primitives/FormSelect";
import { FormCurrencyInput } from "../primitives/FormCurrencyInput";
import { FormCheckbox } from "../primitives/FormCheckbox";
import { FormActions } from "../primitives/FormActions";
import { Modal } from "../primitives/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  scenarioId: string;
}

const GIFT_TYPES = [
  { value: "specific", labelKey: "options.gift_specific" },
  { value: "cash", labelKey: "options.gift_cash" },
  { value: "percentage", labelKey: "options.gift_percentage" },
  { value: "residue", labelKey: "options.gift_residue" },
  { value: "class", labelKey: "options.gift_class" },
  { value: "charitable", labelKey: "options.gift_charitable" },
];

export function GiftForm({ open, onClose, onSaved, scenarioId }: Props) {
  const { matterId, workspace } = useMatterContext();
  const { t } = useTranslation();
  const form = useFormState(createDispositionSchema, {
    tenantId: "tenant-demo",
    matterId,
    scenarioId,
    giftType: "specific" as const,
    beneficiaryLabel: "",
    beneficiaryPersonId: "",
    amount: 0,
    percentage: 0,
    currency: "NGN",
    conditions: "",
    survivorshipDays: 0,
    perStirpes: false,
    perCapita: false,
    lifetimeGift: false,
  } as any);
  const mutation = useApiMutation();

  const people = workspace?.people ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.validate()) return;
    const result = await mutation.mutate(`/api/matters/${matterId}/dispositions`, form.values);
    if (result) {
      form.reset();
      onSaved();
      onClose();
    }
  }

  return (
    <Modal open={open} titleKey="dispositions.add_gift" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="form-stack">
        <div className="form-row">
          <FormSelect name="giftType" labelKey="dispositions.gift_type" value={String(form.values.giftType)} options={GIFT_TYPES} required onChange={(v) => form.handleChange("giftType", v)} />
          <FormField name="beneficiaryLabel" labelKey="dispositions.beneficiary_label" value={String(form.values.beneficiaryLabel)} error={form.errors.beneficiaryLabel} required onChange={(v) => form.handleChange("beneficiaryLabel", v)} />
        </div>
        <FormSelect name="beneficiaryPersonId" labelKey="dispositions.beneficiary_person" value={String(form.values.beneficiaryPersonId ?? "")} options={people.map((p) => ({ value: p.id, label: p.legalName }))} onChange={(v) => form.handleChange("beneficiaryPersonId", v)} />
        <div className="form-row">
          <FormCurrencyInput name="amount" labelKey="dispositions.amount" value={Number(form.values.amount ?? 0)} currency={String(form.values.currency ?? "NGN")} onChange={(v) => form.handleChange("amount", v)} />
          <FormField name="percentage" labelKey="dispositions.percentage" value={String(form.values.percentage ?? 0)} type="number" onChange={(v) => form.handleChange("percentage", Number(v))} />
        </div>
        <FormField name="conditions" labelKey="dispositions.conditions" value={String(form.values.conditions ?? "")} onChange={(v) => form.handleChange("conditions", v)} />
        <div className="form-row">
          <FormField name="survivorshipDays" labelKey="dispositions.survivorship_days" value={String(form.values.survivorshipDays ?? 0)} type="number" onChange={(v) => form.handleChange("survivorshipDays", Number(v))} />
        </div>
        <div className="form-row">
          <FormCheckbox name="perStirpes" labelKey="dispositions.per_stirpes" checked={!!form.values.perStirpes} onChange={(v) => form.handleChange("perStirpes", v)} />
          <FormCheckbox name="perCapita" labelKey="dispositions.per_capita" checked={!!form.values.perCapita} onChange={(v) => form.handleChange("perCapita", v)} />
          <FormCheckbox name="lifetimeGift" labelKey="dispositions.lifetime_gift" checked={!!form.values.lifetimeGift} onChange={(v) => form.handleChange("lifetimeGift", v)} />
        </div>
        {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
        <FormActions onCancel={onClose} loading={mutation.loading} />
      </form>
    </Modal>
  );
}
