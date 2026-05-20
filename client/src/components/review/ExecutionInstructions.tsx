import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";

export function ExecutionInstructions() {
  const { t } = useTranslation();
  const { workspace } = useMatterContext();
  const documents = workspace?.documents ?? [];

  return (
    <div className="panel">
      <h3>{t("review.execution_title")}</h3>
      {documents.length === 0 ? (
        <p className="form-field__hint">{t("review.no_documents")}</p>
      ) : (
        <ul className="compact-list">
          {documents.map((doc) => (
            <li key={doc.id}>
              <span>{doc.title}</span>
              <strong>{doc.executionStatus}</strong>
              <em>{t("review.witness_required")}</em>
            </li>
          ))}
        </ul>
      )}
      <div className="execution-requirements" style={{ marginTop: 12 }}>
        <h4>{t("review.requirements")}</h4>
        <ul>
          <li>{t("review.req_testator_present")}</li>
          <li>{t("review.req_two_witnesses")}</li>
          <li>{t("review.req_signed_in_presence")}</li>
        </ul>
      </div>
    </div>
  );
}
