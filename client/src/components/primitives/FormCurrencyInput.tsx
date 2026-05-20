import { T } from "./T";

interface Props {
  name: string;
  labelKey: string;
  value: number;
  currency?: string;
  error?: string;
  required?: boolean;
  onChange: (value: number) => void;
  onBlur?: () => void;
}

export function FormCurrencyInput({ name, labelKey, value, currency = "NGN", error, required, onChange, onBlur }: Props) {
  const id = `field-${name}`;
  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={id}>
        <T k={labelKey} />{required && <span aria-hidden="true"> *</span>}
      </label>
      <div className="form-field__currency-wrap">
        <span className="form-field__currency-prefix">{currency}</span>
        <input
          id={id}
          name={name}
          type="number"
          min="0"
          step="0.01"
          className={`form-field__input form-field__input--currency${error ? " form-field__input--error" : ""}`}
          value={value || ""}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          onBlur={onBlur}
        />
      </div>
      {error && <span id={`${id}-error`} className="form-field__error" role="alert">{error}</span>}
    </div>
  );
}
