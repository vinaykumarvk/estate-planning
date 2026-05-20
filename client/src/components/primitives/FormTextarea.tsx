import { T } from "./T";

interface Props {
  name: string;
  labelKey: string;
  value: string;
  error?: string;
  required?: boolean;
  rows?: number;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export function FormTextarea({ name, labelKey, value, error, required, rows = 3, onChange, onBlur }: Props) {
  const id = `field-${name}`;
  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={id}>
        <T k={labelKey} />{required && <span aria-hidden="true"> *</span>}
      </label>
      <textarea
        id={id}
        name={name}
        className={`form-field__textarea${error ? " form-field__input--error" : ""}`}
        value={value}
        rows={rows}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {error && <span id={`${id}-error`} className="form-field__error" role="alert">{error}</span>}
    </div>
  );
}
