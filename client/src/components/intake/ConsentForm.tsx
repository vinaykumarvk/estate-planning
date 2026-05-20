import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiMutation } from "../hooks/useApiMutation";
import { FormCheckbox } from "../primitives/FormCheckbox";

export function ConsentForm() {
  const { t } = useTranslation();
  const { matterId, workspace, refreshWorkspace } = useMatterContext();
  const mutation = useApiMutation();

  const consents = workspace?.consents ?? [];
  const privacyConsent = consents.find((c) => c.consentType === "privacy_notice");
  const disclaimerConsent = consents.find((c) => c.consentType === "professional_disclaimer");

  async function handleAcknowledge(consentId: string) {
    await mutation.mutate(`/api/matters/${matterId}/consents/${consentId}/acknowledge`, {
      actorUserId: "user-solicitor",
    });
    refreshWorkspace();
  }

  return (
    <div className="panel">
      <h3>{t("intake.consent_title")}</h3>
      <div className="form-stack">
        <FormCheckbox
          name="privacy"
          labelKey="intake.privacy_notice"
          checked={!!privacyConsent?.acknowledged}
          onChange={() => {
            if (!privacyConsent?.acknowledged && privacyConsent) {
              handleAcknowledge(privacyConsent.id);
            }
          }}
        />
        <FormCheckbox
          name="disclaimer"
          labelKey="intake.professional_disclaimer"
          checked={!!disclaimerConsent?.acknowledged}
          onChange={() => {
            if (!disclaimerConsent?.acknowledged && disclaimerConsent) {
              handleAcknowledge(disclaimerConsent.id);
            }
          }}
        />
        {consents
          .filter((c) => c.consentType !== "privacy_notice" && c.consentType !== "professional_disclaimer")
          .map((c) => (
            <div key={c.id} className="consent-item">
              <span>{c.consentType}</span>
              {c.acknowledged ? (
                <span className="status-badge status-badge--success">{t("common.acknowledged")}</span>
              ) : (
                <button type="button" onClick={() => handleAcknowledge(c.id)} disabled={mutation.loading}>
                  {t("intake.acknowledge")}
                </button>
              )}
            </div>
          ))}
        {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
      </div>
    </div>
  );
}
