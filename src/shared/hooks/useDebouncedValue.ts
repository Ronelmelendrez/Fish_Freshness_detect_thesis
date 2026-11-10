import { useEffect, useState } from 'react';

/**
 * Debounces a rapidly-changing value. Returns the latest settled value once
 * it has not changed for `delay` ms.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}