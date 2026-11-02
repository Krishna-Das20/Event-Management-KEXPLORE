import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PulseDot } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { HeroTicketStack } from './HeroTicketStack';
import { useEvents, useEventsMeta } from '@/lib/queries';
import { CATEGORY_MAP } from '@/lib/constants';
import { formatCompact } from '@/lib/format';

const ease = [0.16, 1, 0.3, 1];

/** Splits a line into words that rise out of a mask one after another. */
function RevealLine({ children, delay = 0, className }) {
  return (
    <span className={`block overflow-hidden pb-[0.08em] ${className ?? ''}`}>
      <motion.span className="block" initial={{ y: '105%' }} animate={{ y: '0%' }} transition={{ duration: 1, ease, delay }}>
        {children}
      </motion.span>
    </span>
  );
}

const QUICK = ['music', 'tech', 'comedy', 'food'];
const FACES = [
  ['Aditi Rao', '1494790108377-be9c29b29330'],
  ['Rahul Sen', '1507003211169-0a1dd7228f2d'],
  ['Meera Das', '1438761681033-6461ffad8d80'],
  ['Kabir Shah', '1500648767791-00dcc994a43e'],
  ['Zoya Ali', '1534528741775-53994a69daeb'],
].map(([name, id]) => ({ name, src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=96&h=96&q=70` }));

export function Hero() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const { data: meta } = useEventsMeta();
  const { data: featured } = useEvents({ featured: 'true', limit: 5 });

  const onSearch = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/events?q=${encodeURIComponent(q.trim())}` : '/events');
  };

  return (
    <section className="grain relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pt-36 lg:pb-24">
      {/* Background: grid fading out, plus soft colour glows */}
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_60%_30%,#000_20%,transparent_70%)]" aria-hidden />
      <div className="pointer-events-none absolute -top-40 right-[-10%] size-[620px] rounded-full bg-accent/25 blur-[140px] dark:bg-accent/15" aria-hidden />
      <div className="pointer-events-none absolute bottom-[-20%] left-[-10%] size-[520px] rounded-full bg-[#ff4d8d]/15 blur-[140px]" aria-hidden />

      <div className="container-x relative grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 [&>*]:min-w-0">
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <Link
              to="/events"
              className="group inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/70 py-1.5 pr-3 pl-3 text-sm backdrop-blur transition hover:border-line-strong"
            >
              <PulseDot />
              <span className="font-medium">{meta ? `${meta.stats.upcoming} events live` : 'Events live'}</span>
              <span className="text-muted">across {meta?.stats.cities ?? 'many'} cities</span>
              <ArrowRight className="size-3.5 text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          <h1 className="font-display-tight mt-7 text-[clamp(3rem,6.3vw,6.1rem)] font-extrabold">
            <RevealLine delay={0.1}>Discover events</RevealLine>
            <RevealLine delay={0.2}>
              worth{' '}
              <span className="relative inline-block font-serif font-normal tracking-[-0.02em] text-accent-text italic">
                showing up
                <motion.svg viewBox="0 0 300 20" className="absolute -bottom-[0.12em] left-0 w-full text-accent" aria-hidden>
                  <motion.path
                    d="M4 14 C 60 4, 120 4, 170 10 S 260 18, 296 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.1, ease, delay: 0.9 }}
                  />
                </motion.svg>
              </span>
            </RevealLine>
            <RevealLine delay={0.3}>for.</RevealLine>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.45 }}
            className="mt-7 max-w-xl text-lg text-muted text-balance"
          >
            Concerts, hackathons, comedy nights and food trails across India. Find what’s on, grab your spot in seconds, and keep
            every ticket in one place.
          </motion.p>

          <motion.form
            onSubmit={onSearch}
            role="search"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.55 }}
            className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-line bg-surface p-2 shadow-card focus-within:border-line-strong"
          >
            <Search className="ml-3 size-5 shrink-0 text-muted" aria-hidden />
            <label htmlFor="hero-search" className="sr-only">
              Search events
            </label>
            <input
              id="hero-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try “jazz”, “hackathon” or “Goa”"
              className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-muted"
            />
            <Button type="submit" className="px-6">
              Search
            </Button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-4 flex flex-wrap items-center gap-2 text-sm"
          >
            <span className="text-muted">Popular:</span>
            {QUICK.map((id) => {
              const c = CATEGORY_MAP[id];
              return (
                <Link
                  key={id}
                  to={`/events?category=${id}`}
                  style={{ '--c': c.color }}
                  className="chip-tone inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition hover:scale-105"
                >
                  <c.icon className="size-3.5" /> {c.label}
                </Link>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="mt-10 flex items-center gap-4"
          >
            <div className="flex -space-x-3">
              {FACES.map((f) => (
                <Avatar key={f.name} name={f.name} src={f.src} className="size-9 ring-2 ring-bg" />
              ))}
            </div>
            <p className="text-sm text-muted">
              <span className="font-semibold text-fg">{meta ? formatCompact(meta.stats.attendees) : '—'}+</span> people
              registered this season
            </p>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease, delay: 0.2 }}>
          {featured?.items?.length ? (
            <HeroTicketStack events={featured.items} />
          ) : (
            <div className="mx-auto h-[600px] w-full max-w-[360px] pt-10">
              <div className="skeleton h-[520px] w-full rounded-[30px]" />
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
