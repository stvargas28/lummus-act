import { useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface Result<T> {
  key: string;
  data: T | null;
  error: Error | null;
}

/**
 * Generic async fetcher used by data hooks.
 *
 * - Loading is *derived* (current key vs last-resolved key) so we never
 *   setState synchronously inside the data-fetch effect.
 * - The function is read via ref kept in sync with the latest closure inside
 *   a separate effect (refs cannot be written during render). The data-fetch
 *   effect refires only when `key` changes.
 */
export function useAsync<T>(fn: () => Promise<T>, key: string): AsyncState<T> {
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  });

  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fnRef
      .current()
      .then((data) => {
        if (!cancelled) setResult({ key, data, error: null });
      })
      .catch((error: Error) => {
        if (!cancelled) setResult({ key, data: null, error });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const loading = result === null || result.key !== key;
  return {
    data: loading ? null : result!.data,
    loading,
    error: loading ? null : result!.error,
  };
}
