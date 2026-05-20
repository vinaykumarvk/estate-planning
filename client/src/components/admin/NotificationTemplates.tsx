import { useState } from "react";
import { Plus, Trash2, Edit3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useApiQuery } from "../hooks/useApiQuery";
import { useApiMutation } from "../hooks/useApiMutation";
import { FormField } from "../primitives/FormField";
import { FormSelect } from "../primitives/FormSelect";
import { FormTextarea } from "../primitives/FormTextarea";
import { FormActions } from "../primitives/FormActions";
import { Modal } from "../primitives/Modal";
import { ConfirmDialog } from "../primitives/ConfirmDialog";
import { EmptyState } from "../primitives/EmptyState";
import { StatusBadge } from "../primitives/StatusBadge";

interface Template {
  id: string;
  templateCode: string;
  locale: string;
  channel: string;
  subject: string;
  body: string;
  status: string;
}

export function NotificationTemplates() {
  const { t } = useTranslation();
  const { data, refetch } = useApiQuery<{ templates: Template[] }>("/api/notification-templates");
  const mutation = useApiMutation();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({ templateCode: "", locale: "en", channel: "email", subject: "", body: "", status: "draft" });

  const templates = data?.templates ?? [];

  function openEdit(tmpl: Template) {
    setEditTemplate(tmpl);
    setFormData({ templateCode: tmpl.templateCode, locale: tmpl.locale, channel: tmpl.channel, subject: tmpl.subject, body: tmpl.body, status: tmpl.status });
    setShowForm(true);
  }

  function openCreate() {
    setEditTemplate(null);
    setFormData({ templateCode: "", locale: "en", channel: "email", subject: "", body: "", status: "draft" });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editTemplate) {
      await mutation.mutate(`/api/notification-templates/${editTemplate.id}`, formData, "PATCH");
    } else {
      await mutation.mutate("/api/notification-templates", { tenantId: "tenant-demo", ...formData });
    }
    setShowForm(false);
    refetch();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await mutation.mutate(`/api/notification-templates/${deleteId}`, undefined, "DELETE");
    setDeleteId(null);
    refetch();
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>{t("admin.templates_title")}</h3>
        <button type="button" onClick={openCreate}><Plus aria-hidden="true" size={14} /> {t("admin.add_template")}</button>
      </div>
      {templates.length === 0 ? (
        <EmptyState messageKey="admin.templates_empty" actionKey="admin.add_template" onAction={openCreate} />
      ) : (
        <ul className="compact-list">
          {templates.map((tmpl) => (
            <li key={tmpl.id}>
              <span>{tmpl.templateCode} ({tmpl.channel})</span>
              <StatusBadge status={tmpl.status} />
              <div className="list-item-actions">
                <button type="button" className="icon-button" onClick={() => openEdit(tmpl)} aria-label={t("common.edit")}><Edit3 size={14} /></button>
                <button type="button" className="icon-button icon-button--danger" onClick={() => setDeleteId(tmpl.id)} aria-label={t("common.delete")}><Trash2 size={14} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={showForm} titleKey={editTemplate ? "admin.edit_template" : "admin.add_template"} onClose={() => setShowForm(false)}>
        <form onSubmit={handleSubmit} className="form-stack">
          <FormField name="templateCode" labelKey="admin.template_code" value={formData.templateCode} required onChange={(v) => setFormData({ ...formData, templateCode: v })} />
          <FormSelect name="channel" labelKey="admin.channel" value={formData.channel} options={[{ value: "email", labelKey: "options.channel_email" }, { value: "in_app", labelKey: "options.channel_in_app" }, { value: "sms", labelKey: "options.channel_sms" }]} onChange={(v) => setFormData({ ...formData, channel: v })} />
          <FormField name="subject" labelKey="admin.subject" value={formData.subject} required onChange={(v) => setFormData({ ...formData, subject: v })} />
          <FormTextarea name="body" labelKey="admin.body" value={formData.body} required onChange={(v) => setFormData({ ...formData, body: v })} />
          <FormSelect name="status" labelKey="admin.status" value={formData.status} options={[{ value: "draft", labelKey: "options.status_draft" }, { value: "approved", labelKey: "options.status_approved" }, { value: "archived", labelKey: "options.status_archived" }]} onChange={(v) => setFormData({ ...formData, status: v })} />
          {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
          <FormActions onCancel={() => setShowForm(false)} loading={mutation.loading} />
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteId} titleKey="admin.delete_template" messageKey="admin.delete_template_confirm" destructive onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
