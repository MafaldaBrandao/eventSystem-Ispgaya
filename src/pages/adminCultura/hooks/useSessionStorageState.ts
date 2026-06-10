import { useState, useEffect, useCallback } from 'react';

/**
 * Hook that syncs React state with sessionStorage.
 * Ensures state is always consistent with sessionStorage value.
 */
export function useSessionStorageState(
  key: string,
  initialValue: string = ''
): [string, (value: string) => void] {
  const [state, setState] = useState<string>(() => {
    if (typeof window === 'undefined') return initialValue;
    const stored = sessionStorage.getItem(key);
    return stored !== null ? stored : initialValue;
  });

  // Sync from sessionStorage on mount and periodically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial sync in case sessionStorage changed while component was not mounted
    const stored = sessionStorage.getItem(key);
    if (stored === null) {
      if (state !== initialValue) {
        setState(initialValue);
      }
    } else if (stored !== state) {
      setState(stored);
    }

    // Listen for sessionStorage changes from the same tab
    const handleStorageChange = () => {
      const stored = sessionStorage.getItem(key);
      if (stored === null) {
        if (state !== initialValue) {
          setState(initialValue);
        }
        return;
      }

      if (stored !== state) {
        setState(stored);
      }
    };

    // Check for changes on every render event
    window.addEventListener('storage', handleStorageChange);

    // Also poll for changes within the same tab (storage event doesn't fire within same tab)
    const interval = setInterval(() => {
      const stored = sessionStorage.getItem(key);
      setState(stored !== null ? stored : initialValue);
    }, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [key, state]);

  // When setting state, also update sessionStorage
  const setValue = useCallback(
    (value: string) => {
      if (typeof window === 'undefined') return;
      setState(value);
      if (value) {
        sessionStorage.setItem(key, value);
      } else {
        sessionStorage.removeItem(key);
      }
    },
    [initialValue, key]
  );

  return [state, setValue];
}
