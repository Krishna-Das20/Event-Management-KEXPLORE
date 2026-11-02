import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { Menu, Search, Ticket, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from '@/components/auth/UserMenu';
import { GOOGLE_ENABLED } from '@/components/auth/SignInDialog';
import { useSession } from '@/lib/queries';
import { useTicketStore } from '@/store/tickets';
import { useUiStore } from '@/store/ui';
import { cn } from '@/lib/cn';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/events', label: 'Explore' },
  { to: '/register', label: 'Register' },
  { to: '/tickets', label: 'My Tickets' },
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

function useActiveTicketCount() {
  return useTicketStore((s) => s.tickets.filter((t) => t.status === 'confirmed' || t.status === 'pending').length);
}

export function Navbar() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, isLoading } = useSession();
  const openSignIn = useUiStore((s) => s.openSignIn);
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const ticketCount = useActiveTicketCount();
  // Event pages open on a full-bleed photo: keep the glass bar from the start for legibility.
  const overMedia = /^\/events\/[^/]+/.test(pathname);

  // Hide on scroll down, reveal on scroll up.
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > 320 && y > prev && !mobileOpen);
  });

  // Close the mobile menu on navigation (render-phase reset, no effect needed).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    document.documentElement.style.overflow = mobileOpen ? 'hidden' : '';
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: hidden ? -110 : 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4"
      >
        <nav
          aria-label="Main"
          className={cn(
            'mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 rounded-full border pr-2 pl-4 transition-all duration-500 sm:pl-5',
            scrolled || mobileOpen || overMedia
              ? 'border-line bg-surface/75 shadow-[0_10px_40px_-20px_rgb(0_0_0/0.4)] backdrop-blur-xl backdrop-saturate-150'
              : 'border-transparent bg-transparent',
          )}
        >
          <Link to="/" className="group shrink-0" aria-label="Encore home">
            <Logo />
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.end} className="relative block rounded-full px-4 py-2 text-sm font-medium">
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-full bg-surface-2"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className={cn('relative inline-flex items-center gap-1.5', isActive ? 'text-fg' : 'text-muted hover:text-fg')}>
                        {link.label}
                        {link.to === '/tickets' && ticketCount > 0 && (
                          <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-fg">
                            {ticketCount}
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden h-10 items-center gap-2 rounded-full border border-line bg-surface/60 pr-2 pl-3.5 text-sm text-muted transition hover:border-line-strong hover:text-fg md:inline-flex"
            >
              <Search className="size-4" />
              <span className="pr-6">Search events…</span>
              <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]">{isMac ? '⌘' : 'Ctrl'} K</kbd>
            </button>
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="grid size-10 place-items-center rounded-full transition hover:bg-surface-2 md:hidden"
              aria-label="Search events"
            >
              <Search className="size-[18px]" />
            </button>
            <ThemeToggle />
            {!isLoading &&
              (user ? (
                <UserMenu user={user} />
              ) : (
                GOOGLE_ENABLED && (
                  <Button size="sm" variant="dark" className="hidden sm:inline-flex" onClick={() => openSignIn()}>
                    Sign in
                  </Button>
                )
              ))}
            <Button asChild size="sm" className="hidden xl:inline-flex">
              <Link to="/events">
                <Ticket className="size-4" /> Get tickets
              </Link>
            </Button>
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="grid size-10 place-items-center rounded-full transition hover:bg-surface-2 lg:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ clipPath: 'circle(0% at 100% 0%)' }}
            animate={{ clipPath: 'circle(150% at 100% 0%)' }}
            exit={{ clipPath: 'circle(0% at 100% 0%)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 flex flex-col bg-bg px-6 pt-28 pb-10 lg:hidden"
          >
            <ul className="space-y-2">
              {LINKS.map((link, i) => (
                <motion.li
                  key={link.to}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      cn('flex items-baseline gap-3 font-display-tight text-5xl font-bold', isActive ? 'text-fg' : 'text-muted')
                    }
                  >
                    <span className="font-mono text-sm font-normal text-muted">0{i + 1}</span>
                    {link.label}
                  </NavLink>
                </motion.li>
              ))}
            </ul>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mt-auto flex flex-col gap-3"
            >
              {!user && GOOGLE_ENABLED && (
                <Button size="lg" variant="dark" onClick={() => openSignIn()}>
                  Sign in with Google
                </Button>
              )}
              <Button asChild size="lg">
                <Link to="/events">
                  <Ticket className="size-5" /> Browse events
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
