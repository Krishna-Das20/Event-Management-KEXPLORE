import { useCallback } from 'react';

/** Returns an onPointerMove handler that feeds --mx / --my to a `.spotlight` layer. */
export function useSpotlight() {
  return useCallback((e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }, []);
}
