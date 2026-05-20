interface Props {
  status: string;
  variant?: "success" | "warning" | "danger" | "default";
}

const autoVariant: Record<string, Props["variant"]> = {
  active: "success", completed: "success", approved: "success", witnessed: "success",
  pending: "warning", draft: "warning", in_progress: "warning", scheduled: "warning",
  blocked: "danger", cancelled: "danger", failed: "danger", rejected: "danger",
};

export function StatusBadge({ status, variant }: Props) {
  const v = variant ?? autoVariant[status] ?? "default";
  return <span className={`status-badge status-badge--${v}`}>{status.replaceAll("_", " ")}</span>;
}
