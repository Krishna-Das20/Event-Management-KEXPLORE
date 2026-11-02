import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { BadgeCheck, CircleX, ScanLine, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/SectionHeading';
import { TicketVisual } from '@/components/registration/TicketVisual';
import { endpoints } from '@/lib/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/cn';

const CODE_RE = /^ENC-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/** Door-check page: scanning a ticket's QR lands here and shows whether it's valid. */
export default function Verify() {
  const { code: raw } = useParams();
  const code = raw?.toUpperCase();
  const navigate = useNavigate();
  const [input, setInput] = useState(code ?? '');
  const [touched, setTouched] = useState(false);
  useDocumentTitle('Verify ticket');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['verify', code],
    queryFn: () => endpoints.verifyTicket(code),
    enabled: Boolean(code && CODE_RE.test(code)),
    retry: false,
  });
  const reg = data?.registration;
  const valid = reg?.status === 'confirmed' && new Date(reg.event.endDate) > new Date();
  const inputValid = CODE_RE.test(input.trim().toUpperCase());

  return (
    <div className="container-x max-w-3xl pt-32 pb-10">
      <Eyebrow className="mb-4">Door check</Eyebrow>
      <h1 className="font-display-tight text-[clamp(2.6rem,6vw,4.5rem)] font-extrabold">
        Verify a <span className="font-serif font-normal italic">ticket</span>
      </h1>
      <p className="mt-3 text-muted">Scan the QR on any Encore ticket, or type its code below.</p>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (inputValid) navigate(`/verify/${input.trim().toUpperCase()}`);
        }}
        className="mt-8"
      >
        <div className="flex gap-2 rounded-full border border-line bg-surface p-1.5">
          <label htmlFor="ticket-code" className="sr-only">
            Ticket code
          </label>
          <ScanLine className="ml-3 size-5 shrink-0 self-center text-muted" />
          <input
            id="ticket-code"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="ENC-XXXX-XXXX"
            maxLength={13}
            className="min-w-0 flex-1 bg-transparent font-mono text-lg tracking-widest uppercase outline-none placeholder:text-muted"
            aria-invalid={touched && !inputValid}
          />
          <Button type="submit">
            <Search className="size-4" /> Check
          </Button>
        </div>
        {touched && !inputValid && <p className="mt-2 pl-4 text-sm text-danger">Ticket codes look like ENC-7KQ2-X9MF.</p>}
      </form>

      {code && (
        <div className="mt-10">
          {isLoading ? (
            <div className="skeleton h-96 rounded-[28px]" />
          ) : isError ? (
            <div className="flex items-center gap-4 rounded-[24px] border border-danger/40 bg-danger/8 p-6">
              <CircleX className="size-10 shrink-0 text-danger" />
              <div>
                <div className="font-display text-2xl font-bold">Not a valid ticket</div>
                <p className="text-sm text-muted">{error?.message}</p>
              </div>
            </div>
          ) : reg ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid items-start gap-8 md:grid-cols-[1fr_340px]">
              <div className={cn('rounded-[24px] p-6', valid ? 'bg-success/12' : 'bg-danger/10')}>
                {valid ? <BadgeCheck className="size-12 text-success" /> : <CircleX className="size-12 text-danger" />}
                <div className="mt-4 font-display text-3xl font-bold tracking-tight">{valid ? 'Valid ticket' : reg.status === 'cancelled' ? 'Ticket cancelled' : 'Event has ended'}</div>
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Attendee</dt>
                    <dd className="font-semibold">{reg.name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Email</dt>
                    <dd className="font-mono">{reg.email}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Admits</dt>
                    <dd className="font-semibold">{reg.tickets}</dd>
                  </div>
                </dl>
                <Button asChild variant="secondary" className="mt-6">
                  <Link to={`/events/${reg.event.slug}`}>View event</Link>
                </Button>
              </div>
              <TicketVisual event={reg.event} name={reg.name} tickets={reg.tickets} code={reg.ticketCode} status={reg.status} />
            </motion.div>
          ) : null}
        </div>
      )}
    </div>
  );
}
