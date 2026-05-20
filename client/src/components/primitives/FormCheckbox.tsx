import { T } from "./T";

interface Props {
  name: string;
  labelKey: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function FormCheckbox({ name, labelKey, checked, onChange }: Props) {
  const id = `field-${name}`;
  return (
    <div className="form-field form-field--checkbox">
      <label className="form-field__checkbox-label" htmlFor={id}>
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <T k={labelKey} />
      </label>
    </div>
  );
}
