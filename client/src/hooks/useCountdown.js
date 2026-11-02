import { useEffect, useState } from 'react';

const split = (ms) => {
  const total = Math.max(0, ms);
  return {
    total,
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total / 3_600_000) % 24),
    minutes: Math.floor((total / 60_000) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
};

/**
 * Live countdown to `target`. Ticks every second (aligned to the wall clock),
 * pauses when the tab is hidden, and reports whether the moment has passed.
 */
export function useCountdown(target) {
  const time = new Date(target).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!Number.isFinite(time)) return;
    let timeout;
    const tick = () => {
      setNow(Date.now());
      if (Date.now() < time) timeout = setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    const onVisibility = () => {
      clearTimeout(timeout);
      if (!document.hidden) tick();
    };
    tick();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [time]);

  const parts = split(time - now);
  return { ...parts, done: parts.total === 0 };
}
