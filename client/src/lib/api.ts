export interface ApiAuthConfig {
  apiKey: string;
  userId?: string;
  tenantId?: string;
}

const AUTH_STORAGE_KEY = "estate-api-auth";

function readStoredAuth(): Partial<ApiAuthConfig> {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? "{}") as Partial<ApiAuthConfig>;
  } catch {
    return {};
  }
}

export function getApiAuth(): ApiAuthConfig {
  const stored = readStoredAuth();
  return {
    apiKey: stored.apiKey || import.meta.env.VITE_API_KEY || (import.meta.env.DEV ? "demo-api-key" : ""),
    userId: stored.userId || import.meta.env.VITE_USER_ID || (import.meta.env.DEV ? "user-solicitor" : undefined),
    tenantId: stored.tenantId || import.meta.env.VITE_TENANT_ID || undefined
  };
}

export function configureApiAuth(config: Partial<ApiAuthConfig>) {
  const next = { ...readStoredAuth(), ...config };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const auth = getApiAuth();
  const headers = new Headers(options?.headers);
  if (!headers.has("Content-Type") && !(options?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (auth.apiKey) headers.set("x-api-key", auth.apiKey);
  if (auth.userId) headers.set("x-user-id", auth.userId);
  if (auth.tenantId) headers.set("x-tenant-id", auth.tenantId);

  const response = await fetch(path, {
    ...options,
    headers
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
    languageOfRecord: string;
    riskLevel: string;
    additionalJurisdictions: string[];
  };
  people: Array<{
    id: string;
    legalName: string;
    preferredLanguage: string;
    dateOfBirth: string | null;
    email: string | null;
    nationality: string | null;
    residenceCountry: string | null;
    domicileCountry: string | null;
    habitualResidence: string | null;
    taxResidency: string | null;
  }>;
  relationships: Array<{
    id: string;
    fromPersonId: string;
    toPersonId: string;
    relationshipType: string;
    legalStatus: string;
  }>;
  consents: Array<{
    id: string;
    consentType: string;
    acknowledged: boolean;
    acknowledgedAt: string | null;
  }>;
  assets: Array<{ id: string; assetClass: string; description: string; currency: string; valuation: number; situsCountry: string; evidenceRefs: string[] }>;
  scenarios: Array<{ id: string; name: string; status: string }>;
  documents: Array<{ id: string; title: string; status: string; reviewStatus: string; executionStatus: string; hash: string }>;
  reviews: Array<{ id: string; reviewType: string; status: string; mandatory: boolean; triggerReason: string }>;
  auditEvents: Array<{ id: string; eventType: string; actorRole: string; createdAt: string }>;
}
