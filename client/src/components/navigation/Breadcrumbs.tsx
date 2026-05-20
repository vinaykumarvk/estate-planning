import { ChevronRight } from "lucide-react";
import { useNavigation } from "../../navigation";

export function Breadcrumbs() {
  const { breadcrumbs, navigateTo } = useNavigation();

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {breadcrumbs.map((segment, i) => {
        const isLast = i === breadcrumbs.length - 1;
        return (
          <span key={i} className="breadcrumbs__segment">
            {i > 0 && <ChevronRight size={14} className="breadcrumbs__separator" aria-hidden="true" />}
            {isLast || (!segment.section) ? (
              <span className="breadcrumbs__current" aria-current={isLast ? "page" : undefined}>{segment.label}</span>
            ) : (
              <button
                type="button"
                className="breadcrumbs__link"
                onClick={() => navigateTo(segment.section!, segment.subPage)}
              >
                {segment.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
