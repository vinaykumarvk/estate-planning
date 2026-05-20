import { createContext, useContext } from "react";
import type { WorkspacePayload } from "../../lib/api";

export interface MatterContextValue {
  matterId: string;
  tenantId: string;
  workspace: WorkspacePayload | null;
  refreshWorkspace: () => void;
}

export const MatterContext = createContext<MatterContextValue | null>(null);

export function useMatterContext(): MatterContextValue {
  const ctx = useContext(MatterContext);
  if (!ctx) throw new Error("useMatterContext must be used within MatterProvider");
  return ctx;
}
