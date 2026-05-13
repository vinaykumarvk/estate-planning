export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "demo-api-key",
      "x-user-id": "user-solicitor",
      "x-tenant-id": "tenant-demo",
      ...(options?.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(payload.error ?? response.statusText);
  }

  return response.json() as Promise<T>;
}

export interface BootstrapPayload {
  tenant: { id: string; name: string; defaultLocale: string } | null;
  matters: Array<{
    id: string;
    matterNumber: string;
    title: string;
    status: string;
    primaryJurisdictionCode: string;
    languageOfRecord: string;
    riskLevel: string;
  }>;
  packs: Array<{ id: string; name: string; jurisdictionCode: string; status: string; activeVersion: string | null }>;
}

export interface WorkspacePayload {
  matter: {
    id: string;
    title: string;
    status: string;
    primaryJurisdictionCode: string;
    riskLevel: string;
    additionalJurisdictions: string[];
  };
  people: Array<{ id: string; legalName: string; preferredLanguage: string; domicileCountry: string | null; habitualResidence: string | null }>;
  assets: Array<{ id: string; assetClass: string; description: string; currency: string; valuation: number; situsCountry: string; evidenceRefs: string[] }>;
  scenarios: Array<{ id: string; name: string; status: string }>;
  documents: Array<{ id: string; title: string; status: string; reviewStatus: string; executionStatus: string; hash: string }>;
  reviews: Array<{ id: string; reviewType: string; status: string; mandatory: boolean; triggerReason: string }>;
  auditEvents: Array<{ id: string; eventType: string; actorRole: string; createdAt: string }>;
}
