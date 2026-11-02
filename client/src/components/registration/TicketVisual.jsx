import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin } from 'lucide-react';
import { CategoryChip } from '@/components/ui/Badge';
import { LogoMark } from '@/components/ui/Logo';
import { formatEventWhen, formatPrice, formatTime } from '@/lib/format';
import { sized } from '@/lib/image';
import { cn } from '@/lib/cn';

const STATUS = {
  confirmed: ['Confirmed', 'bg-success text-black'],
  pending: ['Pending sync', 'bg-[#ffa920] text-black'],
  cancelled: ['Cancelled', 'bg-danger text-white'],
  failed: ['Not confirmed', 'bg-danger text-white'],
  draft: ['Preview', 'bg-surface-3 text-fg'],
};

/**
 * The printable ticket. Used as the live preview while filling the form,
 * on the success screen, and in the "My Tickets" wallet. Forwarded ref is used
 * to export it as a PNG.
 */
export const TicketVisual = forwardRef(function TicketVisual({ event, name, tickets = 1, code, status = 'draft', className }, ref) {
  const verifyUrl = code && !code.startsWith('PENDING') ? `${window.location.origin}/verify/${code}` : null;
  const [label, cls] = STATUS[status] ?? STATUS.draft;

  return (
    <div ref={ref} className={cn('w-full overflow-hidden rounded-[28px] border border-line bg-surface shadow-card [--punch:var(--bg)]', className)}>
      <div className="relative h-36 overflow-hidden">
        {event?.image ? (
          <img src={sized(event.image, 720)} alt="" crossOrigin="anonymous" className="size-full object-cover" />
        ) : (
          <div className="bg-grid size-full bg-surface-2" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" />
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <LogoMark className="size-7" />
          <span className="font-display text-sm font-bold text-white">encore</span>
        </div>
        <span className={cn('absolute top-4 right-4 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase', cls)}>{label}</span>
        <div className="absolute right-4 bottom-3 left-4 text-white">
          {event && <CategoryChip category={event.category} variant="image" className="mb-2" />}
          <div className="font-display text-xl leading-tight font-bold tracking-tight">{event?.title ?? 'Choose an event'}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-5 text-sm">
        <div className="col-span-2">
          <div className="text-[10px] font-semibold tracking-[0.18em] text-muted uppercase">Attendee</div>
          <div className={cn('mt-0.5 truncate font-display text-lg font-bold', !name && 'text-muted')}>{name || 'Your name'}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold tracking-[0.18em] text-muted uppercase">When</div>
          <div className="mt-0.5 font-medium">{event ? formatEventWhen(event.startDate, event.endDate).split(' · ')[0] : '—'}</div>
          <div className="text-xs text-muted">{event ? formatTime(event.startDate) : ''}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold tracking-[0.18em] text-muted uppercase">Admits</div>
          <div className="mt-0.5 font-medium">
            {tickets} {tickets === 1 ? 'person' : 'people'}
          </div>
          <div className="text-xs text-muted">{event ? (event.price ? formatPrice(event.price * tickets) : 'Free entry') : ''}</div>
        </div>
        <div className="col-span-2 flex items-start gap-1.5 text-muted">
          <MapPin className="mt-0.5 size-4 shrink-0" />
          <span className="truncate">{event ? [event.venue?.name, event.venue?.city].filter(Boolean).join(', ') : 'Venue'}</span>
        </div>
      </div>

      <div className="relative h-0" aria-hidden>
        <span className="absolute -top-3 -left-3 size-6 rounded-full border border-line bg-[var(--punch)]" />
        <span className="absolute -top-3 -right-3 size-6 rounded-full border border-line bg-[var(--punch)]" />
        <div className="perforation-x mx-6" />
      </div>

      <div className="flex items-center gap-4 p-5">
        <div className={cn('relative shrink-0 rounded-2xl bg-white p-2.5', !verifyUrl && 'opacity-90')}>
          <QRCodeSVG value={verifyUrl ?? 'https://encore-kexplore.vercel.app'} size={92} level="M" className={cn(!verifyUrl && 'blur-[3px]')} />
          {!verifyUrl && (
            <span className="absolute inset-0 grid place-items-center text-[10px] font-bold tracking-wide text-black uppercase">
              {status === 'pending' ? 'Syncing' : 'QR on confirm'}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold tracking-[0.18em] text-muted uppercase">Ticket code</div>
          <div className="mt-1 font-mono text-lg font-bold tracking-wider break-all">{code ?? 'ENC-••••-••••'}</div>
          <div className="mt-1 text-xs text-muted">Show this QR at the entrance.</div>
        </div>
      </div>
    </div>
  );
});
