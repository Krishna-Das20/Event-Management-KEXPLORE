import { useEffect, useLayoutEffect, useState } from 'react';
import { Outlet, useLocation, useNavigation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Toaster } from 'sonner';
import { DatabaseZap, WifiOff } from 'lucide-react';
import { useUiStore } from '@/store/ui';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CommandPalette } from './CommandPalette';
import { SignInDialog, SignInReturnHandler, OneTap } from '@/components/auth/SignInDialog';
import { SmoothScroll, useLenis } from '@/providers/SmoothScroll';
import { TicketSync } from '@/providers/TicketSync';
import { useTheme } from '@/providers/ThemeProvider';

/** Jump to the top on page changes (but not on query-string-only changes like filters). */
function ScrollManager() {
  const { pathname } = useLocation();
  const lenis = useLenis();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    lenis?.scrollTo(0, { immediate: true, force: true });
  }, [pathname, lenis]);
  return null;
}

/** Thin progress bar while a lazily-loaded route is being fetched. */
function RouteProgress() {
  const navigation = useNavigation();
  const busy = navigation.state !== 'idle';
  return (
    <AnimatePresence>
      {busy && (
        <motion.div
          className="fixed inset-x-0 top-0 z-[100] h-0.5 origin-left bg-accent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 0.85, transition: { duration: 2.5, ease: [0.16, 1, 0.3, 1] } }}
          exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.3 } }}
        />
      )}
    </AnimatePresence>
  );
}

function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          role="status"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-4 left-1/2 z-[95] flex -translate-x-1/2 items-center gap-2 rounded-full bg-fg px-4 py-2.5 text-sm text-bg shadow-2xl"
        >
          <WifiOff className="size-4" /> You’re offline — new registrations will be saved and synced automatically.
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Shown when the API is unreachable and pages are rendering the bundled catalogue. */
function FallbackNotice() {
  const usingFallback = useUiStore((s) => s.usingFallback);
  return (
    <AnimatePresence>
      {usingFallback && (
        <motion.div
          role="status"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-4 left-4 z-[94] flex max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-2xl border border-line bg-surface/90 px-4 py-3 text-sm shadow-2xl backdrop-blur-xl"
        >
          <DatabaseZap className="size-4 shrink-0 text-[#ffa920]" />
          <span>
            <span className="font-semibold">Showing a cached lineup.</span>{' '}
            <span className="text-muted">Live seat counts are reconnecting — registrations are saved and synced automatically.</span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function RootLayout() {
  const { pathname } = useLocation();
  const { theme } = useTheme();

  return (
    <SmoothScroll>
      <a
        href="#main"
        className="fixed top-3 left-3 z-[200] -translate-y-20 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition focus:translate-y-0"
      >
        Skip to content
      </a>
      <RouteProgress />
      <ScrollManager />
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main id="main" className="flex-1">
          {/* Opacity only: a transform here would break `position: fixed` children (e.g. mobile CTA bars). */}
          <motion.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
            <Outlet />
          </motion.div>
        </main>
        <Footer />
      </div>
      <CommandPalette />
      <SignInDialog />
      <OneTap />
      <SignInReturnHandler />
      <TicketSync />
      <OfflineBanner />
      <FallbackNotice />
      <Toaster
        theme={theme}
        position="bottom-right"
        closeButton
        toastOptions={{
          classNames: {
            toast: '!rounded-2xl !border-line !bg-surface !text-fg !shadow-2xl !font-sans',
            description: '!text-muted',
          },
        }}
      />
    </SmoothScroll>
  );
}
