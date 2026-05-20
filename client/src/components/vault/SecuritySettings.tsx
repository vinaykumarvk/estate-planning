import {
  CheckCircle2,
  Clock,
  Fingerprint,
  Globe,
  Lock,
  LogIn,
  Monitor,
  Shield,
  Smartphone,
} from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "../primitives/StatusBadge";
import { T } from "../primitives/T";

/* ---------- Types ---------- */

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  ip: string;
}

/* ---------- Mock data ---------- */

const MOCK_ACCESS_LOG: AuditLogEntry[] = [
  { id: "al-1", timestamp: "2026-05-20T09:14:32Z", action: "Login successful", ip: "192.168.1.42" },
  { id: "al-2", timestamp: "2026-05-20T08:02:11Z", action: "Session renewed", ip: "192.168.1.42" },
  { id: "al-3", timestamp: "2026-05-19T17:45:00Z", action: "Password changed", ip: "10.0.0.15" },
  { id: "al-4", timestamp: "2026-05-19T16:30:22Z", action: "2FA enabled", ip: "10.0.0.15" },
  { id: "al-5", timestamp: "2026-05-19T14:12:08Z", action: "Document downloaded", ip: "10.0.0.15" },
  { id: "al-6", timestamp: "2026-05-18T11:05:44Z", action: "Login successful", ip: "172.16.0.8" },
  { id: "al-7", timestamp: "2026-05-18T09:22:15Z", action: "Login failed", ip: "203.0.113.50" },
  { id: "al-8", timestamp: "2026-05-17T15:48:33Z", action: "Session timeout", ip: "192.168.1.42" },
  { id: "al-9", timestamp: "2026-05-17T08:30:00Z", action: "Login successful", ip: "192.168.1.42" },
  { id: "al-10", timestamp: "2026-05-16T14:20:19Z", action: "Biometric enrolled", ip: "192.168.1.42" },
];

const SESSION_TIMEOUT_OPTIONS = [
  { value: "5", label: "5 minutes" },
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
];

/* ---------- Component ---------- */

export function SecuritySettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");

  return (
    <div className="content-grid">
      {/* Overview panel */}
      <section className="panel span-2">
        <div className="panel-header">
          <h3><Shield aria-hidden="true" size={16} /> Security Settings</h3>
          <StatusBadge
            status={twoFactorEnabled ? "2FA active" : "2FA inactive"}
            variant={twoFactorEnabled ? "success" : "warning"}
          />
        </div>
        <div className="metric-grid">
          <div className="metric">
            <span>Two-factor auth</span>
            <strong className={twoFactorEnabled ? "text-success" : "text-danger"}>
              {twoFactorEnabled ? "Enabled" : "Disabled"}
            </strong>
          </div>
          <div className="metric">
            <span>Biometric lock</span>
            <strong className={biometricEnabled ? "text-success" : "text-danger"}>
              {biometricEnabled ? "Enabled" : "Disabled"}
            </strong>
          </div>
          <div className="metric">
            <span>Session timeout</span>
            <strong>{SESSION_TIMEOUT_OPTIONS.find((o) => o.value === sessionTimeout)?.label}</strong>
          </div>
          <div className="metric">
            <span>Encryption</span>
            <strong className="text-success">AES-256-GCM</strong>
          </div>
        </div>
      </section>

      {/* 2FA settings */}
      <section className="panel">
        <div className="panel-header">
          <h3><Smartphone aria-hidden="true" size={16} /> Two-Factor Authentication</h3>
          <StatusBadge status={twoFactorEnabled ? "active" : "pending"} />
        </div>
        <div style={{ padding: "0.5rem 0" }}>
          <label className="form-field__checkbox-label" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={(e) => setTwoFactorEnabled(e.target.checked)}
            />
            <span>Enable two-factor authentication (TOTP)</span>
          </label>

          {twoFactorEnabled ? (
            <div style={{ padding: "0.75rem", borderRadius: 6, background: "var(--surface-raised, #f5f5f5)" }}>
              <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>TOTP Setup Instructions</p>
              <ol style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9em", lineHeight: 1.7 }}>
                <li>Download an authenticator app (e.g. Google Authenticator, Authy, or Microsoft Authenticator).</li>
                <li>Open the authenticator app and select "Add account" or scan a QR code.</li>
                <li>Scan the QR code displayed on screen, or manually enter the secret key provided.</li>
                <li>Enter the 6-digit code from your authenticator app to verify setup.</li>
                <li>Save your backup recovery codes in a secure location.</li>
              </ol>
              <div style={{ marginTop: "0.75rem", padding: "0.5rem", border: "1px dashed var(--border-color, #ccc)", borderRadius: 4, textAlign: "center", fontSize: "0.85em", opacity: 0.6 }}>
                [QR Code placeholder - generated on server activation]
              </div>
            </div>
          ) : (
            <p style={{ fontSize: "0.9em", opacity: 0.7 }}>
              Two-factor authentication adds an extra layer of security to your account. When enabled, you will need
              to enter a time-based code from your authenticator app in addition to your password each time you sign in.
            </p>
          )}
        </div>
      </section>

      {/* Biometric lock */}
      <section className="panel">
        <div className="panel-header">
          <h3><Fingerprint aria-hidden="true" size={16} /> Biometric Lock</h3>
          <StatusBadge status={biometricEnabled ? "active" : "pending"} />
        </div>
        <div style={{ padding: "0.5rem 0" }}>
          <label className="form-field__checkbox-label" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
            <input
              type="checkbox"
              checked={biometricEnabled}
              onChange={(e) => setBiometricEnabled(e.target.checked)}
            />
            <span>Enable biometric authentication</span>
          </label>
          <p style={{ fontSize: "0.9em", opacity: 0.7 }}>
            {biometricEnabled
              ? "Biometric lock is active. You can use fingerprint or face recognition to unlock the vault on supported devices. This works alongside your password and 2FA for maximum security."
              : "Enable biometric authentication to use fingerprint or face recognition to access the vault. Requires a device with biometric hardware (Touch ID, Face ID, Windows Hello, etc.)."
            }
          </p>
          {biometricEnabled && (
            <div className="metric-grid" style={{ marginTop: "0.75rem" }}>
              <div className="metric">
                <span>Enrolled devices</span>
                <strong>1</strong>
              </div>
              <div className="metric">
                <span>Last biometric login</span>
                <strong>Today</strong>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Session timeout */}
      <section className="panel">
        <div className="panel-header">
          <h3><Clock aria-hidden="true" size={16} /> Session Timeout</h3>
        </div>
        <div style={{ padding: "0.5rem 0" }}>
          <div className="form-field">
            <label className="form-field__label" htmlFor="field-sessionTimeout">
              Auto-lock after inactivity
            </label>
            <select
              id="field-sessionTimeout"
              className="form-field__select"
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
            >
              {SESSION_TIMEOUT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <p style={{ fontSize: "0.9em", opacity: 0.7, marginTop: "0.5rem" }}>
            The session will automatically lock after the selected period of inactivity. You will need to
            re-authenticate using your password{twoFactorEnabled ? ", 2FA code" : ""}{biometricEnabled ? ", or biometric" : ""} to
            resume your session.
          </p>
        </div>
      </section>

      {/* Encryption status */}
      <section className="panel">
        <div className="panel-header">
          <h3><Lock aria-hidden="true" size={16} /> Encryption Status</h3>
          <StatusBadge status="Verified" variant="success" />
        </div>
        <div style={{ padding: "0.5rem 0" }}>
          <ul className="compact-list">
            <li>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 aria-hidden="true" size={14} className="text-success" />
                Algorithm
              </span>
              <strong>AES-256-GCM</strong>
            </li>
            <li>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 aria-hidden="true" size={14} className="text-success" />
                Key derivation
              </span>
              <strong>PBKDF2-SHA256</strong>
            </li>
            <li>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 aria-hidden="true" size={14} className="text-success" />
                Transport
              </span>
              <strong>TLS 1.3</strong>
            </li>
            <li>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 aria-hidden="true" size={14} className="text-success" />
                At-rest encryption
              </span>
              <strong>Enabled</strong>
            </li>
            <li>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 aria-hidden="true" size={14} className="text-success" />
                Last integrity check
              </span>
              <strong>2026-05-20</strong>
            </li>
          </ul>
        </div>
      </section>

      {/* Access log */}
      <section className="panel span-2">
        <div className="panel-header">
          <h3><Monitor aria-hidden="true" size={16} /> Access Log</h3>
          <StatusBadge status={`${MOCK_ACCESS_LOG.length} events`} variant="default" />
        </div>
        <ul className="compact-list">
          {MOCK_ACCESS_LOG.map((entry) => {
            const isFailure = entry.action.toLowerCase().includes("failed");
            return (
              <li key={entry.id}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 160 }}>
                  <LogIn aria-hidden="true" size={14} className={isFailure ? "text-danger" : ""} />
                  <strong style={{ color: isFailure ? "var(--color-danger, #d32f2f)" : undefined }}>{entry.action}</strong>
                </span>
                <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, fontSize: "0.9em" }}>
                  <Globe aria-hidden="true" size={12} /> {entry.ip}
                </span>
                <em style={{ fontSize: "0.85em", whiteSpace: "nowrap" }}>
                  {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </em>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
