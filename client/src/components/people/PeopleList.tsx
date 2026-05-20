import { useState } from "react";
import { Plus, Trash2, Link } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiMutation } from "../hooks/useApiMutation";
import { EmptyState } from "../primitives/EmptyState";
import { ConfirmDialog } from "../primitives/ConfirmDialog";
import { PersonForm } from "./PersonForm";
import { RelationshipForm } from "./RelationshipForm";

export function PeopleList() {
  const { t } = useTranslation();
  const { workspace, refreshWorkspace } = useMatterContext();
  const mutation = useApiMutation();
  const [showAdd, setShowAdd] = useState(false);
  const [showRelationship, setShowRelationship] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { matterId } = useMatterContext();

  const people = workspace?.people ?? [];

  async function handleDelete() {
    if (!deleteId) return;
    await mutation.mutate(`/api/matters/${matterId}/people/${deleteId}`, undefined, "DELETE");
    setDeleteId(null);
    refreshWorkspace();
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>{t("people.title")}</h3>
        <div className="button-row">
          <button type="button" onClick={() => setShowRelationship(true)}><Link aria-hidden="true" size={14} /> {t("people.add_relationship")}</button>
          <button type="button" onClick={() => setShowAdd(true)}><Plus aria-hidden="true" size={14} /> {t("people.add_person")}</button>
        </div>
      </div>

      {people.length === 0 ? (
        <EmptyState messageKey="people.empty" actionKey="people.add_person" onAction={() => setShowAdd(true)} />
      ) : (
        <ul className="compact-list">
          {people.map((person) => (
            <li key={person.id}>
              <span>{person.legalName}</span>
              <strong>{person.domicileCountry ?? t("people.domicile_pending")}</strong>
              <em>{person.preferredLanguage}</em>
              <button type="button" className="icon-button icon-button--danger" onClick={() => setDeleteId(person.id)} aria-label={t("common.delete")}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <PersonForm open={showAdd} onClose={() => setShowAdd(false)} onSaved={refreshWorkspace} />
      <RelationshipForm open={showRelationship} onClose={() => setShowRelationship(false)} onSaved={refreshWorkspace} people={people} />
      <ConfirmDialog
        open={!!deleteId}
        titleKey="people.delete_title"
        messageKey="people.delete_confirm"
        confirmLabelKey="common.delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
