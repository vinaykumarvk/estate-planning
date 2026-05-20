import { useTranslation } from "react-i18next";

interface Step {
  key: string;
  label?: string;
  labelKey?: string;
}

interface Props {
  steps: Step[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, currentIndex, onStepClick }: Props) {
  const { t } = useTranslation();
  return (
    <nav className="stepper" aria-label="Progress">
      {steps.map((step, i) => {
        const state = i < currentIndex ? "completed" : i === currentIndex ? "current" : "upcoming";
        return (
          <button
            key={step.key}
            type="button"
            className={`stepper__step stepper__step--${state}`}
            aria-current={state === "current" ? "step" : undefined}
            onClick={() => onStepClick?.(i)}
            disabled={!onStepClick}
          >
            <span className="stepper__number">{i + 1}</span>
            <span className="stepper__label">{step.labelKey ? t(step.labelKey) : step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
