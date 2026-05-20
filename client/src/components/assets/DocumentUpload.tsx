import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useApiMutation } from "../hooks/useApiMutation";
import { useMatterContext } from "../hooks/useMatterContext";

interface Props {
  entityType: string;
  entityId: string;
  onUploaded: () => void;
}

export function DocumentUpload({ entityType, entityId, onUploaded }: Props) {
  const { t } = useTranslation();
  const { matterId } = useMatterContext();
  const mutation = useApiMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  // Map lowercase entityType to Prisma model name expected by server
  const entityTypeMap: Record<string, string> = {
    asset: "Asset",
    person: "Person",
    document: "Document",
    matter: "Matter",
  };

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const uploadResult = await mutation.mutate("/api/uploads", {
        tenantId: "tenant-demo",
        matterId,
        filename: file.name,
        mimeType: file.type,
        content: base64,
        actorUserId: "user-solicitor",
      }) as { file?: { id?: string } } | null;
      if (uploadResult?.file?.id) {
        await mutation.mutate(`/api/uploads/${uploadResult.file.id}/link`, {
          entityType: entityTypeMap[entityType] ?? entityType,
          entityId,
          tenantId: "tenant-demo",
        });
        setFileName("");
        if (fileRef.current) fileRef.current.value = "";
        onUploaded();
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="document-upload">
      <input
        ref={fileRef}
        type="file"
        className="document-upload__input"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
        aria-label={t("assets.upload_document")}
      />
      {fileName && (
        <button type="button" onClick={handleUpload} disabled={mutation.loading}>
          <Upload aria-hidden="true" size={14} /> {t("assets.upload")}
        </button>
      )}
      {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
    </div>
  );
}
