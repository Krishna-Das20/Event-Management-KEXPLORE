import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';
import { Cloud, Sparkles, Ticket, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { LogoMark } from '@/components/ui/Logo';
import { qk, useSession, useSignIn } from '@/lib/queries';
import { endpoints } from '@/lib/api';
import { useTheme } from '@/providers/ThemeProvider';
import { useUiStore } from '@/store/ui';

export const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

/** Shared success/error handling for every Google entry point (button + One Tap). */
function useGoogleCredentialHandler() {
  const signIn = useSignIn();
  const setSignInOpen = useUiStore((s) => s.setSignInOpen);
  return {
    pending: signIn.isPending,
    handle: (credential) =>
      signIn.mutate(credential, {
        onSuccess: ({ user, claimed }) => {
          setSignInOpen(false);
          toast.success(`Welcome, ${user.name.split(' ')[0]}!`, {
            description: claimed ? `We found ${claimed} ticket${claimed > 1 ? 's' : ''} booked with your email and added them to your account.` : 'Your tickets now sync across devices.',
          });
        },
        onError: (err) => toast.error('Sign-in failed', { description: err.message }),
      }),
  };
}

const PERKS = [
  { icon: Cloud, text: 'Tickets sync across all your devices' },
  { icon: Zap, text: 'Registration forms fill themselves in' },
  { icon: Ticket, text: 'Cancel or manage bookings any time' },
];

// Phones and in-app browsers (Instagram, WhatsApp…) often block or mangle popups,
// so they use Google's full-page redirect flow; desktops get the smoother popup.
const prefersRedirect = () =>
  window.matchMedia('(pointer: coarse)').matches || /FBAN|FBAV|Instagram|Line\/|WhatsApp|; wv\)/i.test(navigator.userAgent);

const RETURN_KEY = 'encore.returnTo';

/** Measures its own width first so the Google button (an iframe) fills the dialog without re-mounting. */
function GoogleButton({ onCredential, mode }) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);
  const measure = useCallback((node) => {
    if (node) setWidth(Math.min(400, Math.round(node.offsetWidth)));
  }, []);

  return (
    <div ref={measure} className="flex min-h-11 w-full justify-center">
      {width > 0 && (
        <GoogleLogin
          key={`${theme}-${mode}`}
          onSuccess={({ credential }) => onCredential(credential)}
          onError={() => toast.error('Google sign-in was cancelled or blocked by the browser.')}
          click_listener={() => sessionStorage.setItem(RETURN_KEY, window.location.pathname + window.location.search)}
          ux_mode={mode}
          login_uri={mode === 'redirect' ? `${window.location.origin}/api/auth/google/redirect` : undefined}
          theme={theme === 'dark' ? 'filled_black' : 'outline'}
          shape="pill"
          size="large"
          text="continue_with"
          width={String(width)}
          logo_alignment="center"
        />
      )}
    </div>
  );
}

/** After Google's redirect flow lands on /?signin=…, greet the user and send them back where they were. */
export function SignInReturnHandler() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const status = params.get('signin');

  useEffect(() => {
    if (!status) return;
    const returnTo = sessionStorage.getItem(RETURN_KEY) || '/';
    sessionStorage.removeItem(RETURN_KEY);
    if (status === 'success') {
      const claimed = Number(params.get('claimed') ?? 0);
      queryClient.fetchQuery({ queryKey: qk.me, queryFn: endpoints.me, staleTime: 0 }).then(({ user }) => {
        queryClient.invalidateQueries({ queryKey: qk.myRegistrations });
        if (user)
          toast.success(`Welcome, ${user.name.split(' ')[0]}!`, {
            description: claimed ? `We found ${claimed} ticket${claimed > 1 ? 's' : ''} booked with your email and added them to your account.` : 'Your tickets now sync across devices.',
          });
      });
    } else {
      toast.error('Sign-in failed', { description: 'Google sign-in could not be completed. Please try again.' });
    }
    navigate(returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/', { replace: true });
  }, [status, params, navigate, queryClient]);

  return null;
}

export function SignInDialog() {
  const open = useUiStore((s) => s.signInOpen);
  const reason = useUiStore((s) => s.signInReason);
  const setOpen = useUiStore((s) => s.setSignInOpen);
  const { handle, pending } = useGoogleCredentialHandler();
  const [mode, setMode] = useState(prefersRedirect() ? 'redirect' : 'popup');

  return (
    <Dialog open={open} onOpenChange={setOpen} title="Sign in to Encore" hideTitle size="sm">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-accent/30 blur-2xl" />
          <LogoMark className="size-14" />
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight">Welcome to Encore</h2>
        <p className="mt-2 text-sm text-muted">{reason ?? 'Sign in with Google to keep your tickets safe in the cloud.'}</p>

        <ul className="mt-6 w-full space-y-2.5 text-left">
          {PERKS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/60 px-4 py-3 text-sm">
              <Icon className="size-4 shrink-0 text-accent-text" aria-hidden />
              {text}
            </li>
          ))}
        </ul>

        <div className="mt-7 w-full">
          {GOOGLE_ENABLED ? (
            <>
              <GoogleButton onCredential={handle} mode={mode} />
              {mode === 'popup' && (
                <button type="button" onClick={() => setMode('redirect')} className="mt-3 text-xs text-muted underline underline-offset-4 hover:text-fg">
                  Popup blocked? Use full-page sign-in
                </button>
              )}
            </>
          ) : (
            <p className="rounded-xl bg-surface-2 p-3 text-sm text-muted">Google sign-in isn’t configured for this deployment.</p>
          )}
          {pending && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted">
              <Sparkles className="size-4 animate-pulse" /> Signing you in…
            </p>
          )}
        </div>
        <p className="mt-6 text-xs text-muted">
          No account needed to register — signing in is optional. We only read your name, email and profile photo.
        </p>
      </div>
    </Dialog>
  );
}

/** Google One Tap prompt for returning visitors (shown once per session, after a short delay). */
function OneTapPrompt() {
  const { handle } = useGoogleCredentialHandler();
  useGoogleOneTapLogin({
    onSuccess: ({ credential }) => handle(credential),
    onError: () => {},
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: true,
  });
  return null;
}

export function OneTap() {
  const { user, isLoading } = useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoading || user || !GOOGLE_ENABLED) return;
    if (sessionStorage.getItem('encore.onetap')) return;
    const id = setTimeout(() => {
      sessionStorage.setItem('encore.onetap', '1');
      setReady(true);
    }, 6000);
    return () => clearTimeout(id);
  }, [isLoading, user]);

  return ready && !user ? <OneTapPrompt /> : null;
}
