import { useState } from "react";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiQuery } from "../hooks/useApiQuery";
import { useApiMutation } from "../hooks/useApiMutation";
import { FormTextarea } from "../primitives/FormTextarea";
import { FormSelect } from "../primitives/FormSelect";

interface Message {
  id: string;
  senderUserId: string;
  body: string;
  sensitivity: string;
  createdAt: string;
}

export function SecureMessaging() {
  const { t } = useTranslation();
  const { matterId } = useMatterContext();
  const { data, refetch } = useApiQuery<{ messages: Message[] }>(`/api/messages?matterId=${matterId}`);
  const mutation = useApiMutation();
  const [body, setBody] = useState("");
  const [sensitivity, setSensitivity] = useState("confidential");

  const messages = data?.messages ?? [];

  async function handleSend() {
    if (!body.trim()) return;
    await mutation.mutate("/api/messages", {
      tenantId: "tenant-demo",
      matterId,
      senderUserId: "user-solicitor",
      body,
      sensitivity,
      locale: "en",
    });
    setBody("");
    refetch();
  }

  return (
    <div className="panel">
      <h3>{t("admin.messaging_title")}</h3>
      <div className="message-thread">
        {messages.map((m) => (
          <div key={m.id} className="message">
            <div className="message__header">
              <strong>{m.senderUserId}</strong>
              <span className="status-badge status-badge--default">{m.sensitivity}</span>
            </div>
            <p>{m.body}</p>
          </div>
        ))}
      </div>
      <div className="form-stack" style={{ marginTop: 12 }}>
        <FormTextarea name="body" labelKey="admin.message_body" value={body} onChange={setBody} />
        <FormSelect name="sensitivity" labelKey="admin.sensitivity" value={sensitivity} options={[
          { value: "confidential", labelKey: "options.sensitivity_confidential" },
          { value: "restricted", labelKey: "options.sensitivity_restricted" },
          { value: "public", labelKey: "options.sensitivity_public" },
        ]} onChange={setSensitivity} />
        <button type="button" onClick={handleSend} disabled={!body.trim() || mutation.loading}>
          <Send aria-hidden="true" size={14} /> {t("admin.send_message")}
        </button>
      </div>
      {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
    </div>
  );
}
