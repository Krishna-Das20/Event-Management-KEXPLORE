import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Check, Github, Heart, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { LogoMark } from '@/components/ui/Logo';
import { endpoints } from '@/lib/api';
import { SITE } from '@/lib/constants';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const NEWSLETTER_KEY = 'encore.newsletter';

function Newsletter() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState(() => (localStorage.getItem(NEWSLETTER_KEY) ? 'done' : 'idle'));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setStatus('loading');
    try {
      const res = await endpoints.subscribe(email.trim());
      localStorage.setItem(NEWSLETTER_KEY, email.trim());
      setStatus('done');
      toast.success(res.alreadySubscribed ? 'You’re already on the list' : 'You’re in!', { description: 'The weekly lineup lands every Friday.' });
    } catch (err) {
      setStatus('idle');
      setError(err.message);
    }
  };

  if (status === 'done') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-4 text-sm">
        <span className="grid size-8 place-items-center rounded-full bg-accent text-accent-fg">
          <Check className="size-4" />
        </span>
        You’re subscribed to the weekly lineup.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full max-w-md">
      <div className="flex gap-2 rounded-full border border-line bg-surface p-1.5 focus-within:border-line-strong">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <Mail className="ml-3 size-5 shrink-0 self-center text-muted" aria-hidden />
        <input
          id="newsletter-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'newsletter-error' : undefined}
          className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted"
        />
        <Button type="submit" size="sm" loading={status === 'loading'} className="h-10">
          Subscribe
        </Button>
      </div>
      {error && (
        <p id="newsletter-error" role="alert" className="mt-2 pl-4 text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { label: 'Upcoming events', to: '/events' },
      { label: 'This week', to: '/events?when=week' },
      { label: 'Free events', to: '/events?price=free' },
      { label: 'Past events', to: '/events?when=past' },
    ],
  },
  {
    title: 'Your stuff',
    links: [
      { label: 'My tickets', to: '/tickets' },
      { label: 'Saved events', to: '/tickets?tab=saved' },
      { label: 'Register', to: '/register' },
      { label: 'Verify a ticket', to: '/verify' },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'Source on GitHub', href: SITE.repo },
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line bg-surface/40">
      <div className="container-x pt-16 pb-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="space-y-6">
            <h2 className="font-display-tight max-w-sm text-4xl font-bold">
              Get the weekly <span className="font-serif font-normal italic">lineup.</span>
            </h2>
            <p className="max-w-sm text-sm text-muted">The best events near you, hand-picked every Friday. No spam, unsubscribe any time.</p>
            <Newsletter />
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="mb-4 font-mono text-[11px] tracking-[0.2em] text-muted uppercase">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.href ? (
                        <a href={l.href} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-1 text-sm text-fg-2 hover:text-fg">
                          {l.label}
                          <ArrowUpRight className="size-3.5 opacity-50 transition group-hover:opacity-100" />
                        </a>
                      ) : (
                        <Link to={l.to} className="text-sm text-fg-2 transition-colors hover:text-fg">
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none mt-16 flex items-end justify-center gap-4 select-none"
          aria-hidden
        >
          <span className="font-display-tight bg-gradient-to-b from-fg to-fg/0 bg-clip-text text-[clamp(5rem,22vw,20rem)] leading-[0.8] font-black text-transparent">
            encore
          </span>
        </motion.div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 text-xs text-muted sm:flex-row">
          <div className="flex items-center gap-2">
            <LogoMark className="size-5" />
            <span>© {new Date().getFullYear()} Encore · Built for K Explore — Web Designing</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              Made with <Heart className="size-3.5 fill-[#ff4d8d] text-[#ff4d8d]" /> in Bhubaneswar
            </span>
            <a href={SITE.repo} target="_blank" rel="noreferrer" className="hover:text-fg" aria-label="GitHub repository">
              <Github className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
