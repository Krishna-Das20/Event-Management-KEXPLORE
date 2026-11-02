import { useEffect, useRef, useState } from 'react';
import { animate, useInView } from 'motion/react';

/** Animates a number from 0 → value the first time it scrolls into view. */
export function CountUp({ value = 0, duration = 1.8, format = (n) => n.toLocaleString('en-IN'), className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}
