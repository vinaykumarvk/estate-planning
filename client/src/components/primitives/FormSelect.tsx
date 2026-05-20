import { useTranslation } from "react-i18next";
import { T } from "./T";

interface Props {
  name: string;
  labelKey: string;
  value: string;
  options: Array<{ value: string; labelKey?: string; label?: string }>;
  error?: string;
  required?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export function FormSelect({ name, labelKey, value, options, error, required, onChange, onBlur }: Props) {
  const { t } = useTranslation();
  const id = `field-${name}`;
  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={id}>
        <T k={labelKey} />{required && <span aria-hidden="true"> *</span>}
      </label>
      <select
        id={id}
        name={name}
        className={`form-field__select${error ? " form-field__input--error" : ""}`}
        value={value}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      >
        <option value="">{t("common.select")}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label ?? t(opt.labelKey!)}</option>
        ))}
      </select>
      {error && <span id={`${id}-error`} className="form-field__error" role="alert">{error}</span>}
    </div>
  );
}
