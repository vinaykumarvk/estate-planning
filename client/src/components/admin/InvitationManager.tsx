import { useState } from "react";
import { Plus, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { createInvitationSchema } from "../../../../shared/schemas";
import { useMatterContext } from "../hooks/useMatterContext";
import { useFormState } from "../hooks/useFormState";
import { useApiQuery } from "../hooks/useApiQuery";
import { useApiMutation } from "../hooks/useApiMutation";
import { FormField } from "../primitives/FormField";
import { FormSelect } from "../primitives/FormSelect";
import { FormDateInput } from "../primitives/FormDateInput";
import { FormActions } from "../primitives/FormActions";
import { Modal } from "../primitives/Modal";
import { EmptyState } from "../primitives/EmptyState";
import { StatusBadge } from "../primitives/StatusBadge";

interface Invitation {
  id: string;
  inviteeEmail: string;
  role: string;
  revokedAt: string | null;
  acceptedAt: string | null;
  expiresAt: string;
}

function invitationStatus(inv: Invitation): string {
  if (inv.revokedAt) return "revoked";
  if (inv.acceptedAt) return "accepted";
  if (new Date(inv.expiresAt) < new Date()) return "expired";
  return "pending";
}

export function InvitationManager() {
  const { t } = useTranslation();
  const { matterId } = useMatterContext();
  const { data, refetch } = useApiQuery<{ invitations: Invitation[] }>(`/api/invitations?matterId=${matterId}`);
  const mutation = useApiMutation();
  const [showCreate, setShowCreate] = useState(false);
  const form = useFormState(createInvitationSchema, {
    tenantId: "tenant-demo",
    matterId,
    inviteeEmail: "",
    role: "viewer",
    scopes: [],
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const invitations = data?.invitations ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.validate()) return;
    const result = await mutation.mutate("/api/invitations", form.values);
    if (result) {
      form.reset();
      setShowCreate(false);
      refetch();
    }
  }

  async function handleRevoke(id: string) {
    await mutation.mutate(`/api/invitations/${id}/revoke`, {});
    refetch();
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>{t("admin.invitations_title")}</h3>
        <button type="button" onClick={() => setShowCreate(true)}><Plus aria-hidden="true" size={14} /> {t("admin.send_invitation")}</button>
      </div>
      {invitations.length === 0 ? (
        <EmptyState messageKey="admin.invitations_empty" actionKey="admin.send_invitation" onAction={() => setShowCreate(true)} />
      ) : (
        <ul className="compact-list">
          {invitations.map((inv) => (
            <li key={inv.id}>
              <span>{inv.inviteeEmail}</span>
              <StatusBadge status={invitationStatus(inv)} />
              <em>{inv.role}</em>
              {!inv.revokedAt && (
                <button type="button" className="icon-button icon-button--danger" onClick={() => handleRevoke(inv.id)} aria-label={t("admin.revoke")}>
                  <XCircle size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <Modal open={showCreate} titleKey="admin.send_invitation" onClose={() => setShowCreate(false)}>
        <form onSubmit={handleSubmit} className="form-stack">
          <FormField name="inviteeEmail" labelKey="admin.invitee_email" value={form.values.inviteeEmail} error={form.errors.inviteeEmail} type="email" required onChange={(v) => form.handleChange("inviteeEmail", v)} />
          <FormSelect name="role" labelKey="admin.role" value={form.values.role} options={[{ value: "viewer", labelKey: "options.role_viewer" }, { value: "editor", labelKey: "options.role_editor" }, { value: "admin", labelKey: "options.role_admin" }]} onChange={(v) => form.handleChange("role", v)} />
          <FormDateInput name="expiresAt" labelKey="admin.expires_at" value={form.values.expiresAt ? new Date(form.values.expiresAt).toISOString().split("T")[0] : ""} required onChange={(v) => form.handleChange("expiresAt", new Date(v))} />
          {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
          <FormActions onCancel={() => setShowCreate(false)} loading={mutation.loading} />
        </form>
      </Modal>
    </div>
  );
}
