# Identity Provider & MFA Enforcement (OPS-002 / SEC-003)

## Overview
Production deployments must replace the local API-key-only authentication with a full identity provider (IdP) integration and enforce multi-factor authentication (MFA) for all professional and admin users.

## IdP Integration
- **Supported providers**: Azure AD, Okta, Auth0, or any OIDC-compliant IdP
- **Protocol**: OpenID Connect (OIDC) with Authorization Code Flow + PKCE
- **Token validation**: Validate JWT signature, issuer, audience, and expiry on every request
- **Session management**: Use short-lived access tokens (15 min) with refresh tokens (8 hours)

## MFA Policy
- **Required for**: All users with roles `professional`, `admin`, `solicitor`, `notary`
- **Enforcement point**: The `requireMfa()` middleware checks `user.mfaEnabled` locally; in production, this should verify the IdP session MFA claim (`amr` or `acr` in the JWT)
- **Accepted factors**: TOTP (authenticator app), WebAuthn/FIDO2 (hardware key), push notification
- **SMS OTP**: Not recommended due to SIM-swap risk; acceptable only as fallback

## Sensitive Operations Requiring MFA
- Publishing jurisdiction packs
- Finalizing documents
- Accessing compliance evidence
- Modifying tenant security policy
- Revoking API keys

## Session Configuration
- Idle timeout: 30 minutes
- Absolute timeout: 8 hours
- Re-authentication: Required for sensitive operations if session age > 15 minutes
- Concurrent sessions: Limit to 3 per user; alert on anomalous patterns

## Implementation Checklist
- [ ] Configure IdP tenant with appropriate redirect URIs
- [ ] Implement OIDC middleware to replace `requireApiKey` for user sessions
- [ ] Map IdP roles to application roles (`TenantUser.role`)
- [ ] Enforce MFA at the IdP level for all professional/admin groups
- [ ] Add session revocation endpoint
- [ ] Log all authentication events to `AuditEvent`
