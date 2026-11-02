import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarClock, Cloud, Download, Heart, HeartOff, History, MapPin, Smartphone, Ticket, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Eyebrow } from '@/components/ui/SectionHeading';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Countdown } from '@/components/ui/Countdown';
import { CategoryChip } from '@/components/ui/Badge';
import { TicketStub } from '@/components/tickets/TicketStub';
import { DataTools } from '@/components/tickets/DataTools';
import { TicketVisual } from '@/components/registration/TicketVisual';
import { AddToCalendar } from '@/components/events/EventActions';
import { GOOGLE_ENABLED } from '@/components/auth/SignInDialog';
import { useCancelTicket, useSession } from '@/lib/queries';
import { downloadNodeAsPng } from '@/lib/download';
import { formatShortDate } from '@/lib/format';
import { sized } from '@/lib/image';
import { useTicketStore } from '@/store/tickets';
import { useLibraryStore } from '@/store/saved';
import { useUiStore } from '@/store/ui';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const now = () => Date.now();

function TicketDialog({ ticket, onOpenChange }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  if (!ticket) return null;
  const download = async () => {
    setBusy(true);
    try {
      await downloadNodeAsPng(ref.current, `encore-ticket-${ticket.ticketCode}.png`);
    } catch {
      toast.error('Couldn’t generate the image.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open onOpenChange={onOpenChange} title="Your ticket" hideTitle size="sm" className="bg-bg p-4 sm:p-5">
      <div className="pt-8">
        <TicketVisual ref={ref} event={ticket.event} name={ticket.name} tickets={ticket.tickets} code={ticket.ticketCode} status={ticket.status} />
        <div className="mt-4 flex gap-2">
          {ticket.status === 'confirmed' && (
            <Button variant="dark" className="flex-1" onClick={download} loading={busy}>
              <Download className="size-4" /> Save PNG
            </Button>
          )}
          <AddToCalendar event={ticket.event} ticketCode={ticket.ticketCode} />
        </div>
      </div>
    </Dialog>
  );
}

function SavedCard({ event, onRemove }) {
  return (
    <article className="group relative overflow-hidden rounded-[24px] border border-line bg-surface shadow-card">
      <Link to={`/events/${event.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img src={sized(event.image, 600)} alt="" loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-105" />
          <CategoryChip category={event.category} variant="image" className="absolute top-3 left-3" />
        </div>
        <div className="p-5">
          <h3 className="font-display text-xl leading-tight font-bold tracking-tight">{event.title}</h3>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
            <CalendarClock className="size-4" /> {formatShortDate(event.startDate)}
            <MapPin className="ml-2 size-4" /> {event.venue?.city}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${event.title} from saved`}
        className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
      >
        <HeartOff className="size-4" />
      </button>
    </article>
  );
}

export default function MyTickets() {
  useDocumentTitle('My tickets', 'All your Encore registrations in one place — available offline.');
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'upcoming';
  const { user } = useSession();
  const openSignIn = useUiStore((s) => s.openSignIn);
  const tickets = useTicketStore((s) => s.tickets);
  const remove = useTicketStore((s) => s.remove);
  const saved = useLibraryStore((s) => s.saved);
  const toggleSave = useLibraryStore((s) => s.toggleSave);
  const cancel = useCancelTicket();
  const [cancelling, setCancelling] = useState(null);

  const viewing = tickets.find((t) => t.ticketCode === params.get('code'));
  const setViewing = (code) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p);
        if (code) next.set('code', code);
        else next.delete('code');
        return next;
      },
      { replace: true, preventScrollReset: true },
    );

  const groups = useMemo(() => {
    const t = now();
    const active = tickets.filter((x) => x.status !== 'cancelled');
    return {
      upcoming: active.filter((x) => new Date(x.event?.endDate).getTime() >= t).sort((a, b) => new Date(a.event.startDate) - new Date(b.event.startDate)),
      past: active.filter((x) => new Date(x.event?.endDate).getTime() < t),
      cancelled: tickets.filter((x) => x.status === 'cancelled'),
    };
  }, [tickets]);

  const next = groups.upcoming.find((t) => t.status === 'confirmed' || t.status === 'pending');
  const admits = groups.upcoming.reduce((sum, t) => sum + (t.tickets ?? 1), 0);

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: groups.upcoming.length, icon: Ticket },
    { id: 'past', label: 'Past', count: groups.past.length, icon: History },
    { id: 'cancelled', label: 'Cancelled', count: groups.cancelled.length, icon: XCircle },
    { id: 'saved', label: 'Saved', count: saved.length, icon: Heart },
  ];
  const list = groups[tab] ?? [];

  const confirmCancel = async () => {
    try {
      await cancel.mutateAsync({ ticketCode: cancelling.ticketCode, email: user ? undefined : cancelling.email });
      toast.success('Registration cancelled', { description: `Your seat for ${cancelling.event.title} has been released.` });
      setCancelling(null);
    } catch (err) {
      toast.error('Couldn’t cancel', { description: err.message });
    }
  };

  const setTab = (id) => setParams(id === 'upcoming' ? {} : { tab: id }, { replace: true, preventScrollReset: true });

  return (
    <div className="container-x pt-32 pb-10">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Eyebrow className="mb-4">Wallet</Eyebrow>
          <h1 className="font-display-tight text-[clamp(2.8rem,7vw,5.5rem)] font-extrabold">
            My <span className="font-serif font-normal italic">tickets</span>
          </h1>
          <p className="mt-3 flex items-center gap-2 text-muted">
            {user ? (
              <>
                <Cloud className="size-4" /> Synced with {user.email}
              </>
            ) : (
              <>
                <Smartphone className="size-4" /> Stored on this device — sign in to sync across devices
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {!user && GOOGLE_ENABLED && (
            <Button variant="dark" onClick={() => openSignIn('Sign in to back up these tickets and see bookings from your other devices.')}>
              Sign in to sync
            </Button>
          )}
          <Button asChild variant="secondary">
            <Link to="/events">Find more events</Link>
          </Button>
        </div>
      </header>

      <div className="mt-10 grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="relative overflow-hidden rounded-[28px] bg-fg p-6 text-bg">
          <div className="text-xs font-semibold tracking-[0.18em] uppercase opacity-60">Next up</div>
          {next ? (
            <>
              <Link to={`/events/${next.event.slug}`} className="mt-2 block font-display text-2xl font-bold tracking-tight hover:underline">
                {next.event.title}
              </Link>
              <div className="mt-5 [&_.bg-surface-2]:!bg-bg/10 [&_.border-line]:!border-bg/15 [&_.text-muted]:!text-bg/60">
                <Countdown target={next.event.startDate} size="md" />
              </div>
            </>
          ) : (
            <p className="mt-2 text-lg opacity-80">No upcoming events yet — your next adventure awaits.</p>
          )}
        </div>
        <div className="rounded-[28px] border border-line bg-surface p-6">
          <div className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">Upcoming</div>
          <div className="mt-2 font-display text-5xl font-bold">{groups.upcoming.length}</div>
          <div className="text-sm text-muted">
            registrations · {admits} {admits === 1 ? 'admit' : 'admits'}
          </div>
        </div>
        <div className="rounded-[28px] border border-line bg-surface p-6">
          <div className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">Saved</div>
          <div className="mt-2 font-display text-5xl font-bold">{saved.length}</div>
          <div className="text-sm text-muted">events on your wishlist</div>
        </div>
      </div>

      <div className="no-scrollbar -mx-4 mt-10 overflow-x-auto px-4">
        <SegmentedControl options={tabs} value={tab} onChange={setTab} label="Ticket groups" />
      </div>

      <div className="mt-6 grid gap-10 xl:grid-cols-[1fr_380px]">
        <div>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              {tab === 'saved' ? (
                saved.length ? (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {saved.map((e) => (
                      <SavedCard
                        key={e.slug}
                        event={e}
                        onRemove={() => {
                          toggleSave(e);
                          toast('Removed from saved', { description: e.title });
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Heart}
                    title="No saved events"
                    description="Tap the heart on any event to keep it here for later."
                    action={
                      <Button asChild variant="dark">
                        <Link to="/events">Browse events</Link>
                      </Button>
                    }
                  />
                )
              ) : list.length ? (
                <div className="space-y-4">
                  {list.map((t) => (
                    <TicketStub
                      key={t.ticketCode}
                      ticket={t}
                      onView={() => setViewing(t.ticketCode)}
                      onCancel={() => setCancelling(t)}
                      onRemove={() => {
                        remove(t.ticketCode);
                        toast('Removed from this device', { description: t.event.title });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={tab === 'upcoming' ? Ticket : tab === 'past' ? History : XCircle}
                  title={tab === 'upcoming' ? 'No upcoming tickets' : tab === 'past' ? 'No past events yet' : 'Nothing cancelled'}
                  description={
                    tab === 'upcoming'
                      ? user
                        ? 'Register for an event and your ticket will appear here instantly.'
                        : 'Tickets you book on this device appear here. Booked elsewhere? Sign in to bring them over.'
                      : 'Tickets will show up here over time.'
                  }
                  action={
                    tab === 'upcoming' && (
                      <Button asChild variant="dark">
                        <Link to="/events">Find an event</Link>
                      </Button>
                    )
                  }
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <aside>
          <div className="xl:sticky xl:top-28">
            <DataTools />
          </div>
        </aside>
      </div>

      <TicketDialog ticket={viewing} onOpenChange={(open) => !open && setViewing(null)} />
      <ConfirmDialog
        open={Boolean(cancelling)}
        onOpenChange={(open) => !open && setCancelling(null)}
        title="Cancel this registration?"
        description={cancelling ? `Your ${cancelling.tickets > 1 ? `${cancelling.tickets} seats` : 'seat'} for “${cancelling.event.title}” will be released to someone else. This can’t be undone.` : ''}
        confirmLabel="Yes, cancel it"
        onConfirm={confirmCancel}
        loading={cancel.isPending}
      />
    </div>
  );
}
