import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiQuery } from "../hooks/useApiQuery";
import { useApiMutation } from "../hooks/useApiMutation";
import { FormField } from "../primitives/FormField";
import { FormActions } from "../primitives/FormActions";
import { StatusBadge } from "../primitives/StatusBadge";

interface SigningEvent {
  id: string;
  status: string;
  documentId: string;
  scheduledAt: string;
  witnesses: Array<{ name: string; address: string }>;
}

const TRANSITIONS = ["in_progress", "witnessed", "completed", "cancelled"] as const;

export function SigningCeremony() {
  const { t } = useTranslation();
  const { matterId } = useMatterContext();
  const { data, refetch } = useApiQuery<{ events: SigningEvent[] }>(`/api/planning/matters/${matterId}/signing-events`);
  const mutation = useApiMutation();
  const [witnessName, setWitnessName] = useState("");
  const [witnessAddress, setWitnessAddress] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const events = data?.events ?? [];

  async function handleTransition(eventId: string, targetStatus: string) {
    await mutation.mutate(`/api/planning/signing-events/${eventId}/transition`, {
      eventId,
      targetStatus,
      actorUserId: "user-solicitor",
    });
    refetch();
  }

  async function handleAddWitness(eventId: string) {
    if (!witnessName || !witnessAddress) return;
    await mutation.mutate(`/api/planning/signing-events/${eventId}/witnesses`, {
      eventId,
      witnessName,
      witnessAddress,
      actorUserId: "user-solicitor",
    });
    setWitnessName("");
    setWitnessAddress("");
    refetch();
  }

  return (
    <div className="panel">
      <h3>{t("review.signing_title")}</h3>
      {events.length === 0 ? (
        <p className="form-field__hint">{t("review.no_signing_events")}</p>
      ) : (
        <ul className="compact-list">
          {events.map((event) => (
            <li key={event.id} className="signing-event">
              <div className="signing-event__header">
                <span>{t("review.event")}: {event.id.slice(0, 8)}</span>
                <StatusBadge status={event.status} />
              </div>
              <div className="button-row" style={{ marginTop: 8 }}>
                {TRANSITIONS.filter((s) => s !== event.status).map((s) => (
                  <button key={s} type="button" onClick={() => handleTransition(event.id, s)} disabled={mutation.loading}>
                    {s.replaceAll("_", " ")}
                  </button>
                ))}
              </div>
              <button type="button" className="form-actions__cancel" style={{ marginTop: 8 }} onClick={() => setSelectedEventId(selectedEventId === event.id ? null : event.id)}>
                {t("review.add_witness")}
              </button>
              {selectedEventId === event.id && (
                <div className="form-stack" style={{ marginTop: 8 }}>
                  <FormField name="witnessName" labelKey="review.witness_name" value={witnessName} required onChange={setWitnessName} />
                  <FormField name="witnessAddress" labelKey="review.witness_address" value={witnessAddress} required onChange={setWitnessAddress} />
                  <button type="button" onClick={() => handleAddWitness(event.id)} disabled={mutation.loading}>{t("common.save")}</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
    </div>
  );
}
