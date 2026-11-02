import { createContext, useContext, useEffect, useState } from 'react';
import Lenis from 'lenis';

const LenisContext = createContext(null);

/** Buttery inertial scrolling (disabled for users who prefer reduced motion and on touch devices). */
export function SmoothScroll({ children }) {
  const [lenis, setLenis] = useState(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const instance = new Lenis({ autoRaf: true, lerp: 0.11, wheelMultiplier: 1, anchors: { offset: -90 } });
    setLenis(instance);
    return () => {
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLenis = () => useContext(LenisContext);

/** Scroll to top/element, using Lenis when available. */
// eslint-disable-next-line react-refresh/only-export-components
export function scrollToTarget(lenis, target = 0, options = {}) {
  if (lenis) lenis.scrollTo(target, { offset: -90, ...options });
  else if (typeof target === 'number') window.scrollTo({ top: target, behavior: options.immediate ? 'instant' : 'smooth' });
  else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView({ behavior: 'smooth' });
}
