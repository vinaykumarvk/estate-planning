import { useCallback, useState } from "react";
import type { ZodSchema, ZodError } from "zod";

export interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  handleChange: (field: keyof T, value: unknown) => void;
  handleBlur: (field: keyof T) => void;
  validate: () => boolean;
  reset: (next?: Partial<T>) => void;
  setValues: React.Dispatch<React.SetStateAction<T>>;
}

export function useFormState<T extends Record<string, unknown>>(
  schema: ZodSchema<T>,
  initial: T
): FormState<T> {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = useCallback((field: keyof T, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleBlur = useCallback((field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validate = useCallback((): boolean => {
    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors: Partial<Record<keyof T, string>> = {};
    for (const issue of (result.error as ZodError).issues) {
      const key = issue.path[0] as keyof T;
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    setErrors(fieldErrors);
    return false;
  }, [schema, values]);

  const reset = useCallback(
    (next?: Partial<T>) => {
      setValues(next ? { ...initial, ...next } : initial);
      setErrors({});
      setTouched({});
    },
    [initial]
  );

  return { values, errors, touched, handleChange, handleBlur, validate, reset, setValues };
}
