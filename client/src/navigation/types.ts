import type { LucideIcon } from "lucide-react";

export type NavSection =
  | "dashboard"
  | "matters"
  | "clients"
  | "estate"
  | "documents"
  | "compliance"
  | "reports"
  | "collaboration"
  | "administration"
  | "probate"
  | "vault"
  | "settings";

export type SubPage = string;

export type UserRole = "viewer" | "editor" | "admin" | "compliance";

export type NavGroupKey = "core" | "planning" | "oversight" | "operations" | "system";

export interface NavItem {
  section: NavSection;
  labelKey: string;
  icon: LucideIcon;
  requiredRole?: UserRole[];
  matterRequired?: boolean;
}

export interface NavGroup {
  key: NavGroupKey;
  labelKey: string;
  items: NavItem[];
}

export interface SubPageDef {
  key: string;
  labelKey: string;
}

export interface BreadcrumbSegment {
  label: string;
  section?: NavSection;
  subPage?: string;
}
