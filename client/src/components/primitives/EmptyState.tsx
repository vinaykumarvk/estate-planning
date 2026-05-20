import { T } from "./T";

interface Props {
  messageKey: string;
  actionKey?: string;
  onAction?: () => void;
}

export function EmptyState({ messageKey, actionKey, onAction }: Props) {
  return (
    <div className="empty-state">
      <p><T k={messageKey} /></p>
      {actionKey && onAction && (
        <button type="button" onClick={onAction}><T k={actionKey} /></button>
      )}
    </div>
  );
}
