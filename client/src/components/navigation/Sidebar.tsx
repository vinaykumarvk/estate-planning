import { ChevronsLeft, ChevronsRight, Scale } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigation, NAV_GROUPS } from "../../navigation";
import { T } from "../primitives/T";
import type { BootstrapPayload } from "../../lib/api";

interface SidebarProps {
  tenantName?: string;
  navOpen: boolean;
  onNavClose: () => void;
}

export function Sidebar({ tenantName, navOpen, onNavClose }: SidebarProps) {
  const { t } = useTranslation();
  const { section, sidebarCollapsed, setSidebarCollapsed, navigateTo, isVisible } = useNavigation();

  return (
    <aside className={`sidebar ${navOpen ? "open" : ""} ${sidebarCollapsed ? "sidebar--collapsed" : ""}`}>
      <div className="brand-block">
        <Scale aria-hidden="true" />
        {!sidebarCollapsed && (
          <div>
            <strong><T k="nav.brand" /></strong>
            <span>{tenantName ?? t("common.loading")}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        className="sidebar-collapse-toggle"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        aria-label={sidebarCollapsed ? t("nav.expand_sidebar") : t("nav.collapse_sidebar")}
      >
        {sidebarCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
      </button>

      <nav className="nav-sections" aria-label={t("nav.workspace_sections")}>
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => isVisible(item.requiredRole));
          if (visibleItems.length === 0) return null;

          return (
            <div className="nav-group" key={group.key}>
              {!sidebarCollapsed && (
                <span className="nav-group__label"><T k={group.labelKey} /></span>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = section === item.section;
                return (
                  <button
                    key={item.section}
                    type="button"
                    className={`nav-item ${isActive ? "nav-item--active" : ""}`}
                    onClick={() => {
                      navigateTo(item.section);
                      onNavClose();
                    }}
                    title={sidebarCollapsed ? t(item.labelKey) : undefined}
                  >
                    <Icon aria-hidden="true" size={18} />
                    {!sidebarCollapsed && <span><T k={item.labelKey} /></span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
