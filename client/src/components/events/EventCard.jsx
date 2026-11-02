import { Link } from 'react-router';
import { ArrowUpRight, Clock, MapPin, Wifi } from 'lucide-react';
import { CategoryChip } from '@/components/ui/Badge';
import { Countdown } from '@/components/ui/Countdown';
import { SaveButton } from './SaveButton';
import { SeatsMeter } from './SeatsMeter';
import { useSpotlight } from '@/hooks/useSpotlight';
import { dateParts, formatPrice, formatTime } from '@/lib/format';
import { sized, srcSet } from '@/lib/image';
import { cn } from '@/lib/cn';

export function Punches({ className }) {
  return (
    <div className={cn('relative h-0', className)} aria-hidden>
      <span className="absolute -top-3 -left-3 size-6 rounded-full border border-line bg-[var(--punch,var(--bg))]" />
      <span className="absolute -top-3 -right-3 size-6 rounded-full border border-line bg-[var(--punch,var(--bg))]" />
      <div className="perforation-x mx-6" />
    </div>
  );
}

function StatusRibbon({ status }) {
  if (status === 'upcoming') return null;
  const map = {
    'sold-out': ['Sold out', 'bg-danger text-white'],
    ended: ['Ended', 'bg-black/70 text-white'],
    live: ['Live now', 'bg-success text-black'],
  };
  const [label, cls] = map[status] ?? [];
  return <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase', cls)}>{label}</span>;
}

/** Ticket-shaped event card used across the site. */
export function EventCard({ event, className, priority = false }) {
  const onPointerMove = useSpotlight();
  const { day, month, weekday } = dateParts(event.startDate);
  const ended = event.status === 'ended';

  return (
    <article className={cn('group relative h-full min-w-0', className)} onPointerMove={onPointerMove}>
      <Link
        to={`/events/${event.slug}`}
        className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-line bg-surface shadow-card transition duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 hover:border-line-strong"
      >
        <div className="spotlight pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative aspect-[16/11] overflow-hidden">
          <img
            src={sized(event.image, 640)}
            srcSet={srcSet(event.image, [400, 640, 900])}
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={cn(
              'size-full bg-surface-2 object-cover transition duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.06]',
              ended && 'grayscale-[0.7]',
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />

          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
            <CategoryChip category={event.category} variant="image" />
            <StatusRibbon status={event.status} />
          </div>

          <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between gap-3 text-white">
            <div className="flex items-center gap-3">
              <div className="grid min-w-14 place-items-center rounded-2xl bg-white px-2.5 py-1.5 text-black shadow-lg">
                <span className="font-mono text-[10px] font-semibold tracking-[0.15em]">{month}</span>
                <span className="font-display text-2xl leading-none font-bold">{day}</span>
              </div>
              <div className="text-xs leading-tight">
                <div className="font-semibold">{weekday}</div>
                <div className="text-white/75">{formatTime(event.startDate)}</div>
              </div>
            </div>
            <span className="rounded-full bg-accent px-3 py-1.5 font-mono text-xs font-bold text-accent-fg">{formatPrice(event.price)}</span>
          </div>
        </div>

        <Punches className="z-[2]" />

        <div className="relative z-[2] flex flex-1 flex-col gap-3 p-5 pt-6">
          <h3 className="font-display text-[1.35rem] leading-[1.1] font-bold tracking-[-0.03em] text-balance">{event.title}</h3>
          <p className="flex items-center gap-1.5 text-sm text-muted">
            {event.mode === 'online' ? <Wifi className="size-4 shrink-0" /> : <MapPin className="size-4 shrink-0" />}
            <span className="min-w-0 truncate">
              {event.venue?.name}
              {event.mode !== 'online' && ` · ${event.venue?.city}`}
            </span>
          </p>
          {event.tagline && <p className="line-clamp-2 text-sm text-fg-2/80">{event.tagline}</p>}

          <div className="mt-auto space-y-3 pt-2">
            {!ended && <SeatsMeter event={event} />}
            <div className="flex items-center justify-between border-t border-line pt-3">
              <span className="inline-flex items-center gap-1.5 text-muted">
                <Clock className="size-3.5" />
                {ended ? <span className="text-xs">Event ended</span> : <Countdown target={event.startDate} end={event.endDate} size="sm" />}
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold transition-transform group-hover:translate-x-0.5">
                {ended ? 'Recap' : 'Details'}
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" />
              </span>
            </div>
          </div>
        </div>
      </Link>
      <SaveButton event={event} className="absolute top-3 right-3 z-10" />
    </article>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-line bg-surface" aria-hidden>
      <div className="skeleton aspect-[16/11]" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-6 w-4/5 rounded-lg" />
        <div className="skeleton h-4 w-1/2 rounded-lg" />
        <div className="skeleton h-4 w-full rounded-lg" />
        <div className="skeleton mt-4 h-1.5 w-full rounded-full" />
        <div className="flex justify-between pt-2">
          <div className="skeleton h-4 w-24 rounded-lg" />
          <div className="skeleton h-4 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
