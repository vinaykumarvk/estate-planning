import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { T } from "./T";

interface Props {
  open: boolean;
  titleKey: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}

export function Modal({ open, titleKey, onClose, children, wide }: Props) {
  const { t } = useTranslation();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className={`modal-dialog${wide ? " modal-dialog--wide" : ""}`} role="dialog" aria-modal="true" aria-label={t(titleKey)}>
        <div className="modal-header">
          <h2><T k={titleKey} /></h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label={t("common.close")}>
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
