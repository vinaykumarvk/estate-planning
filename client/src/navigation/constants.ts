import {
  BarChart3,
  Briefcase,
  FileSignature,
  LayoutDashboard,
  MessageSquare,
  PieChart,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import type { NavGroup, NavSection, SubPageDef } from "./types";

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "core",
    labelKey: "nav.group_core",
    items: [
      { section: "dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
      { section: "matters", labelKey: "nav.matters", icon: Briefcase },
      { section: "clients", labelKey: "nav.clients", icon: Users, matterRequired: true },
    ],
  },
  {
    key: "planning",
    labelKey: "nav.group_planning",
    items: [
      { section: "estate", labelKey: "nav.estate_analysis", icon: PieChart, matterRequired: true },
      { section: "documents", labelKey: "nav.documents", icon: FileSignature, matterRequired: true },
    ],
  },
  {
    key: "oversight",
    labelKey: "nav.group_oversight",
    items: [
      { section: "compliance", labelKey: "nav.compliance", icon: ShieldCheck, matterRequired: true },
      { section: "reports", labelKey: "nav.reports_analytics", icon: BarChart3 },
    ],
  },
  {
    key: "operations",
    labelKey: "nav.group_operations",
    items: [
      { section: "collaboration", labelKey: "nav.collaboration", icon: MessageSquare },
      { section: "administration", labelKey: "nav.administration", icon: Wrench },
    ],
  },
  {
    key: "system",
    labelKey: "nav.group_system",
    items: [
      { section: "settings", labelKey: "settings.title", icon: Settings },
    ],
  },
];

export const SUB_NAV: Record<NavSection, SubPageDef[]> = {
  dashboard: [
    { key: "overview", labelKey: "nav.sub.overview" },
    { key: "activity", labelKey: "nav.sub.activity" },
  ],
  matters: [
    { key: "list", labelKey: "nav.sub.matter_list" },
    { key: "intake", labelKey: "nav.sub.intake" },
    { key: "scoring", labelKey: "nav.sub.scoring" },
    { key: "consent", labelKey: "nav.sub.consent" },
  ],
  clients: [
    { key: "people", labelKey: "nav.sub.people" },
    { key: "domicile", labelKey: "nav.sub.domicile" },
    { key: "relationships", labelKey: "nav.sub.relationships" },
    { key: "goals", labelKey: "nav.sub.goals" },
  ],
  estate: [
    { key: "review", labelKey: "nav.sub.planning_review" },
    { key: "assets", labelKey: "nav.sub.assets" },
    { key: "balance", labelKey: "nav.sub.balance_sheet" },
    { key: "iht", labelKey: "nav.sub.iht" },
    { key: "faraid", labelKey: "nav.sub.faraid" },
    { key: "gifts", labelKey: "nav.sub.gifts" },
    { key: "scenarios", labelKey: "nav.sub.scenarios" },
  ],
  documents: [
    { key: "wills", labelKey: "nav.sub.wills" },
    { key: "assembly", labelKey: "nav.sub.assembly" },
    { key: "review", labelKey: "nav.sub.review" },
    { key: "signing", labelKey: "nav.sub.signing" },
    { key: "esignature", labelKey: "nav.sub.esignature" },
  ],
  compliance: [
    { key: "rule-scan", labelKey: "nav.sub.rule_scan" },
    { key: "conflict-of-laws", labelKey: "nav.sub.conflict_of_laws" },
    { key: "ai-monitors", labelKey: "nav.sub.ai_monitors" },
    { key: "upl-opinions", labelKey: "nav.sub.upl_opinions" },
    { key: "audit-trail", labelKey: "nav.sub.audit_trail" },
  ],
  reports: [
    { key: "operational", labelKey: "nav.sub.operational" },
    { key: "compliance-reports", labelKey: "nav.sub.compliance_reports" },
    { key: "tenant-analytics", labelKey: "nav.sub.tenant_analytics" },
    { key: "export-centre", labelKey: "nav.sub.export_centre" },
  ],
  collaboration: [
    { key: "messaging", labelKey: "nav.sub.messaging" },
    { key: "invitations", labelKey: "nav.sub.invitations" },
    { key: "notifications", labelKey: "nav.sub.notifications" },
  ],
  administration: [
    { key: "jurisdictions", labelKey: "nav.sub.jurisdictions" },
    { key: "taxonomy", labelKey: "nav.sub.taxonomy" },
    { key: "templates", labelKey: "nav.sub.templates" },
    { key: "packages", labelKey: "nav.sub.packages" },
    { key: "schema", labelKey: "nav.sub.schema" },
    { key: "release-gates", labelKey: "nav.sub.release_gates" },
  ],
  settings: [],
};

export const DEFAULT_SUB_PAGE: Record<NavSection, string> = {
  dashboard: "overview",
  matters: "list",
  clients: "people",
  estate: "review",
  documents: "wills",
  compliance: "rule-scan",
  reports: "operational",
  collaboration: "messaging",
  administration: "jurisdictions",
  settings: "",
};
