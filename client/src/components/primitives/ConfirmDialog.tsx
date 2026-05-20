import { useTranslation } from "react-i18next";
import { T } from "./T";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  titleKey: string;
  messageKey: string;
  confirmLabelKey?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({ open, titleKey, messageKey, confirmLabelKey = "common.confirm", onConfirm, onCancel, destructive }: Props) {
  const { t } = useTranslation();
  return (
    <Modal open={open} titleKey={titleKey} onClose={onCancel}>
      <p className="confirm-dialog__message"><T k={messageKey} /></p>
      <div className="form-actions">
        <button type="button" className="form-actions__cancel" onClick={onCancel}><T k="common.cancel" /></button>
        <button
          type="button"
          className={destructive ? "form-actions__submit form-actions__submit--danger" : "form-actions__submit"}
          onClick={onConfirm}
        >
          <T k={confirmLabelKey} />
        </button>
      </div>
    </Modal>
  );
}
