import {
  Archive,
  Eye,
  FileText,
  Fingerprint,
  FolderLock,
  Home,
  Key,
  Lock,
  Plus,
  ScrollText,
  Shield,
  Timer,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useMatterContext } from "../hooks/useMatterContext";
import { Modal } from "../primitives/Modal";
import { FormActions } from "../primitives/FormActions";
import { FormField } from "../primitives/FormField";
import { FormSelect } from "../primitives/FormSelect";
import { StatusBadge } from "../primitives/StatusBadge";
import { T } from "../primitives/T";

/* ---------- Types ---------- */

interface DocumentCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  docCount: number;
}

interface TrustedContact {
  id: string;
  name: string;
  email: string;
  relationship: string;
  releaseCondition: "on_death" | "on_incapacity" | "immediate";
  status: "active" | "pending" | "revoked";
}

interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  detail: string;
}

/* ---------- Constants ---------- */

const INITIAL_CATEGORIES: DocumentCategory[] = [
  { id: "wills", name: "Wills & Testaments", icon: <ScrollText aria-hidden="true" size={18} />, docCount: 0 },
  { id: "financial", name: "Financial Records", icon: <Wallet aria-hidden="true" size={18} />, docCount: 0 },
  { id: "property", name: "Property Deeds", icon: <Home aria-hidden="true" size={18} />, docCount: 0 },
  { id: "insurance", name: "Insurance Policies", icon: <Shield aria-hidden="true" size={18} />, docCount: 0 },
  { id: "digital", name: "Digital Assets", icon: <Key aria-hidden="true" size={18} />, docCount: 0 },
  { id: "poa", name: "Powers of Attorney", icon: <UserCheck aria-hidden="true" size={18} />, docCount: 0 },
  { id: "trusts", name: "Trust Deeds", icon: <FileText aria-hidden="true" size={18} />, docCount: 0 },
  { id: "personal", name: "Personal Documents", icon: <Fingerprint aria-hidden="true" size={18} />, docCount: 0 },
];

const MOCK_AUDIT_TRAIL: AuditEvent[] = [
  { id: "ae-1", timestamp: "2026-05-20T09:14:00Z", action: "Document viewed", actor: "J. Okafor", detail: "Viewed will dated 2024-03-15" },
  { id: "ae-2", timestamp: "2026-05-19T16:42:00Z", action: "Contact added", actor: "System", detail: "Trusted contact A. Thompson added" },
  { id: "ae-3", timestamp: "2026-05-18T11:05:00Z", action: "Document uploaded", actor: "J. Okafor", detail: "Property deed - Lagos residence" },
  { id: "ae-4", timestamp: "2026-05-17T08:30:00Z", action: "Encryption verified", actor: "System", detail: "Vault integrity check passed" },
  { id: "ae-5", timestamp: "2026-05-16T14:20:00Z", action: "Access granted", actor: "Admin", detail: "Read access granted to M. Williams" },
];

const RELEASE_CONDITION_OPTIONS = [
  { value: "on_death", label: "On verified death" },
  { value: "on_incapacity", label: "On incapacity" },
  { value: "immediate", label: "Immediate" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "spouse", label: "Spouse" },
  { value: "child", label: "Child" },
  { value: "sibling", label: "Sibling" },
  { value: "parent", label: "Parent" },
  { value: "solicitor", label: "Solicitor" },
  { value: "executor", label: "Executor" },
  { value: "trustee", label: "Trustee" },
  { value: "other", label: "Other" },
];

const releaseConditionLabel: Record<string, string> = {
  on_death: "On verified death",
  on_incapacity: "On incapacity",
  immediate: "Immediate",
};

/* ---------- Component ---------- */

export function VaultManager() {
  const { workspace } = useMatterContext();

  /* Document categories - derive counts from workspace documents by title keyword match */
  const categories: DocumentCategory[] = INITIAL_CATEGORIES.map((cat) => {
    const docs = workspace?.documents ?? [];
    let count = 0;
    if (docs.length > 0) {
      count = docs.filter((d) =>
        d.title?.toLowerCase().includes(cat.id) ||
        d.title?.toLowerCase().includes(cat.name.toLowerCase()),
      ).length;
    }
    return { ...cat, docCount: count };
  });

  const totalDocs = categories.reduce((sum, c) => sum + c.docCount, 0);

  /* Trusted contacts */
  const [contacts, setContacts] = useState<TrustedContact[]>([
    { id: "tc-1", name: "Angela Thompson", email: "a.thompson@example.com", relationship: "Solicitor", releaseCondition: "on_death", status: "active" },
    { id: "tc-2", name: "Michael Williams", email: "m.williams@example.com", relationship: "Executor", releaseCondition: "on_death", status: "active" },
  ]);

  const [showAddContact, setShowAddContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    relationship: "spouse",
    releaseCondition: "on_death",
  });

  /* Dead-Man's Switch */
  const [deadManSwitch, setDeadManSwitch] = useState(false);

  function updateContactField<K extends keyof typeof contactForm>(key: K, value: (typeof contactForm)[K]) {
    setContactForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetContactForm() {
    setContactForm({ name: "", email: "", relationship: "spouse", releaseCondition: "on_death" });
  }

  function submitContact(e: React.FormEvent) {
    e.preventDefault();
    const newContact: TrustedContact = {
      id: `tc-${Date.now()}`,
      name: contactForm.name,
      email: contactForm.email,
      relationship: RELATIONSHIP_OPTIONS.find((r) => r.value === contactForm.relationship)?.label ?? contactForm.relationship,
      releaseCondition: contactForm.releaseCondition as TrustedContact["releaseCondition"],
      status: "pending",
    };
    setContacts((prev) => [...prev, newContact]);
    setShowAddContact(false);
    resetContactForm();
  }

  return (
    <div className="content-grid">
      {/* Vault overview */}
      <section className="panel span-2">
        <div className="panel-header">
          <h3><FolderLock aria-hidden="true" size={16} /> Document Vault</h3>
          <StatusBadge status={`${totalDocs} documents`} variant="default" />
        </div>
        <div className="metric-grid">
          <div className="metric">
            <span>Total documents</span>
            <strong>{totalDocs}</strong>
          </div>
          <div className="metric">
            <span>Categories</span>
            <strong>{categories.length}</strong>
          </div>
          <div className="metric">
            <span>Encryption</span>
            <strong className="text-success">AES-256</strong>
          </div>
          <div className="metric">
            <span>Trusted contacts</span>
            <strong>{contacts.length}</strong>
          </div>
        </div>
      </section>

      {/* Document categories grid */}
      <section className="panel span-2">
        <div className="panel-header">
          <h3><Archive aria-hidden="true" size={16} /> Document categories</h3>
        </div>
        <div className="metric-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {categories.map((cat) => (
            <div key={cat.id} className="metric" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "1rem" }}>
              {cat.icon}
              <strong style={{ fontSize: "0.9em", textAlign: "center" }}>{cat.name}</strong>
              <span>{cat.docCount} document{cat.docCount !== 1 ? "s" : ""}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8em", opacity: 0.7 }}>
                <Lock aria-hidden="true" size={12} /> Encrypted
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Trusted contacts */}
      <section className="panel">
        <div className="panel-header">
          <h3><Users aria-hidden="true" size={16} /> Trusted Contacts</h3>
          <button type="button" onClick={() => setShowAddContact(true)}>
            <Plus aria-hidden="true" size={14} /> Add Trusted Contact
          </button>
        </div>

        {contacts.length === 0 ? (
          <p style={{ padding: "1rem", opacity: 0.7 }}>No trusted contacts configured. Add contacts who should receive access to your vault under specific conditions.</p>
        ) : (
          <ul className="compact-list">
            {contacts.map((contact) => (
              <li key={contact.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <UserCheck aria-hidden="true" size={14} />
                  <div>
                    <strong>{contact.name}</strong>
                    <em style={{ display: "block", fontSize: "0.85em" }}>{contact.email}</em>
                  </div>
                </div>
                <span style={{ fontSize: "0.85em" }}>{contact.relationship}</span>
                <StatusBadge status={releaseConditionLabel[contact.releaseCondition] ?? contact.releaseCondition} variant="default" />
                <StatusBadge status={contact.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Dead-Man's Switch */}
      <section className="panel">
        <div className="panel-header">
          <h3><Timer aria-hidden="true" size={16} /> Dead-Man's Switch</h3>
          <StatusBadge status={deadManSwitch ? "Active" : "Inactive"} variant={deadManSwitch ? "success" : "default"} />
        </div>
        <div style={{ padding: "0.75rem 0" }}>
          <label className="form-field__checkbox-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={deadManSwitch}
              onChange={(e) => setDeadManSwitch(e.target.checked)}
            />
            <span>Enable Dead-Man's Switch</span>
          </label>
          <p style={{ marginTop: "0.75rem", fontSize: "0.9em", opacity: 0.8 }}>
            When enabled, the system will periodically request a check-in from you. If you fail to respond within the
            configured grace period (default: 90 days), your trusted contacts will automatically receive access to the
            vault according to their release conditions. This ensures your digital estate is accessible even if you
            become incapacitated or pass away unexpectedly.
          </p>
          {deadManSwitch && (
            <div className="metric-grid" style={{ marginTop: "0.75rem" }}>
              <div className="metric">
                <span>Check-in interval</span>
                <strong>30 days</strong>
              </div>
              <div className="metric">
                <span>Grace period</span>
                <strong>90 days</strong>
              </div>
              <div className="metric">
                <span>Last check-in</span>
                <strong>Today</strong>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Audit trail */}
      <section className="panel span-2">
        <div className="panel-header">
          <h3><Eye aria-hidden="true" size={16} /> Recent access activity</h3>
          <StatusBadge status={`${MOCK_AUDIT_TRAIL.length} events`} variant="default" />
        </div>
        <ul className="compact-list">
          {MOCK_AUDIT_TRAIL.map((event) => (
            <li key={event.id}>
              <strong style={{ minWidth: 140 }}>{event.action}</strong>
              <span style={{ flex: 1 }}>{event.detail}</span>
              <em style={{ fontSize: "0.85em", whiteSpace: "nowrap" }}>
                {event.actor} &middot; {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </em>
            </li>
          ))}
        </ul>
      </section>

      {/* Add trusted contact modal */}
      <Modal open={showAddContact} titleKey="Add Trusted Contact" onClose={() => { setShowAddContact(false); resetContactForm(); }}>
        <form className="form-stack" onSubmit={submitContact}>
          <FormField
            name="contactName"
            labelKey="Full name"
            value={contactForm.name}
            required
            onChange={(value) => updateContactField("name", value)}
          />
          <FormField
            name="contactEmail"
            labelKey="Email address"
            value={contactForm.email}
            type="email"
            required
            onChange={(value) => updateContactField("email", value)}
          />
          <div className="form-row">
            <FormSelect
              name="contactRelationship"
              labelKey="Relationship"
              value={contactForm.relationship}
              options={RELATIONSHIP_OPTIONS}
              onChange={(value) => updateContactField("relationship", value)}
            />
            <FormSelect
              name="releaseCondition"
              labelKey="Release condition"
              value={contactForm.releaseCondition}
              options={RELEASE_CONDITION_OPTIONS}
              onChange={(value) => updateContactField("releaseCondition", value)}
            />
          </div>
          <p style={{ fontSize: "0.85em", opacity: 0.7, marginTop: "0.25rem" }}>
            The release condition determines when this contact will gain access to the vault documents.
            "On verified death" requires an official death certificate to be uploaded. "On incapacity" requires
            a medical assessment. "Immediate" grants access right away.
          </p>
          <FormActions
            onCancel={() => { setShowAddContact(false); resetContactForm(); }}
            submitLabelKey="Add contact"
          />
        </form>
      </Modal>
    </div>
  );
}
