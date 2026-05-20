import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_SUB_PAGE, NAV_GROUPS } from "./constants";
import type { BreadcrumbSegment, NavSection, UserRole } from "./types";

interface NavigationState {
  section: NavSection;
  subPage: string;
  sidebarCollapsed: boolean;
  breadcrumbs: BreadcrumbSegment[];
  userRole: UserRole;
  navigateTo: (section: NavSection, subPage?: string) => void;
  setSubPage: (subPage: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setBreadcrumbs: (segments: BreadcrumbSegment[]) => void;
  setUserRole: (role: UserRole) => void;
  isVisible: (requiredRole?: UserRole[]) => boolean;
}

const NavigationContext = createContext<NavigationState | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [section, setSectionState] = useState<NavSection>("dashboard");
  const [subPage, setSubPageState] = useState<string>(DEFAULT_SUB_PAGE.dashboard);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbSegment[]>([]);
  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem("estate-user-role") as UserRole) || "admin";
  });

  const navigateTo = useCallback((newSection: NavSection, newSubPage?: string) => {
    setSectionState(newSection);
    setSubPageState(newSubPage ?? DEFAULT_SUB_PAGE[newSection]);
  }, []);

  const setSubPage = useCallback((sp: string) => {
    setSubPageState(sp);
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, []);

  const setUserRole = useCallback((role: UserRole) => {
    setUserRoleState(role);
    localStorage.setItem("estate-user-role", role);
  }, []);

  const isVisible = useCallback((requiredRole?: UserRole[]) => {
    if (!requiredRole || requiredRole.length === 0) return true;
    return requiredRole.includes(userRole);
  }, [userRole]);

  const value = useMemo<NavigationState>(() => ({
    section,
    subPage,
    sidebarCollapsed,
    breadcrumbs,
    userRole,
    navigateTo,
    setSubPage,
    setSidebarCollapsed,
    setBreadcrumbs,
    setUserRole,
    isVisible,
  }), [section, subPage, sidebarCollapsed, breadcrumbs, userRole, navigateTo, setSubPage, setSidebarCollapsed, setBreadcrumbs, setUserRole, isVisible]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationState {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used within NavigationProvider");
  return ctx;
}

export { NAV_GROUPS };
