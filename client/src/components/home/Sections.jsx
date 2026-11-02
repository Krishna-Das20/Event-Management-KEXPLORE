import { useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ArrowUpRight, CalendarCheck2, Compass, MapPin, QrCode, Quote, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CategoryChip } from '@/components/ui/Badge';
import { Countdown } from '@/components/ui/Countdown';
import { CountUp } from '@/components/ui/CountUp';
import { Marquee } from '@/components/ui/Marquee';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { Avatar } from '@/components/ui/Avatar';
import { EventCard, EventCardSkeleton } from '@/components/events/EventCard';
import { useEvents, useEventsMeta, useSession } from '@/lib/queries';
import { CATEGORIES } from '@/lib/constants';
import { formatEventWhen, formatPrice } from '@/lib/format';
import { sized } from '@/lib/image';
import { useSpotlight } from '@/hooks/useSpotlight';
import { useUiStore } from '@/store/ui';
import { GOOGLE_ENABLED } from '@/components/auth/SignInDialog';
import { cn } from '@/lib/cn';

/* ─────────────── Category marquee band ─────────────── */
export function CategoryBand() {
  return (
    <section aria-label="Categories" className="border-y border-line bg-surface/50 py-6">
      <Marquee duration={45} gap="2.5rem">
        {CATEGORIES.map((c, i) => (
          <Link key={c.id} to={`/events?category=${c.id}`} className="group flex items-center gap-10">
            <span
              className={cn(
                'font-display-tight text-5xl font-extrabold whitespace-nowrap uppercase transition-colors sm:text-6xl',
                i % 2 ? 'text-outline group-hover:text-fg' : 'text-fg group-hover:text-[var(--c)]',
              )}
              style={{ '--c': c.color }}
            >
              {c.label}
            </span>
            <span className="text-4xl text-accent-text" aria-hidden>
              ✱
            </span>
          </Link>
        ))}
      </Marquee>
    </section>
  );
}

/* ─────────────── Stats ─────────────── */
export function StatsBand() {
  const { data } = useEventsMeta();
  const s = data?.stats;
  const items = [
    { label: 'Upcoming events', value: s?.upcoming ?? 0 },
    { label: 'Cities across India', value: s?.cities ?? 0 },
    { label: 'Tickets registered', value: s?.attendees ?? 0, suffix: '+' },
    { label: 'Free events', value: s?.free ?? 0 },
  ];
  return (
    <section className="container-x py-20">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[28px] border border-line bg-line lg:grid-cols-4">
        {items.map((item, i) => (
          <Reveal key={item.label} delay={i * 0.08} className="bg-bg p-6 sm:p-8">
            <div className="font-display-tight text-[clamp(2.5rem,6vw,4.5rem)] font-bold tabular">
              <CountUp value={item.value} />
              {item.suffix && <span className="text-accent-text">{item.suffix}</span>}
            </div>
            <div className="mt-2 text-sm text-muted">{item.label}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ─────────────── Featured bento ─────────────── */
function BentoCard({ event, big, className }) {
  const onPointerMove = useSpotlight();
  return (
    <Link
      to={`/events/${event.slug}`}
      onPointerMove={onPointerMove}
      className={cn('group relative isolate flex overflow-hidden rounded-[28px] border border-line bg-surface-2 p-5 sm:p-7', className)}
    >
      <img
        src={sized(event.image, big ? 1400 : 800)}
        alt=""
        loading="lazy"
        className="absolute inset-0 -z-20 size-full object-cover transition duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.07]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
      <div className="spotlight pointer-events-none absolute inset-0 -z-10 opacity-0 transition group-hover:opacity-60" />

      <div className="flex w-full flex-col justify-between text-white">
        <div className="flex items-start justify-between gap-3">
          <CategoryChip category={event.category} variant="image" />
          <span className="grid size-11 place-items-center rounded-full bg-white/15 backdrop-blur-md transition duration-500 group-hover:rotate-45 group-hover:bg-accent group-hover:text-black">
            <ArrowUpRight className="size-5" />
          </span>
        </div>
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
            <span>{formatEventWhen(event.startDate, event.endDate)}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {event.venue?.city}
            </span>
          </div>
          <h3 className={cn('font-display font-bold tracking-[-0.035em] text-balance', big ? 'text-4xl leading-[0.98] sm:text-6xl' : 'text-2xl leading-tight')}>
            {event.title}
          </h3>
          {big && (
            <>
              <p className="mt-3 max-w-lg text-white/75">{event.tagline}</p>
              <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
                <div className="[&_*]:!border-white/15 [&_.bg-surface-2]:!bg-white/10 [&_.text-muted]:!text-white/60">
                  <Countdown target={event.startDate} end={event.endDate} size="md" />
                </div>
                <span className="rounded-full bg-accent px-5 py-3 font-semibold text-accent-fg">
                  {formatPrice(event.price)} · Get tickets
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export function FeaturedBento() {
  const { data, isLoading } = useEvents({ featured: 'true', limit: 5 });
  const items = data?.items ?? [];
  const layout = ['md:col-span-4 md:row-span-2', 'md:col-span-2', 'md:col-span-2', 'md:col-span-3', 'md:col-span-3'];

  return (
    <section className="container-x py-16" id="featured">
      <SectionHeading
        eyebrow="Featured"
        title={
          <>
            The <span className="font-serif font-normal italic">headliners</span>
          </>
        }
        description="Hand-picked events everyone’s talking about. Tickets for these tend to go fast."
        action={
          <Button asChild variant="secondary">
            <Link to="/events?sort=popular">
              View all events <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />
      <div className="mt-12 grid auto-rows-[300px] grid-cols-1 gap-4 md:grid-cols-6 md:auto-rows-[270px]">
        {isLoading
          ? layout.map((cls, i) => <div key={i} className={cn('skeleton rounded-[28px]', cls)} />)
          : items.map((event, i) => (
              <Reveal key={event.slug} delay={i * 0.06} className={cn('flex', layout[i], i === 0 && 'min-h-[520px] md:min-h-0')}>
                <BentoCard event={event} big={i === 0} className="w-full" />
              </Reveal>
            ))}
      </div>
    </section>
  );
}

/* ─────────────── Upcoming grid with category tabs ─────────────── */
export function UpcomingSection() {
  const { data: meta } = useEventsMeta();
  const top = Object.entries(meta?.categories ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id]) => CATEGORIES.find((c) => c.id === id))
    .filter(Boolean);
  const tabs = [{ id: 'all', label: 'All' }, ...top.map((c) => ({ id: c.id, label: c.label.split(' ')[0] }))];
  const [tab, setTab] = useState('all');
  const { data, isFetching } = useEvents({ category: tab === 'all' ? undefined : tab, limit: 6, when: 'upcoming' });
  const items = data?.items ?? [];

  return (
    <section className="container-x py-16">
      <SectionHeading
        eyebrow="On the calendar"
        title="Coming up next"
        description="The soonest events on Encore. Filter by vibe, save the ones you like, and register in a few taps."
        action={
          <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
            <SegmentedControl options={tabs} value={tab} onChange={setTab} label="Filter upcoming events by category" />
          </div>
        }
      />
      <div className={cn('mt-12 grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3', isFetching && 'opacity-60')}>
        <AnimatePresence mode="popLayout" initial={false}>
          {!data
            ? Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)
            : items.map((event, i) => (
                <motion.div
                  key={event.slug}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                >
                  <EventCard event={event} />
                </motion.div>
              ))}
        </AnimatePresence>
      </div>
      <div className="mt-10 flex justify-center">
        <Button asChild size="lg" variant="dark">
          <Link to={tab === 'all' ? '/events' : `/events?category=${tab}`}>
            Browse all {tab === 'all' ? '' : tabs.find((t) => t.id === tab)?.label.toLowerCase()} events
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

/* ─────────────── Category tiles ─────────────── */
function CategoryTile({ category, count }) {
  const onPointerMove = useSpotlight();
  const Icon = category.icon;
  return (
    <Link
      to={`/events?category=${category.id}`}
      onPointerMove={onPointerMove}
      style={{ '--c': category.color, '--glow': `${category.color}33` }}
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[24px] border border-line bg-surface p-6 transition duration-500 hover:-translate-y-1 hover:border-[color-mix(in_oklab,var(--c)_45%,transparent)]"
    >
      <div className="spotlight pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between">
        <span className="grid size-12 place-items-center rounded-2xl bg-[color-mix(in_oklab,var(--c)_18%,transparent)] text-[var(--c)] transition duration-500 group-hover:scale-110 group-hover:rotate-[-8deg]">
          <Icon className="size-6" />
        </span>
        <span className="font-mono text-xs text-muted">{count ?? 0} upcoming</span>
      </div>
      <div className="relative mt-10">
        <h3 className="font-display text-2xl font-bold tracking-tight">{category.label}</h3>
        <p className="mt-1 flex items-center justify-between text-sm text-muted">
          {category.blurb}
          <ArrowRight className="size-4 -translate-x-2 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
        </p>
      </div>
    </Link>
  );
}

export function CategoriesSection() {
  const { data } = useEventsMeta();
  return (
    <section className="container-x py-16" id="categories">
      <SectionHeading
        eyebrow="Browse by vibe"
        title={
          <>
            Whatever you’re <span className="font-serif font-normal italic">into</span>
          </>
        }
        description="Nine categories, hundreds of good nights. Pick one to jump straight into filtered results."
        align="center"
      />
      <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <StaggerItem key={c.id}>
            <CategoryTile category={c} count={data?.categories?.[c.id]} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

/* ─────────────── How it works ─────────────── */
const STEPS = [
  { icon: Compass, title: 'Discover', text: 'Search by name, city or vibe. Filter by date and price, and save anything that catches your eye.' },
  { icon: CalendarCheck2, title: 'Register in seconds', text: 'A short, validated form — or one tap if you’re signed in with Google. No payment hoops for free events.' },
  { icon: QrCode, title: 'Show up', text: 'Your QR ticket lives in “My Tickets”, works offline, and drops into your calendar with a reminder.' },
];

export function HowItWorks() {
  return (
    <section className="container-x py-16">
      <SectionHeading eyebrow="How it works" title="Three steps to a great night" align="center" />
      <div className="relative mt-14 grid gap-5 md:grid-cols-3">
        <div className="perforation-x absolute top-[3.25rem] right-[16%] left-[16%] hidden md:block" aria-hidden />
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.12} className="relative rounded-[28px] border border-line bg-surface p-7 text-center shadow-card">
            <span className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-fg text-bg">
              <step.icon className="size-6" />
              <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-accent font-mono text-[11px] font-bold text-accent-fg">
                {i + 1}
              </span>
            </span>
            <h3 className="mt-6 font-display text-2xl font-bold tracking-tight">{step.title}</h3>
            <p className="mt-2 text-sm text-muted">{step.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ─────────────── Testimonials ─────────────── */
const QUOTES = [
  { name: 'Ananya Patnaik', event: 'HackKIIT', text: 'Registered in under a minute and the QR ticket worked perfectly at the gate. The countdown had our whole team hyped.' },
  { name: 'Rohan Mehta', event: 'Neon Nights', text: 'Finally an events site that doesn’t feel like a spreadsheet. Found three gigs I’d never have heard of.' },
  { name: 'Sara Thomas', event: 'Coffee Cupping', text: 'Saved a bunch of events, came back a week later and they were all still there. Small thing, huge difference.' },
  { name: 'Vikram Iyer', event: 'AI Builders Summit', text: 'The add-to-calendar button with a reminder saved me. Clean, fast, and it works great on my phone.' },
  { name: 'Ishita Ghosh', event: 'Street Food Carnival', text: 'Dark mode is gorgeous and the filters are actually useful. Booked for my whole family in one go.' },
  { name: 'Arjun Nair', event: 'Frag Fest', text: 'Signed in with Google and every ticket I’d booked as a guest showed up automatically. Magic.' },
];

function QuoteCard({ q }) {
  return (
    <figure className="w-[340px] shrink-0 rounded-[24px] border border-line bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5 text-[#f5c518]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="size-4 fill-current" />
          ))}
        </div>
        <Quote className="size-5 text-line-strong" />
      </div>
      <blockquote className="mt-4 text-[15px] leading-relaxed text-fg-2">“{q.text}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <Avatar name={q.name} className="size-9" />
        <div>
          <div className="text-sm font-semibold">{q.name}</div>
          <div className="text-xs text-muted">Attended {q.event}</div>
        </div>
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  return (
    <section className="py-16">
      <div className="container-x">
        <SectionHeading eyebrow="Loved by attendees" title="People keep coming back" align="center" />
      </div>
      <div className="mt-12 space-y-5">
        <Marquee duration={55} gap="1.25rem">
          {QUOTES.map((q) => (
            <QuoteCard key={q.name} q={q} />
          ))}
        </Marquee>
        <Marquee duration={60} gap="1.25rem" reverse>
          {[...QUOTES].reverse().map((q) => (
            <QuoteCard key={q.name} q={q} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}

/* ─────────────── Final call to action ─────────────── */
export function CtaBanner() {
  const { user } = useSession();
  const openSignIn = useUiStore((s) => s.openSignIn);
  return (
    <section className="container-x py-16">
      <Reveal className="relative isolate overflow-hidden rounded-[36px] bg-accent px-6 py-16 text-accent-fg sm:px-12 sm:py-20">
        <motion.span
          aria-hidden
          className="absolute -top-16 -right-10 -z-10 text-[16rem] leading-none font-black text-black/10 select-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
          ✱
        </motion.span>
        <motion.span
          aria-hidden
          className="absolute -bottom-24 left-[30%] -z-10 text-[12rem] leading-none font-black text-black/10 select-none"
          animate={{ rotate: -360 }}
          transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
        >
          ✱
        </motion.span>
        <div className="max-w-3xl">
          <h2 className="font-display-tight text-[clamp(2.6rem,7vw,5.5rem)] font-extrabold">
            Your next favourite memory is <span className="font-serif font-normal italic">one click</span> away.
          </h2>
          <p className="mt-5 max-w-xl text-lg text-black/70">
            Browse what’s on this week, register in seconds and keep every ticket safely in your pocket.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="dark">
              <Link to="/events">
                Explore events <ArrowRight className="size-4" />
              </Link>
            </Button>
            {!user && GOOGLE_ENABLED && (
              <Button size="lg" variant="outline" className="border-black/25 text-black hover:bg-black/10" onClick={() => openSignIn()}>
                Sign in with Google
              </Button>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
