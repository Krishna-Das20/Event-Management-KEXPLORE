import { Link } from 'react-router';
import { ArrowRight, MapPin, Users } from 'lucide-react';
import { CategoryChip } from '@/components/ui/Badge';
import { Countdown } from '@/components/ui/Countdown';
import { SaveButton } from './SaveButton';
import { dateParts, formatCompact, formatPrice, formatTime } from '@/lib/format';
import { sized } from '@/lib/image';
import { cn } from '@/lib/cn';

/** Horizontal ticket used in list view. */
export function EventRow({ event }) {
  const { day, month, weekday } = dateParts(event.startDate);
  const ended = event.status === 'ended';
  return (
    <article className="group relative">
      <Link
        to={`/events/${event.slug}`}
        className="flex flex-col overflow-hidden rounded-[24px] border border-line bg-surface shadow-card transition duration-500 hover:border-line-strong sm:flex-row"
      >
        <div className="relative aspect-[16/9] shrink-0 overflow-hidden sm:aspect-auto sm:w-64">
          <img
            src={sized(event.image, 520)}
            alt=""
            loading="lazy"
            decoding="async"
            className={cn('size-full object-cover transition duration-700 group-hover:scale-105', ended && 'grayscale-[0.7]')}
          />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryChip category={event.category} />
            {event.status === 'sold-out' && <span className="text-xs font-semibold text-danger">Sold out</span>}
          </div>
          <h3 className="font-display text-xl leading-tight font-bold tracking-tight">{event.title}</h3>
          <p className="line-clamp-1 text-sm text-muted">{event.tagline}</p>
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-sm text-fg-2">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-muted" /> {event.venue?.city}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4 text-muted" /> {formatCompact(event.registeredCount)} going
            </span>
          </div>
        </div>
        <div className="relative flex shrink-0 items-center justify-between gap-4 border-t border-dashed border-line-strong p-5 sm:w-52 sm:flex-col sm:items-stretch sm:justify-center sm:border-t-0 sm:border-l">
          <div>
            <div className="font-mono text-xs tracking-[0.15em] text-muted">
              {weekday.toUpperCase()} · {month}
            </div>
            <div className="font-display text-4xl leading-none font-bold">{day}</div>
            <div className="mt-1 text-xs text-muted">{formatTime(event.startDate)}</div>
          </div>
          <div className="space-y-2 text-right sm:text-left">
            <div className="font-mono text-lg font-bold">{formatPrice(event.price)}</div>
            {!ended && <Countdown target={event.startDate} size="sm" className="text-muted" />}
            <span className="hidden items-center gap-1 text-sm font-semibold sm:inline-flex">
              View <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
      <SaveButton event={event} className="absolute top-3 right-3 z-10 sm:left-3 sm:right-auto" />
    </article>
  );
}

export function EventRowSkeleton() {
  return <div className="skeleton h-44 rounded-[24px]" aria-hidden />;
}
