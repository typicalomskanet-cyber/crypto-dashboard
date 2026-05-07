import { useEffect, useState } from "react";

/** localStorage-backed React state. Hydrates lazily on the client. */
export function useLocalState<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [v, setV] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* ignore — quota exceeded */
    }
  }, [key, v]);
  return [v, setV];
}
