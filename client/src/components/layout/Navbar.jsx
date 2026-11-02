import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import { ClipboardPen, Compass, House, Menu, Search, Ticket, Tickets, X } from 'lucide-react';
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
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/events', label: 'Explore', icon: Compass },
  { to: '/register', label: 'Register', icon: ClipboardPen },
  { to: '/tickets', label: 'My Tickets', icon: Tickets },
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

/** How far the page moves before the bar contracts. */
const CONTRACT_AFTER = 24;

// The bar's width and each folding group share one curve, so the content never outruns the pill.
const EASE = 'duration-500 ease-out motion-reduce:transition-none';

function useActiveTicketCount() {
  return useTicketStore((s) => s.tickets.filter((t) => t.status === 'confirmed' || t.status === 'pending').length);
}

/**
 * A group of the bar that folds away by animating `max-width` (nothing is measured in JS).
 * Folded it's `invisible`, which also takes it out of the tab order and the accessibility tree.
 * `max` is kept near the real content width: a much larger cap spends the first part of the
 * transition doing nothing visible, which reads as a stutter.
 */
function Collapsible({ open, max, className, children }) {
  return (
    <div
      className={cn(
        'overflow-x-clip transition-[max-width,opacity,visibility]',
        EASE,
        open ? cn(max, 'visible opacity-100') : 'invisible max-w-0 opacity-0',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Navbar() {
  const { scrollY } = useScroll();
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(() => window.scrollY > CONTRACT_AFTER);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, isLoading } = useSession();
  const openSignIn = useUiStore((s) => s.openSignIn);
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const ticketCount = useActiveTicketCount();
  // Event pages open on a full-bleed photo: keep the glass bar from the start for legibility.
  const overMedia = /^\/events\/[^/]+/.test(pathname);

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > CONTRACT_AFTER));

  // Close the mobile menu on navigation (render-phase reset, no effect needed).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    document.documentElement.style.overflow = mobileOpen ? 'hidden' : '';
  }, [mobileOpen]);

  // Contracted while scrolled: the links turn into icons, so navigation stays one click away
  // and the bar doesn't need to re-open on hover. The open account menu keeps it expanded so
  // the menu stays anchored to the avatar. Reduced motion keeps it open: contracting *is* the
  // animation, and without it the bar would just snap between two shapes.
  const expanded = !scrolled || accountMenuOpen || mobileOpen || reduceMotion;

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4"
      >
        <nav
          aria-label="Main"
          data-expanded={expanded}
          className={cn(
            'mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 rounded-full border pr-2 pl-4 transition-all sm:pl-5',
            EASE,
            // Contracted: the spark, the links as icons (lg+), the account control and the call to action.
            expanded ? 'w-full' : 'w-[10rem] sm:w-[13rem] lg:w-[30rem]',
            scrolled || mobileOpen || overMedia
              ? 'border-line bg-surface/75 shadow-[0_10px_40px_-20px_rgb(0_0_0/0.4)] backdrop-blur-xl backdrop-saturate-150'
              : 'border-transparent bg-transparent',
          )}
        >
          <Link to="/" className="group shrink-0" aria-label="Encore home">
            <Logo compact={!expanded} />
          </Link>

          {/* One flex item holding both rows, so the folded row adds no gap of its own. */}
          <div className="hidden items-center lg:flex">
            <Collapsible open={expanded} max="max-w-[30rem]">
              {/* px-1.5: room for focus rings inside the clipping box. */}
              <ul className="flex items-center gap-1 px-1.5">
                {LINKS.map((link) => (
                  <li key={link.to}>
                    <NavLink to={link.to} end={link.end} className="relative block rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap">
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
            </Collapsible>

            <Collapsible open={!expanded} max="max-w-[12rem]">
              <ul className="flex items-center gap-0.5 px-1">
                {LINKS.map(({ to, end, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink to={to} end={end} aria-label={label} title={label} className="group/icon relative grid size-10 place-items-center rounded-full">
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="nav-active-icon"
                              className="absolute inset-0 rounded-full bg-surface-2"
                              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            />
                          )}
                          <Icon
                            className={cn('relative size-[18px] transition-colors', isActive ? 'text-fg' : 'text-muted group-hover/icon:text-fg')}
                            aria-hidden
                          />
                          {to === '/tickets' && ticketCount > 0 && (
                            <span className="absolute top-0.5 right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] leading-none font-bold text-accent-fg">
                              {ticketCount}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </Collapsible>
          </div>

          <div className="flex items-center">
            <Collapsible open={expanded} max="max-w-[20rem]">
              <div className="flex items-center gap-1 py-1 pr-1 pl-1.5 sm:gap-1.5 sm:pr-1.5">
                <button
                  type="button"
                  onClick={() => setPaletteOpen(true)}
                  className="hidden h-10 items-center gap-2 rounded-full border border-line bg-surface/60 pr-2 pl-3.5 text-sm whitespace-nowrap text-muted transition hover:border-line-strong hover:text-fg md:inline-flex"
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
              </div>
            </Collapsible>

            {!isLoading &&
              (user ? (
                <UserMenu user={user} onOpenChange={setAccountMenuOpen} />
              ) : (
                GOOGLE_ENABLED && (
                  <Button size="sm" variant="dark" className="hidden sm:inline-flex" onClick={() => openSignIn()}>
                    Sign in
                  </Button>
                )
              ))}

            {/* Shown when contracted; expanded, only from xl up, where the links leave room for it. */}
            <Collapsible
              open={!expanded}
              max="max-w-[10rem]"
              className={cn('hidden lg:block', expanded && 'xl:visible xl:max-w-[10rem] xl:opacity-100')}
            >
              <div className="py-1 pr-1 pl-2">
                <Button asChild size="sm" className="whitespace-nowrap">
                  <Link to="/events">
                    <Ticket className="size-4" /> Get tickets
                  </Link>
                </Button>
              </div>
            </Collapsible>

            {/* Never folds: on a phone it's the way to every page. */}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="ml-1 grid size-10 shrink-0 place-items-center rounded-full transition hover:bg-surface-2 lg:hidden"
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
