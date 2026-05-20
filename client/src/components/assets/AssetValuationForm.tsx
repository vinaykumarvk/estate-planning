import { useTranslation } from "react-i18next";
import { createAssetSchema } from "../../../../shared/schemas";
import { useMatterContext } from "../hooks/useMatterContext";
import { useFormState } from "../hooks/useFormState";
import { useApiMutation } from "../hooks/useApiMutation";
import { FormField } from "../primitives/FormField";
import { FormSelect } from "../primitives/FormSelect";
import { FormCurrencyInput } from "../primitives/FormCurrencyInput";
import { FormDateInput } from "../primitives/FormDateInput";
import { FormActions } from "../primitives/FormActions";
import { Modal } from "../primitives/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const ASSET_CLASSES = [
  { value: "real_estate", labelKey: "options.asset_real_estate" },
  { value: "bank_account", labelKey: "options.asset_bank_account" },
  { value: "securities", labelKey: "options.asset_securities" },
  { value: "pension", labelKey: "options.asset_pension" },
  { value: "insurance", labelKey: "options.asset_insurance" },
  { value: "mobile_money", labelKey: "options.asset_mobile_money" },
  { value: "business", labelKey: "options.asset_business" },
  { value: "cash", labelKey: "options.asset_cash" },
  { value: "cryptocurrency", labelKey: "options.asset_cryptocurrency" },
  { value: "digital_asset", labelKey: "options.asset_digital_asset" },
  { value: "intellectual_property", labelKey: "options.asset_intellectual_property" },
  { value: "debt", labelKey: "options.asset_debt" },
  { value: "other", labelKey: "options.asset_other" },
];

const OWNERSHIP_TYPES = [
  { value: "sole", labelKey: "options.ownership_sole" },
  { value: "joint_tenancy", labelKey: "options.ownership_joint_tenancy" },
  { value: "tenancy_in_common", labelKey: "options.ownership_tenancy_in_common" },
  { value: "beneficial", labelKey: "options.ownership_beneficial" },
];

const CONFIDENCE_LEVELS = [
  { value: "low", labelKey: "options.confidence_low" },
  { value: "medium", labelKey: "options.confidence_medium" },
  { value: "high", labelKey: "options.confidence_high" },
];

export function AssetValuationForm({ open, onClose, onSaved }: Props) {
  const { matterId, workspace } = useMatterContext();
  const { t } = useTranslation();
  const people = workspace?.people ?? [];
  const form = useFormState(createAssetSchema, {
    tenantId: "tenant-demo",
    matterId,
    ownerPersonId: "",
    assetClass: "other" as const,
    description: "",
    situsCountry: "GB",
    currency: "NGN",
    valuation: 0,
    valuationDate: new Date(),
    valuationSource: "",
    confidenceLevel: "medium" as const,
    ownershipType: "sole" as const,
    ownershipShare: 100,
    todPod: false,
    dynamicFields: "{}",
    evidenceRefs: [],
  });
  const mutation = useApiMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.validate()) return;
    const result = await mutation.mutate(`/api/matters/${matterId}/assets`, form.values);
    if (result) {
      form.reset();
      onSaved();
      onClose();
    }
  }

  return (
    <Modal open={open} titleKey="assets.add_title" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="form-stack">
        <FormSelect name="ownerPersonId" labelKey="assets.owner" value={String(form.values.ownerPersonId ?? "")} options={[
          { value: "", labelKey: "common.select" },
          ...people.map((p) => ({ value: p.id, label: p.legalName })),
        ]} onChange={(v) => form.handleChange("ownerPersonId", v)} />
        <div className="form-row">
          <FormSelect name="assetClass" labelKey="assets.class" value={form.values.assetClass} options={ASSET_CLASSES} required onChange={(v) => form.handleChange("assetClass", v)} />
          <FormField name="description" labelKey="assets.description" value={form.values.description} error={form.errors.description} required onChange={(v) => form.handleChange("description", v)} />
        </div>
        <div className="form-row">
          <FormField name="situsCountry" labelKey="assets.situs" value={form.values.situsCountry} error={form.errors.situsCountry} required onChange={(v) => form.handleChange("situsCountry", v)} />
          <FormField name="currency" labelKey="assets.currency" value={form.values.currency} error={form.errors.currency} required onChange={(v) => form.handleChange("currency", v)} />
        </div>
        <div className="form-row">
          <FormCurrencyInput name="valuation" labelKey="assets.valuation" value={form.values.valuation} currency={form.values.currency} required onChange={(v) => form.handleChange("valuation", v)} />
          <FormSelect name="confidenceLevel" labelKey="assets.confidence" value={form.values.confidenceLevel} options={CONFIDENCE_LEVELS} onChange={(v) => form.handleChange("confidenceLevel", v)} />
        </div>
        <div className="form-row">
          <FormDateInput name="valuationDate" labelKey="assets.valuation_date" value={form.values.valuationDate ? new Date(form.values.valuationDate).toISOString().split("T")[0] : ""} required onChange={(v) => form.handleChange("valuationDate", new Date(v))} />
          <FormField name="valuationSource" labelKey="assets.valuation_source" value={form.values.valuationSource} error={form.errors.valuationSource} required onChange={(v) => form.handleChange("valuationSource", v)} />
        </div>
        <div className="form-row">
          <FormSelect name="ownershipType" labelKey="assets.ownership_type" value={form.values.ownershipType} options={OWNERSHIP_TYPES} onChange={(v) => form.handleChange("ownershipType", v)} />
          <FormField name="ownershipShare" labelKey="assets.ownership_share" value={String(form.values.ownershipShare)} type="number" onChange={(v) => form.handleChange("ownershipShare", Number(v))} />
        </div>
        <FormField name="beneficiaryDesignation" labelKey="assets.beneficiary_designation" value={String((form.values as any).beneficiaryDesignation ?? "")} onChange={(v) => form.handleChange("beneficiaryDesignation" as any, v)} />
        <div className="form-row">
          <FormCheckbox name="todPod" labelKey="assets.tod_pod" checked={!!form.values.todPod} onChange={(v) => form.handleChange("todPod", v)} />
          <FormCheckbox name="volatilityFlag" labelKey="assets.volatility_flag" checked={!!(form.values as any).volatilityFlag} onChange={(v) => form.handleChange("volatilityFlag" as any, v)} />
        </div>
        <FormField name="digitalAccessMethod" labelKey="assets.digital_access_method" value={String((form.values as any).digitalAccessMethod ?? "")} onChange={(v) => form.handleChange("digitalAccessMethod" as any, v)} />
        {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
        <FormActions onCancel={onClose} loading={mutation.loading} />
      </form>
    </Modal>
  );
}
