import { useEffect, useState } from 'react';

/**
 * useState backed by localStorage. Reads the key once on init and writes on
 * every change. Robust to private-mode / quota / parse errors (falls back to
 * the default rather than throwing). Replaces the repeated
 * useState(() => JSON.parse(localStorage…)) + useEffect(setItem) pattern.
 */
export function usePersistentState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore write failures (private mode, quota exceeded).
    }
  }, [key, value]);

  return [value, setValue];
}
