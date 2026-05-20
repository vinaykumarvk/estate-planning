import { useTranslation } from "react-i18next";
import { createRelationshipSchema } from "../../../../shared/schemas";
import { useMatterContext } from "../hooks/useMatterContext";
import { useFormState } from "../hooks/useFormState";
import { useApiMutation } from "../hooks/useApiMutation";
import { FormSelect } from "../primitives/FormSelect";
import { FormCheckbox } from "../primitives/FormCheckbox";
import { FormActions } from "../primitives/FormActions";
import { Modal } from "../primitives/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  people: Array<{ id: string; legalName: string }>;
}

const RELATIONSHIP_TYPES = [
  { value: "spouse", labelKey: "options.rel_spouse" },
  { value: "child", labelKey: "options.rel_child" },
  { value: "parent", labelKey: "options.rel_parent" },
  { value: "sibling", labelKey: "options.rel_sibling" },
  { value: "partner", labelKey: "options.rel_partner" },
  { value: "other", labelKey: "options.rel_other" },
];

const LEGAL_STATUSES = [
  { value: "married", labelKey: "options.legal_married" },
  { value: "civil_partnership", labelKey: "options.legal_civil_partnership" },
  { value: "divorced", labelKey: "options.legal_divorced" },
  { value: "cohabiting", labelKey: "options.legal_cohabiting" },
  { value: "single", labelKey: "options.legal_single" },
];

export function RelationshipForm({ open, onClose, onSaved, people }: Props) {
  const { matterId } = useMatterContext();
  const { t } = useTranslation();
  const form = useFormState(createRelationshipSchema, {
    tenantId: "tenant-demo",
    matterId,
    fromPersonId: "",
    toPersonId: "",
    relationshipType: "",
    legalStatus: "",
    biological: false,
    adoptive: false,
    stepRelationship: false,
    dependent: false,
    minor: false,
    incapacitated: false,
  } as any);
  const mutation = useApiMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.validate()) return;
    const result = await mutation.mutate(`/api/matters/${matterId}/relationships`, form.values);
    if (result) {
      form.reset();
      onSaved();
      onClose();
    }
  }

  const personOptions = people.map((p) => ({ value: p.id, label: p.legalName }));

  return (
    <Modal open={open} titleKey="people.add_relationship" onClose={onClose}>
      <form onSubmit={handleSubmit} className="form-stack">
        <FormSelect name="fromPersonId" labelKey="people.from_person" value={String(form.values.fromPersonId)} options={personOptions} required onChange={(v) => form.handleChange("fromPersonId", v)} />
        <FormSelect name="toPersonId" labelKey="people.to_person" value={String(form.values.toPersonId)} options={personOptions} required onChange={(v) => form.handleChange("toPersonId", v)} />
        <FormSelect name="relationshipType" labelKey="people.relationship_type" value={String(form.values.relationshipType)} options={RELATIONSHIP_TYPES} required onChange={(v) => form.handleChange("relationshipType", v)} />
        <FormSelect name="legalStatus" labelKey="people.legal_status" value={String(form.values.legalStatus)} options={LEGAL_STATUSES} required onChange={(v) => form.handleChange("legalStatus", v)} />
        <FormCheckbox name="dependent" labelKey="people.dependent" checked={!!form.values.dependent} onChange={(v) => form.handleChange("dependent", v)} />
        <FormCheckbox name="minor" labelKey="people.minor" checked={!!form.values.minor} onChange={(v) => form.handleChange("minor", v)} />
        <FormCheckbox name="incapacitated" labelKey="people.incapacitated" checked={!!form.values.incapacitated} onChange={(v) => form.handleChange("incapacitated", v)} />
        {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
        <FormActions onCancel={onClose} submitLabelKey="common.save" loading={mutation.loading} />
      </form>
    </Modal>
  );
}
