import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiMutation } from "../hooks/useApiMutation";
import { StatusBadge } from "../primitives/StatusBadge";

export function ESignatureRouting() {
  const { t } = useTranslation();
  const { workspace } = useMatterContext();
  const mutation = useApiMutation();
  const documents = workspace?.documents ?? [];

  async function handleRoute(documentId: string) {
    await mutation.mutate(`/api/planning/documents/${documentId}/e-sign`, {
      actorUserId: "user-solicitor",
    });
  }

  return (
    <div className="panel">
      <h3>{t("review.esign_title")}</h3>
      {documents.length === 0 ? (
        <p className="form-field__hint">{t("review.no_documents")}</p>
      ) : (
        <ul className="compact-list">
          {documents.map((doc) => (
            <li key={doc.id}>
              <span>{doc.title}</span>
              <StatusBadge status={doc.status} />
              <button type="button" onClick={() => handleRoute(doc.id)} disabled={mutation.loading}>
                {t("review.route_esign")}
              </button>
            </li>
          ))}
        </ul>
      )}
      {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
    </div>
  );
}
