import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useFormState } from "../hooks/useFormState";
import { useApiMutation } from "../hooks/useApiMutation";
import { createDispositionSchema } from "../../../../shared/schemas";
import { FormSelect } from "../primitives/FormSelect";
import { FormField } from "../primitives/FormField";
import { FormActions } from "../primitives/FormActions";
import { Modal } from "../primitives/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  scenarioId: string;
}

const FIDUCIARY_ROLES = [
  { value: "executor", labelKey: "options.fiduciary_executor" },
  { value: "guardian", labelKey: "options.fiduciary_guardian" },
  { value: "trustee", labelKey: "options.fiduciary_trustee" },
  { value: "attorney", labelKey: "options.fiduciary_attorney" },
];

export function FiduciaryForm({ open, onClose, onSaved, scenarioId }: Props) {
  const { matterId, workspace } = useMatterContext();
  const { t } = useTranslation();
  const form = useFormState(createDispositionSchema, {
    tenantId: "tenant-demo",
    matterId,
    scenarioId,
    giftType: "specific" as const,
    beneficiaryLabel: "Fiduciary appointment",
    fiduciaryRole: "",
    executorPersonId: "",
    guardianPersonId: "",
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
    <Modal open={open} titleKey="dispositions.appoint_fiduciary" onClose={onClose}>
      <form onSubmit={handleSubmit} className="form-stack">
        <FormSelect name="fiduciaryRole" labelKey="dispositions.fiduciary_role" value={String(form.values.fiduciaryRole ?? "")} options={FIDUCIARY_ROLES} required onChange={(v) => form.handleChange("fiduciaryRole", v)} />
        <FormSelect name="executorPersonId" labelKey="dispositions.executor" value={String(form.values.executorPersonId ?? "")} options={people.map((p) => ({ value: p.id, label: p.legalName }))} onChange={(v) => form.handleChange("executorPersonId", v)} />
        <FormSelect name="guardianPersonId" labelKey="dispositions.guardian" value={String(form.values.guardianPersonId ?? "")} options={people.map((p) => ({ value: p.id, label: p.legalName }))} onChange={(v) => form.handleChange("guardianPersonId", v)} />
        <FormField name="beneficiaryLabel" labelKey="dispositions.notes" value={String(form.values.beneficiaryLabel)} onChange={(v) => form.handleChange("beneficiaryLabel", v)} />
        {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
        <FormActions onCancel={onClose} loading={mutation.loading} />
      </form>
    </Modal>
  );
}
