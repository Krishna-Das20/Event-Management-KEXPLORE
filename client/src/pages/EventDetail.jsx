import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router';
import { motion, useScroll, useTransform } from 'motion/react';
import { Accordion } from 'radix-ui';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  MapPin,
  Sparkles,
  Ticket,
  Users,
  Wifi,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CategoryChip } from '@/components/ui/Badge';
import { Countdown } from '@/components/ui/Countdown';
import { Avatar } from '@/components/ui/Avatar';
import { Reveal } from '@/components/ui/Reveal';
import { EmptyState } from '@/components/ui/EmptyState';
import { EventCard } from '@/components/events/EventCard';
import { SaveButton } from '@/components/events/SaveButton';
import { SeatsMeter } from '@/components/events/SeatsMeter';
import { AddToCalendar, ShareButton } from '@/components/events/EventActions';
import { useEvent } from '@/lib/queries';
import { CATEGORY_MAP } from '@/lib/constants';
import { formatCompact, formatLongDate, formatPrice, formatTimeRange, formatShortDate } from '@/lib/format';
import { sized } from '@/lib/image';
import { useLibraryStore } from '@/store/saved';
import { useTicketStore } from '@/store/tickets';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/cn';

function Section({ title, children, className }) {
  return (
    <Reveal as="section" className={cn('border-t border-line pt-10', className)}>
      <h2 className="mb-6 font-display text-3xl font-bold tracking-tight">{title}</h2>
      {children}
    </Reveal>
  );
}

function VenueMap({ venue }) {
  if (venue?.lat == null) return null;
  const d = 0.008;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${venue.lng - d},${venue.lat - d * 0.6},${venue.lng + d},${venue.lat + d * 0.6}&layer=mapnik&marker=${venue.lat},${venue.lng}`;
  return (
    <div className="overflow-hidden rounded-[24px] border border-line">
      <iframe
        title={`Map showing ${venue.name}`}
        src={src}
        loading="lazy"
        className="h-72 w-full bg-surface-2 dark:[filter:invert(0.92)_hue-rotate(180deg)_saturate(0.6)_brightness(0.95)]"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4">
        <div>
          <div className="font-semibold">{venue.name}</div>
          <div className="text-sm text-muted">{[venue.address, venue.city].filter(Boolean).join(', ')}</div>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-medium hover:bg-surface-2"
        >
          Directions <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}

function TicketPanel({ event, existing }) {
  const ended = event.status === 'ended';
  const soldOut = event.status === 'sold-out';
  const live = event.status === 'live';

  return (
    <div className="overflow-hidden rounded-[28px] border border-line bg-surface shadow-card">
      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium tracking-wide text-muted uppercase">Price</div>
            <div className="font-display text-4xl font-bold tracking-tight">{formatPrice(event.price)}</div>
            {event.price > 0 && <div className="text-xs text-muted">per person · pay at venue</div>}
          </div>
          <SaveButton event={event} variant="surface" />
        </div>

        {!ended && (
          <div>
            <div className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">{live ? 'Status' : 'Starts in'}</div>
            <Countdown target={event.startDate} end={event.endDate} size="md" className="justify-between gap-1 sm:gap-1" />
          </div>
        )}

        {!ended && <SeatsMeter event={event} />}
      </div>

      <div className="relative h-0" aria-hidden>
        <span className="absolute -top-3 -left-3 size-6 rounded-full border border-line bg-bg" />
        <span className="absolute -top-3 -right-3 size-6 rounded-full border border-line bg-bg" />
        <div className="perforation-x mx-6" />
      </div>

      <div className="space-y-3 p-6">
        {existing ? (
          <>
            <div className="flex items-center gap-3 rounded-2xl bg-success/12 p-3 text-sm">
              <span className="grid size-8 place-items-center rounded-full bg-success text-black">
                <Check className="size-4" />
              </span>
              <div>
                <div className="font-semibold">You’re going!</div>
                <div className="text-xs text-muted">Ticket {existing.ticketCode}</div>
              </div>
            </div>
            <Button asChild size="lg" variant="dark" className="w-full">
              <Link to={`/tickets?code=${existing.ticketCode}`}>
                <Ticket className="size-5" /> View my ticket
              </Link>
            </Button>
          </>
        ) : ended ? (
          <Button size="lg" variant="secondary" className="w-full" disabled>
            Registration closed
          </Button>
        ) : soldOut ? (
          <Button size="lg" variant="secondary" className="w-full" disabled>
            Sold out
          </Button>
        ) : live ? (
          <Button size="lg" variant="secondary" className="w-full" disabled>
            Happening now — registration closed
          </Button>
        ) : (
          <Button asChild size="lg" className="w-full">
            <Link to={`/register?event=${event.slug}`}>
              <Ticket className="size-5" /> Register now
            </Link>
          </Button>
        )}
        <div className="flex gap-2">
          <AddToCalendar event={event} ticketCode={existing?.ticketCode} />
          <ShareButton event={event} />
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div aria-hidden>
      <div className="skeleton h-[70vh] w-full" />
      <div className="container-x mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="skeleton h-8 w-1/3 rounded-xl" />
          <div className="skeleton h-4 w-full rounded-lg" />
          <div className="skeleton h-4 w-5/6 rounded-lg" />
          <div className="skeleton h-4 w-2/3 rounded-lg" />
        </div>
        <div className="skeleton h-96 rounded-[28px]" />
      </div>
    </div>
  );
}

export default function EventDetail() {
  const { slug } = useParams();
  const { data, isLoading, isError, error } = useEvent(slug);
  const event = data?.event;
  const trackView = useLibraryStore((s) => s.trackView);
  const existing = useTicketStore((s) => s.tickets.find((t) => t.event?.slug === slug && (t.status === 'confirmed' || t.status === 'pending')));
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.2]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useDocumentTitle(event?.title ?? (isError ? 'Event not found' : 'Loading…'), event?.tagline);

  useEffect(() => {
    if (event) trackView(event);
  }, [event, trackView]);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !event) {
    return (
      <div className="container-x pt-36">
        <EmptyState
          icon={CalendarDays}
          title={error?.status === 404 ? 'This event doesn’t exist (yet)' : 'Couldn’t load this event'}
          description={error?.status === 404 ? 'It may have been removed, or the link is mistyped.' : error?.message}
          action={
            <Button asChild variant="dark">
              <Link to="/events">Browse all events</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const category = CATEGORY_MAP[event.category];
  const ended = event.status === 'ended';
  const paragraphs = event.description?.split(/\n\n+/) ?? [];

  return (
    <article>
      {/* Cinematic hero */}
      <header ref={heroRef} className="relative isolate flex min-h-[78vh] items-end overflow-hidden pt-32 pb-24 text-white">
        <motion.img
          src={sized(event.image, 1800, 80)}
          alt=""
          style={{ y: imgY, scale: imgScale }}
          className={cn('absolute inset-0 -z-20 size-full object-cover', ended && 'grayscale-[0.6]')}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/45 to-black/30" />

        <motion.div style={{ opacity: contentOpacity }} className="container-x">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-white/75">
            <Link to="/events" className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 backdrop-blur-md hover:bg-black/50">
              <ArrowLeft className="size-3.5" /> All events
            </Link>
            <span>/</span>
            <Link to={`/events?category=${event.category}`} className="hover:text-white">
              {category?.label}
            </Link>
          </nav>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <div className="flex flex-wrap items-center gap-2">
              <CategoryChip category={event.category} variant="image" />
              {event.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-fg">
                  <Sparkles className="size-3.5" /> Featured
                </span>
              )}
              {ended && <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold uppercase">Ended</span>}
            </div>
            <h1 className="font-display-tight mt-5 max-w-5xl text-[clamp(2.8rem,8vw,6.5rem)] font-extrabold text-balance [text-shadow:0_2px_30px_rgb(0_0_0/0.25)]">
              {event.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/80 sm:text-xl">{event.tagline}</p>
          </motion.div>
        </motion.div>
      </header>

      <div className="container-x grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-12">
          {/* Key facts */}
          <Reveal className="relative z-10 -mt-12 grid gap-px overflow-hidden rounded-[24px] border border-line bg-line shadow-card sm:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: CalendarDays, label: 'Date', value: formatShortDate(event.startDate), sub: formatLongDate(event.startDate).split(',').at(-1) },
              { icon: Clock, label: 'Time', value: formatTimeRange(event.startDate, event.endDate) },
              {
                icon: event.mode === 'online' ? Wifi : MapPin,
                label: event.mode === 'online' ? 'Online' : 'Venue',
                value: event.venue?.name,
                sub: event.mode === 'online' ? event.venue?.address : event.venue?.city,
              },
              { icon: Users, label: 'Attending', value: `${formatCompact(event.registeredCount)} going`, sub: `${formatCompact(event.capacity)} capacity` },
            ].map((f) => (
              <div key={f.label} className="bg-surface p-5">
                <f.icon className="size-5 text-accent-text" />
                <div className="mt-3 text-xs font-medium tracking-wide text-muted uppercase">{f.label}</div>
                <div className="mt-1 font-semibold">{f.value}</div>
                {f.sub && <div className="text-sm text-muted">{f.sub}</div>}
              </div>
            ))}
          </Reveal>

          <Section title="About this event" className="border-t-0 pt-0">
            <div className="space-y-4 text-[17px] leading-relaxed text-fg-2">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {event.tags?.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {event.tags.map((t) => (
                  <Link key={t} to={`/events?q=${encodeURIComponent(t)}`} className="rounded-full border border-line px-3 py-1 text-sm text-muted hover:border-line-strong hover:text-fg">
                    #{t}
                  </Link>
                ))}
              </div>
            )}
          </Section>

          {event.highlights?.length > 0 && (
            <Section title="Highlights">
              <ul className="grid gap-3 sm:grid-cols-2">
                {event.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-accent-fg">
                      <Check className="size-4" />
                    </span>
                    <span className="font-medium">{h}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {event.agenda?.length > 0 && (
            <Section title="Schedule">
              <ol className="relative space-y-6 border-l border-dashed border-line-strong pl-8">
                {event.agenda.map((item, i) => (
                  <li key={i} className="relative">
                    <span className="absolute top-1 -left-[41px] grid size-5 place-items-center rounded-full border-2 border-bg bg-fg">
                      <span className="size-1.5 rounded-full bg-accent" />
                    </span>
                    <div className="font-mono text-sm font-semibold text-accent-text">{item.time}</div>
                    <div className="mt-1 text-lg font-semibold">{item.title}</div>
                    {item.description && <p className="mt-1 text-muted">{item.description}</p>}
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {event.speakers?.length > 0 && (
            <Section title={event.category === 'music' ? 'Lineup' : 'Speakers & hosts'}>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {event.speakers.map((s) => (
                  <div key={s.name} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
                    <Avatar name={s.name} className="size-12" />
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{s.name}</div>
                      <div className="truncate text-sm text-muted">{s.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {event.gallery?.length > 0 && (
            <Section title="Gallery">
              <div className="grid grid-cols-2 gap-3">
                {event.gallery.map((src, i) => (
                  <div key={src} className={cn('overflow-hidden rounded-2xl', i === 0 && event.gallery.length % 2 === 1 && 'col-span-2')}>
                    <img src={sized(src, 900)} alt="" loading="lazy" className="aspect-[4/3] size-full object-cover transition duration-700 hover:scale-105" />
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title={event.mode === 'online' ? 'Where' : 'Venue'}>
            {event.mode === 'online' ? (
              <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
                <span className="grid size-12 place-items-center rounded-2xl bg-surface-2">
                  <Wifi className="size-5" />
                </span>
                <div>
                  <div className="font-semibold">{event.venue?.name}</div>
                  <div className="text-sm text-muted">{event.venue?.address}</div>
                </div>
              </div>
            ) : (
              <VenueMap venue={event.venue} />
            )}
          </Section>

          {event.organizer?.name && (
            <Section title="Organiser">
              <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
                <Avatar name={event.organizer.name} className="size-14" />
                <div>
                  <div className="flex items-center gap-1.5 text-lg font-semibold">
                    {event.organizer.name}
                    {event.organizer.verified && <BadgeCheck className="size-5 text-[#2fc7f0]" aria-label="Verified organiser" />}
                  </div>
                  <div className="text-sm text-muted">{event.organizer.verified ? 'Verified organiser' : 'Community organiser'}</div>
                </div>
              </div>
            </Section>
          )}

          {event.faqs?.length > 0 && (
            <Section title="FAQs">
              <Accordion.Root type="single" collapsible className="space-y-3">
                {event.faqs.map((f, i) => (
                  <Accordion.Item key={i} value={`faq-${i}`} className="overflow-hidden rounded-2xl border border-line bg-surface">
                    <Accordion.Header>
                      <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 p-5 text-left font-semibold">
                        {f.question}
                        <ChevronDown className="size-5 shrink-0 text-muted transition-transform duration-300 group-data-[state=open]:rotate-180" />
                      </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content className="px-5 pb-5 text-muted">{f.answer}</Accordion.Content>
                  </Accordion.Item>
                ))}
              </Accordion.Root>
            </Section>
          )}
        </div>

        <aside className="relative z-10 -mt-12 hidden lg:block">
          <div className="sticky top-28">
            <TicketPanel event={event} existing={existing} />
          </div>
        </aside>
      </div>

      {/* Mobile: inline ticket panel + sticky CTA bar */}
      <div className="container-x mt-12 lg:hidden">
        <TicketPanel event={event} existing={existing} />
      </div>
      {!ended && !existing && event.status === 'upcoming' && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/85 p-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="pl-2">
              <div className="font-display text-xl font-bold">{formatPrice(event.price)}</div>
              <div className="text-xs text-muted">{event.seatsLeft} seats left</div>
            </div>
            <Button asChild size="lg" className="flex-1 sm:flex-none">
              <Link to={`/register?event=${event.slug}`}>
                Register <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {data.related?.length > 0 && (
        <section className="container-x mt-24">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="font-display-tight text-4xl font-bold">More {category?.label.toLowerCase()} events</h2>
            <Link to={`/events?category=${event.category}`} className="hidden items-center gap-1 text-sm font-semibold sm:inline-flex">
              See all <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.related.map((e) => (
              <EventCard key={e.slug} event={e} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
