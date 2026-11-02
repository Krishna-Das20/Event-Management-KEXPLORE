import { useState } from 'react';
import { initials } from '@/lib/format';
import { cn } from '@/lib/cn';

const PALETTE = ['#d2ff3a', '#ff4d8d', '#2fc7f0', '#ffa920', '#b57bff', '#2fcf8f', '#ff7a45', '#6e8bff'];

const hash = (s = '') => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Image avatar with a deterministic gradient + initials fallback. */
export function Avatar({ name = '', src, className }) {
  const [failed, setFailed] = useState(false);
  const h = hash(name);
  const a = PALETTE[h % PALETTE.length];
  const b = PALETTE[(h >> 3) % PALETTE.length];

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn('size-10 shrink-0 rounded-full object-cover ring-1 ring-line', className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn('grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold text-black ring-1 ring-line', className)}
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      {initials(name)}
    </span>
  );
}
