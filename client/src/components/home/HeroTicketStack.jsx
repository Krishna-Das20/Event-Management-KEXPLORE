import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { MapPin } from 'lucide-react';
import { CategoryChip } from '@/components/ui/Badge';
import { Countdown } from '@/components/ui/Countdown';
import { Punches } from '@/components/events/EventCard';
import { formatEventWhen, formatPrice } from '@/lib/format';
import { sized } from '@/lib/image';
import { cn } from '@/lib/cn';

// Each card sits at its own depth (z) — inside preserve-3d, z-index is ignored and
// coplanar cards would z-fight. Cards stay fully opaque (back cards are dimmed with a
// brightness filter instead) so nothing ever shows through while the deck reshuffles.
// `opacity: 1` must stay in every position: cards enter from `initial.opacity: 0`.
const POSITIONS = [
  { x: 0, y: 0, z: 0, rotate: -4, scale: 1, opacity: 1, filter: 'brightness(1)' },
  { x: 46, y: -26, z: -70, rotate: 4, scale: 0.95, opacity: 1, filter: 'brightness(0.82)' },
  { x: 88, y: -50, z: -140, rotate: 11, scale: 0.9, opacity: 1, filter: 'brightness(0.64)' },
];

/** Decorative barcode made from a deterministic stripe pattern. */
function Barcode({ seed = '' }) {
  const bars = [...(seed + 'encore-events')].slice(0, 28).map((c) => (c.charCodeAt(0) % 3) + 1);
  return (
    <div className="flex h-8 items-stretch gap-[2px]" aria-hidden>
      {bars.map((w, i) => (
        <span key={i} className="bg-fg" style={{ width: w }} />
      ))}
    </div>
  );
}

function HeroTicket({ event, active }) {
  return (
    <Link
      to={`/events/${event.slug}`}
      tabIndex={active ? 0 : -1}
      aria-hidden={!active}
      className="block overflow-hidden rounded-[30px] border border-line bg-surface shadow-[0_30px_80px_-30px_rgb(0_0_0/0.55)] [--punch:var(--bg)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={sized(event.image, 760)} alt="" className="size-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
        <CategoryChip category={event.category} variant="image" className="absolute top-4 left-4" />
        <span className="absolute top-4 right-4 rounded-full bg-accent px-3 py-1.5 font-mono text-xs font-bold text-accent-fg">
          {formatPrice(event.price)}
        </span>
        <div className="absolute right-5 bottom-4 left-5 text-white">
          <h3 className="font-display text-[1.7rem] leading-[1.02] font-bold tracking-[-0.03em] text-balance">{event.title}</h3>
        </div>
      </div>
      <Punches />
      <div className="space-y-4 p-5 pt-6">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium">{formatEventWhen(event.startDate, event.endDate)}</span>
          <span className="inline-flex items-center gap-1 text-muted">
            <MapPin className="size-3.5" />
            {event.venue?.city}
          </span>
        </div>
        <Countdown target={event.startDate} end={event.endDate} size="md" className="justify-between gap-1 sm:gap-1" />
        <div className="flex items-end justify-between border-t border-dashed border-line-strong pt-4">
          <Barcode seed={event.slug} />
          <span className="font-mono text-[10px] tracking-[0.2em] text-muted">ADMIT ONE</span>
        </div>
      </div>
    </Link>
  );
}

/** A 3D-tilting deck of featured tickets that shuffles itself every few seconds. */
export function HeroTicketStack({ events }) {
  const [order, setOrder] = useState(() => events.map((_, i) => i));
  const [paused, setPaused] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), { stiffness: 160, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 160, damping: 18 });

  useEffect(() => {
    if (paused || events.length < 2) return;
    const id = setInterval(() => setOrder((o) => [...o.slice(1), o[0]]), 4800);
    return () => clearInterval(id);
  }, [paused, events.length]);

  if (!events.length) return null;

  const onPointerMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <div
      className="relative mx-auto h-[600px] w-full max-w-[460px] [perspective:1400px] sm:h-[640px]"
      onPointerMove={onPointerMove}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
        setPaused(false);
      }}
    >
      <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }} className="relative size-full">
        {order.slice(0, 3).map((eventIndex, position) => {
          const event = events[eventIndex];
          const p = POSITIONS[position];
          return (
            <motion.div
              key={event.slug}
              className="absolute top-10 left-0 w-[min(360px,82vw)] origin-bottom-left"
              style={{ zIndex: 3 - position }}
              initial={{ opacity: 0, y: 80, rotate: -12 }}
              animate={p}
              transition={{ type: 'spring', stiffness: 170, damping: 24, mass: 0.9 }}
            >
              <HeroTicket event={event} active={position === 0} />
            </motion.div>
          );
        })}
      </motion.div>

      <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-2" role="tablist" aria-label="Featured events">
        {events.slice(0, 3).map((e, i) => (
          <button
            key={e.slug}
            role="tab"
            aria-selected={order[0] === i}
            aria-label={`Show ${e.title}`}
            onClick={() => setOrder((o) => [i, ...o.filter((x) => x !== i)])}
            className={cn('h-1.5 rounded-full transition-all duration-500', order[0] === i ? 'w-8 bg-fg' : 'w-3 bg-line-strong hover:bg-muted')}
          />
        ))}
      </div>
    </div>
  );
}
