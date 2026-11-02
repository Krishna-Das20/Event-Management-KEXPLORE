import { Link } from 'react-router';
import { CircleAlert, Cloud, Clock3, MapPin, QrCode, Smartphone, Trash2, XCircle } from 'lucide-react';
import { CategoryChip } from '@/components/ui/Badge';
import { Countdown } from '@/components/ui/Countdown';
import { dateParts, formatTime } from '@/lib/format';
import { sized } from '@/lib/image';
import { cn } from '@/lib/cn';

function SyncBadge({ ticket }) {
  if (ticket.status === 'pending')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#ffa920]">
        <Clock3 className="size-3.5" /> Waiting to sync
      </span>
    );
  if (ticket.status === 'failed')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-danger" title={ticket.error}>
        <CircleAlert className="size-3.5" /> Not confirmed
      </span>
    );
  return ticket.synced ? (
    <span className="inline-flex items-center gap-1 text-xs text-muted">
      <Cloud className="size-3.5" /> Confirmed on server
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-muted">
      <Smartphone className="size-3.5" /> Saved on this device
    </span>
  );
}

/** Horizontal ticket in the wallet list. */
export function TicketStub({ ticket, onView, onCancel, onRemove }) {
  const { event } = ticket;
  const { day, month, weekday } = dateParts(event.startDate);
  const past = new Date(event.endDate) < new Date();
  const cancelled = ticket.status === 'cancelled';
  const canCancel = ticket.status === 'confirmed' && new Date(event.startDate) > new Date();

  return (
    <article className={cn('group flex flex-col overflow-hidden rounded-[24px] border border-line bg-surface shadow-card sm:flex-row', (cancelled || past) && 'opacity-75')}>
      <Link to={`/events/${event.slug}`} className="relative aspect-[16/8] shrink-0 overflow-hidden sm:aspect-auto sm:w-48">
        <img src={sized(event.image, 400)} alt="" loading="lazy" className={cn('size-full object-cover transition duration-700 group-hover:scale-105', (cancelled || past) && 'grayscale')} />
        <div className="absolute top-3 left-3">
          <CategoryChip category={event.category} variant="image" />
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <SyncBadge ticket={ticket} />
          {cancelled && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger">
              <XCircle className="size-3.5" /> Cancelled
            </span>
          )}
        </div>
        <Link to={`/events/${event.slug}`} className="font-display text-xl leading-tight font-bold tracking-tight hover:underline">
          {event.title}
        </Link>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="size-4 shrink-0" />
          <span className="truncate">{[event.venue?.name, event.venue?.city].filter(Boolean).join(', ')}</span>
        </p>
        <p className="text-sm text-fg-2">
          {ticket.name} · {ticket.tickets} {ticket.tickets === 1 ? 'ticket' : 'tickets'}
        </p>
        {ticket.status === 'failed' && ticket.error && <p className="text-xs text-danger">{ticket.error}</p>}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4 border-t border-dashed border-line-strong p-5 sm:w-56 sm:flex-col sm:items-stretch sm:border-t-0 sm:border-l">
        <div>
          <div className="font-mono text-xs tracking-[0.15em] text-muted">
            {weekday.toUpperCase()} · {month}
          </div>
          <div className="font-display text-4xl leading-none font-bold">{day}</div>
          <div className="mt-1 text-xs text-muted">{formatTime(event.startDate)}</div>
          {!past && !cancelled && <Countdown target={event.startDate} size="sm" className="mt-2 block text-accent-text" />}
          <div className="mt-2 font-mono text-[11px] tracking-wider text-muted">{ticket.ticketCode}</div>
        </div>
        <div className="flex gap-2 sm:flex-col">
          {!cancelled && ticket.status !== 'failed' && (
            <button
              type="button"
              onClick={onView}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-fg px-4 text-sm font-semibold text-bg transition hover:bg-fg/85"
            >
              <QrCode className="size-4" /> View
            </button>
          )}
          {canCancel && (
            <button type="button" onClick={onCancel} className="h-10 rounded-full border border-line px-4 text-sm font-medium transition hover:border-danger hover:text-danger">
              Cancel
            </button>
          )}
          {(cancelled || past || ticket.status === 'failed') && (
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-line px-4 text-sm font-medium text-muted transition hover:text-fg"
            >
              <Trash2 className="size-4" /> Remove
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
