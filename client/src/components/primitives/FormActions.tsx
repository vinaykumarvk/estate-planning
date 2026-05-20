import { useTranslation } from "react-i18next";
import { T } from "./T";

interface Props {
  onCancel: () => void;
  submitLabelKey?: string;
  loading?: boolean;
}

export function FormActions({ onCancel, submitLabelKey = "common.save", loading }: Props) {
  const { t } = useTranslation();
  return (
    <div className="form-actions">
      <button type="button" className="form-actions__cancel" onClick={onCancel} disabled={loading}>
        <T k="common.cancel" />
      </button>
      <button type="submit" className="form-actions__submit" disabled={loading}>
        {loading ? t("common.saving") : <T k={submitLabelKey} />}
      </button>
    </div>
  );
}
