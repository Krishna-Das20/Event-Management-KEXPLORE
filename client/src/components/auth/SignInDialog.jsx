import { useEffect, useRef, useState } from 'react';
import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';
import { Cloud, Sparkles, Ticket, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { LogoMark } from '@/components/ui/Logo';
import { useSession, useSignIn } from '@/lib/queries';
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

/** Measures its own width so the Google button fills the dialog (it renders in an iframe). */
function GoogleButton({ onCredential }) {
  const { theme } = useTheme();
  const ref = useRef(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    if (ref.current) setWidth(Math.min(400, Math.round(ref.current.offsetWidth)));
  }, []);

  return (
    <div ref={ref} className="flex min-h-11 w-full justify-center">
      <GoogleLogin
        key={`${theme}-${width}`}
        onSuccess={({ credential }) => onCredential(credential)}
        onError={() => toast.error('Google sign-in was cancelled or blocked by the browser.')}
        theme={theme === 'dark' ? 'filled_black' : 'outline'}
        shape="pill"
        size="large"
        text="continue_with"
        width={String(width)}
        logo_alignment="center"
      />
    </div>
  );
}

export function SignInDialog() {
  const open = useUiStore((s) => s.signInOpen);
  const reason = useUiStore((s) => s.signInReason);
  const setOpen = useUiStore((s) => s.setSignInOpen);
  const { handle, pending } = useGoogleCredentialHandler();

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
            <GoogleButton onCredential={handle} />
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
