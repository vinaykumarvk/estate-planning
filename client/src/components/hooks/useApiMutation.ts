import { useCallback, useState } from "react";
import { api } from "../../lib/api";

interface MutationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  mutate: (path: string, body?: unknown, method?: string) => Promise<T | null>;
  reset: () => void;
}

export function useApiMutation<T = unknown>(): MutationState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (path: string, body?: unknown, method = "POST"): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await api<T>(path, {
        method,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
      setData(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, mutate, reset };
}
