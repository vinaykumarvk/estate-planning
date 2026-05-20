import { T } from "./T";

interface Props {
  name: string;
  labelKey: string;
  value: string;
  error?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export function FormField({ name, labelKey, value, error, type = "text", required, placeholder, onChange, onBlur }: Props) {
  const id = `field-${name}`;
  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={id}>
        <T k={labelKey} />{required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        className={`form-field__input${error ? " form-field__input--error" : ""}`}
        value={value}
        placeholder={placeholder}
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
