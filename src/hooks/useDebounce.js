import { useState, useEffect } from 'react';

/**
 * useDebounce hook
 * Delays updating the debounced value until after delayMs of inactivity.
 * @param {any} value - Value to debounce
 * @param {number} delayMs - Delay in milliseconds
 * @returns {any} Debounced value
 */
export function useDebounce(value, delayMs = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
