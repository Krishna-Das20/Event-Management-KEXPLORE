import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { ArrowRight, CloudOff, Download, Info, LockKeyhole, Minus, PartyPopper, Plus, Ticket, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/SectionHeading';
import { Field } from '@/components/registration/Field';
import { inputCls } from '@/components/registration/inputCls';
import { EventPicker } from '@/components/registration/EventPicker';
import { TicketVisual } from '@/components/registration/TicketVisual';
import { AddToCalendar } from '@/components/events/EventActions';
import { GOOGLE_ENABLED } from '@/components/auth/SignInDialog';
import { useEvents, useRegister, useSession } from '@/lib/queries';
import { isUnavailable } from '@/lib/api';
import { COUNTRIES, COUNTRY_MAP, digitsOnly, formatPhone, registrationResolver, suggestEmail } from '@/lib/validation';
import { MAX_TICKETS } from '@/lib/constants';
import { formatPrice } from '@/lib/format';
import { downloadNodeAsPng } from '@/lib/download';
import { useTicketStore } from '@/store/tickets';
import { useUiStore } from '@/store/ui';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { scrollToTarget, useLenis } from '@/providers/SmoothScroll';
import { cn } from '@/lib/cn';

const DRAFT_KEY = 'encore.contact';

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY)) ?? {};
  } catch {
    return {};
  }
}

function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#d2ff3a', '#ff4d8d', '#2fc7f0', '#ffa920', '#ffffff'];
  const fire = (ratio, opts) => confetti({ origin: { y: 0.6 }, particleCount: Math.floor(220 * ratio), colors, ...opts });
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

function TicketStepper({ value, onChange, max }) {
  return (
    <div className="inline-flex items-center rounded-2xl border border-line bg-surface p-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="grid size-10 place-items-center rounded-xl transition hover:bg-surface-2 disabled:opacity-30"
        aria-label="Fewer tickets"
      >
        <Minus className="size-4" />
      </button>
      <output className="w-12 text-center font-mono text-xl font-bold tabular" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="grid size-10 place-items-center rounded-xl transition hover:bg-surface-2 disabled:opacity-30"
        aria-label="More tickets"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function SuccessView({ ticket, event, offline, onAnother }) {
  const ticketRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const first = ticket.name.split(' ')[0];

  const download = async () => {
    setDownloading(true);
    try {
      await downloadNodeAsPng(ticketRef.current, `encore-ticket-${ticket.ticketCode}.png`);
    } catch {
      toast.error('Couldn’t generate the image. Try a screenshot instead.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="grid items-start gap-10 lg:grid-cols-[1fr_420px]"
      role="status"
      aria-live="polite"
    >
      <div>
        <span className={cn('grid size-16 place-items-center rounded-2xl', offline ? 'bg-[#ffa920] text-black' : 'bg-accent text-accent-fg')}>
          {offline ? <CloudOff className="size-7" /> : <PartyPopper className="size-7" />}
        </span>
        <h1 className="font-display-tight mt-6 text-[clamp(2.8rem,7vw,5rem)] font-extrabold">
          {offline ? (
            <>Saved offline, {first}.</>
          ) : (
            <>
              You’re in, <span className="font-serif font-normal italic">{first}!</span>
            </>
          )}
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted">
          {offline ? (
            <>
              We couldn’t reach the server, so your registration for <strong className="text-fg">{event.title}</strong> is stored on this device and
              will be confirmed automatically as soon as you’re back online.
            </>
          ) : (
            <>
              Your registration for <strong className="text-fg">{event.title}</strong> is confirmed. We’ve saved the ticket to “My Tickets” on this
              device — show the QR code at the entrance.
            </>
          )}
        </p>

        <dl className="mt-8 grid max-w-lg grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line text-sm">
          {[
            ['Ticket code', ticket.ticketCode],
            ['Admits', `${ticket.tickets} ${ticket.tickets === 1 ? 'person' : 'people'}`],
            ['Email', ticket.email],
            ['Total', event.price ? `${formatPrice(event.price * ticket.tickets)} (pay at venue)` : 'Free'],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface p-4">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="mt-1 truncate font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" variant="dark">
            <Link to="/tickets">
              <Ticket className="size-5" /> My tickets
            </Link>
          </Button>
          {!offline && (
            <Button size="lg" variant="secondary" onClick={download} loading={downloading}>
              <Download className="size-4" /> Download ticket
            </Button>
          )}
          <AddToCalendar event={event} ticketCode={ticket.ticketCode} className="h-14 flex-none px-6" />
        </div>
        <button type="button" onClick={onAnother} className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
          Register for another event <ArrowRight className="size-4" />
        </button>
      </div>

      <motion.div initial={{ rotate: -6, y: 40, opacity: 0 }} animate={{ rotate: -2, y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.15 }}>
        <TicketVisual ref={ticketRef} event={event} name={ticket.name} tickets={ticket.tickets} code={ticket.ticketCode} status={offline ? 'pending' : 'confirmed'} />
      </motion.div>
    </motion.div>
  );
}

export default function Register() {
  useDocumentTitle('Register', 'Register for an upcoming event on Encore in under a minute.');
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const lenis = useLenis();
  const { user } = useSession();
  const openSignIn = useUiStore((s) => s.openSignIn);
  const tickets = useTicketStore((s) => s.tickets);
  const addPending = useTicketStore((s) => s.addPending);
  const register = useRegister();
  const [result, setResult] = useState(null);

  const { data, isLoading: eventsLoading } = useEvents({ when: 'upcoming', limit: 48, sort: 'date' });
  const events = useMemo(() => (data?.items ?? []).filter((e) => e.status === 'upcoming' || e.status === 'sold-out'), [data]);
  const preselected = events.find((e) => e.slug === params.get('event'));

  const draft = useMemo(loadDraft, []);
  const {
    control,
    register: field,
    handleSubmit,
    setValue,
    setError,
    setFocus,
    trigger,
    getValues,
    reset,
    formState: { errors, touchedFields, isSubmitting },
  } = useForm({
    resolver: registrationResolver,
    mode: 'onTouched',
    defaultValues: {
      eventId: '',
      name: draft.name ?? '',
      email: draft.email ?? '',
      countryCode: draft.countryCode ?? '+91',
      phone: draft.phone ?? '',
      tickets: 1,
      agree: false,
    },
  });

  const values = useWatch({ control });
  const selectedEvent = events.find((e) => e.id === values.eventId);
  const maxTickets = Math.max(1, Math.min(MAX_TICKETS, selectedEvent?.seatsLeft ?? MAX_TICKETS));
  const emailSuggestion = suggestEmail(values.email);
  const country = COUNTRY_MAP[values.countryCode] ?? COUNTRIES[0];
  const alreadyHave = tickets.find(
    (t) => t.event?.id === values.eventId && t.email?.toLowerCase() === values.email?.trim().toLowerCase() && t.status !== 'cancelled' && t.status !== 'failed',
  );

  // Preselect the event from ?event=slug once the list has loaded.
  useEffect(() => {
    if (preselected && !values.eventId) setValue('eventId', preselected.id);
  }, [preselected, values.eventId, setValue]);

  // Prefill from the Google account if the fields are still empty.
  useEffect(() => {
    if (!user) return;
    if (!values.name) setValue('name', user.name);
    if (!values.email) setValue('email', user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Clamp tickets when switching to an event with fewer seats.
  useEffect(() => {
    if (values.tickets > maxTickets) setValue('tickets', maxTickets);
  }, [maxTickets, values.tickets, setValue]);

  // Keep the URL shareable: ?event=<slug> follows the picker.
  const onPickEvent = (id) => {
    setValue('eventId', id, { shouldValidate: true, shouldTouch: true });
    const slug = events.find((e) => e.id === id)?.slug;
    if (slug) setParams({ event: slug }, { replace: true, preventScrollReset: true });
  };

  // Autosave contact details on this device.
  const [savedAt, setSavedAt] = useState(null);
  useEffect(() => {
    const id = setTimeout(() => {
      const contact = { name: values.name, email: values.email, countryCode: values.countryCode, phone: values.phone };
      if (!contact.name && !contact.email && !contact.phone) return;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(contact));
      setSavedAt(Date.now());
    }, 600);
    return () => clearTimeout(id);
  }, [values.name, values.email, values.countryCode, values.phone]);

  const forgetDetails = () => {
    localStorage.removeItem(DRAFT_KEY);
    reset({ ...values, name: '', email: '', phone: '' });
    setSavedAt(null);
    toast('Saved details cleared from this device');
  };

  const onInvalid = (errs) => {
    const order = ['eventId', 'name', 'email', 'phone', 'tickets', 'agree'];
    const first = order.find((k) => errs[k]);
    if (first && first !== 'eventId') setFocus(first);
    toast.error('Please fix the highlighted fields', { description: errs[first]?.message });
  };

  const onSubmit = async (form) => {
    const payload = {
      eventId: form.eventId,
      name: form.name.trim().replace(/\s+/g, ' '),
      email: form.email.trim().toLowerCase(),
      countryCode: form.countryCode,
      phone: digitsOnly(form.phone),
      tickets: Number(form.tickets),
    };
    try {
      const { registration } = await register.mutateAsync(payload);
      setResult({ ticket: registration, event: selectedEvent, offline: false });
      celebrate();
      scrollToTarget(lenis, 0, { immediate: true });
    } catch (err) {
      if (isUnavailable(err)) {
        const code = addPending({ payload, event: selectedEvent });
        setResult({ ticket: { ...payload, ticketCode: code }, event: selectedEvent, offline: true });
        scrollToTarget(lenis, 0, { immediate: true });
        return;
      }
      if (err.fields) {
        for (const [key, message] of Object.entries(err.fields)) {
          if (key in form) setError(key, { type: 'server', message });
        }
      }
      if (err.code === 'ALREADY_REGISTERED') {
        toast.error('Already registered', {
          description: 'This email already has a ticket for this event.',
          action: { label: 'My tickets', onClick: () => navigate('/tickets') },
        });
      } else {
        toast.error('Registration failed', { description: err.message });
      }
    }
  };

  const startOver = () => {
    setResult(null);
    scrollToTarget(lenis, 0, { immediate: true });
    reset({ ...values, eventId: '', tickets: 1, agree: false });
    setParams({}, { replace: true });
  };

  if (result) {
    return (
      <div className="container-x pt-32 pb-10">
        <SuccessView ticket={result.ticket} event={result.event} offline={result.offline} onAnother={startOver} />
      </div>
    );
  }

  const busy = isSubmitting || register.isPending;
  const total = selectedEvent ? selectedEvent.price * (values.tickets || 1) : 0;

  return (
    <div className="container-x pt-32 pb-10">
      <div className="grid items-start gap-12 lg:grid-cols-[1fr_400px] xl:gap-20">
        <div>
          <Eyebrow className="mb-4">Registration</Eyebrow>
          <h1 className="font-display-tight text-[clamp(2.6rem,6vw,4.5rem)] font-extrabold">
            Save your <span className="font-serif font-normal italic">spot.</span>
          </h1>
          <p className="mt-3 max-w-lg text-muted">Takes about 30 seconds. Your details are validated as you type and never shared with third parties.</p>

          {!user && GOOGLE_ENABLED && (
            <button
              type="button"
              onClick={() => openSignIn('Sign in to fill this form automatically and sync your tickets.')}
              className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-surface/50 p-4 text-left text-sm transition hover:bg-surface"
            >
              <Wand2 className="size-5 shrink-0 text-accent-text" />
              <span>
                <span className="font-semibold">Skip the typing.</span> <span className="text-muted">Sign in with Google to autofill and sync your tickets.</span>
              </span>
              <ArrowRight className="ml-auto size-4 shrink-0" />
            </button>
          )}

          <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="mt-10 space-y-7" aria-label="Event registration form">
            <Field id="eventId" label="Event" required error={errors.eventId?.message}>
              <Controller
                control={control}
                name="eventId"
                render={({ field: f }) => (
                  <EventPicker id="eventId" events={events} value={f.value} onChange={onPickEvent} onBlur={f.onBlur} error={errors.eventId?.message} loading={eventsLoading} />
                )}
              />
            </Field>

            <div className="grid gap-7 sm:grid-cols-2">
              <Field id="name" label="Full name" required error={errors.name?.message} valid={touchedFields.name && !errors.name && values.name}>
                <input
                  id="name"
                  autoComplete="name"
                  placeholder="e.g. Krishna Das"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className={inputCls(errors.name)}
                  {...field('name')}
                />
              </Field>

              <Field
                id="email"
                label="Email address"
                required
                error={errors.email?.message}
                valid={touchedFields.email && !errors.email && values.email}
                hint={!errors.email && !emailSuggestion ? 'Your ticket is linked to this email.' : undefined}
              >
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : 'email-hint'}
                  className={inputCls(errors.email)}
                  {...field('email')}
                />
              </Field>
            </div>

            <AnimatePresence>
              {emailSuggestion && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="-mt-4">
                  <p className="flex flex-wrap items-center gap-2 rounded-xl bg-[#ffa920]/12 px-4 py-2.5 text-sm">
                    <Info className="size-4 text-[#ffa920]" /> Did you mean <strong>{emailSuggestion}</strong>?
                    <button
                      type="button"
                      onClick={() => setValue('email', emailSuggestion, { shouldValidate: true })}
                      className="font-semibold underline underline-offset-4"
                    >
                      Use it
                    </button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <Field
              id="phone"
              label="Mobile number"
              required
              error={errors.phone?.message}
              valid={touchedFields.phone && !errors.phone && values.phone}
              hint={`${country.name}: ${country.length} digits, e.g. ${country.example}`}
            >
              <div className="flex gap-2">
                <label htmlFor="countryCode" className="sr-only">
                  Country code
                </label>
                <select
                  id="countryCode"
                  autoComplete="tel-country-code"
                  className="h-13 shrink-0 rounded-2xl border border-line bg-surface px-3 text-[15px] outline-none hover:border-line-strong focus:ring-4 focus:ring-[color-mix(in_oklab,var(--accent)_35%,transparent)]"
                  {...field('countryCode', {
                    // Re-format and re-validate the number for the newly selected country.
                    onChange: (e) => {
                      setValue('phone', formatPhone(getValues('phone'), e.target.value));
                      if (touchedFields.phone) trigger('phone');
                    },
                  })}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: f }) => (
                    <input
                      id="phone"
                      ref={f.ref}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder={country.example}
                      value={f.value}
                      onChange={(e) => f.onChange(formatPhone(e.target.value, values.countryCode))}
                      onBlur={f.onBlur}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
                      className={inputCls(errors.phone, 'tabular font-mono tracking-wide')}
                    />
                  )}
                />
              </div>
            </Field>

            <Field
              id="tickets"
              label="Number of tickets"
              error={errors.tickets?.message}
              hint={selectedEvent ? `Up to ${maxTickets} per booking${selectedEvent.seatsLeft <= MAX_TICKETS ? ` — only ${selectedEvent.seatsLeft} seats left` : ''}.` : `Up to ${MAX_TICKETS} per booking.`}
            >
              <Controller control={control} name="tickets" render={({ field: f }) => <TicketStepper value={Number(f.value)} onChange={f.onChange} max={maxTickets} />} />
            </Field>

            <div className="space-y-2">
              <label className={cn('flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm transition', errors.agree ? 'border-danger' : 'border-line hover:border-line-strong')}>
                <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[var(--accent-text)]" aria-invalid={Boolean(errors.agree)} {...field('agree')} />
                <span className="text-fg-2">
                  I’ll follow the event guidelines and agree to Encore’s{' '}
                  <Link to="/terms" className="font-medium underline underline-offset-4" target="_blank">
                    terms
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="font-medium underline underline-offset-4" target="_blank">
                    privacy policy
                  </Link>
                  .
                </span>
              </label>
              {errors.agree && (
                <p role="alert" className="text-sm font-medium text-danger">
                  {errors.agree.message}
                </p>
              )}
            </div>

            <AnimatePresence>
              {alreadyHave && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-xl bg-[#2fc7f0]/12 px-4 py-3 text-sm"
                >
                  <Info className="size-4 shrink-0 text-[#2fc7f0]" />
                  <span>
                    You already have ticket <strong className="font-mono">{alreadyHave.ticketCode}</strong> for this event with this email.{' '}
                    <Link to="/tickets" className="font-semibold underline underline-offset-4">
                      View it
                    </Link>
                  </span>
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex flex-col-reverse gap-4 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs text-muted">
                <LockKeyhole className="size-3.5" />
                {savedAt ? (
                  <>
                    Contact details remembered on this device ·{' '}
                    <button type="button" onClick={forgetDetails} className="underline underline-offset-2 hover:text-fg">
                      forget
                    </button>
                  </>
                ) : (
                  'Secure registration · no payment required now'
                )}
              </p>
              <Button type="submit" size="lg" loading={busy} className="sm:min-w-64">
                {busy ? 'Confirming…' : selectedEvent ? `Confirm · ${total ? formatPrice(total) : 'Free'}` : 'Confirm registration'}
                {!busy && <ArrowRight className="size-4" />}
              </Button>
            </div>
          </form>
        </div>

        <aside className="lg:sticky lg:top-28" aria-label="Ticket preview">
          <div className="mb-3 flex items-center justify-between text-xs text-muted">
            <span className="font-mono tracking-[0.2em] uppercase">Live preview</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-success" /> updates as you type
            </span>
          </div>
          <motion.div key={selectedEvent?.id ?? 'none'} initial={{ rotateY: -14, opacity: 0.4 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} style={{ transformPerspective: 1000 }}>
            <TicketVisual event={selectedEvent} name={values.name?.trim()} tickets={Number(values.tickets) || 1} />
          </motion.div>
        </aside>
      </div>
    </div>
  );
}
