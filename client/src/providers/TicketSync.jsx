import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { endpoints, isUnavailable } from '@/lib/api';
import { qk, useMyRegistrations, useSession } from '@/lib/queries';
import { useTicketStore } from '@/store/tickets';

/**
 * Keeps the Local Storage wallet in sync:
 *  1. merges the signed-in user's server tickets into the wallet;
 *  2. flushes registrations queued while offline whenever the browser is back online.
 */
export function TicketSync() {
  const { user } = useSession();
  const { data } = useMyRegistrations(Boolean(user));
  const mergeFromServer = useTicketStore((s) => s.mergeFromServer);
  const queryClient = useQueryClient();
  const flushing = useRef(false);

  useEffect(() => {
    if (data?.registrations) mergeFromServer(data.registrations);
  }, [data, mergeFromServer]);

  useEffect(() => {
    async function flush() {
      if (flushing.current || !navigator.onLine) return;
      const pending = useTicketStore.getState().tickets.filter((t) => t.status === 'pending' && t.payload);
      if (!pending.length) return;
      flushing.current = true;
      const { resolvePending, failPending } = useTicketStore.getState();
      let synced = 0;
      for (const ticket of pending) {
        try {
          const { registration } = await endpoints.register(ticket.payload);
          resolvePending(ticket.ticketCode, registration);
          synced += 1;
        } catch (err) {
          // Server/database still unavailable → keep it queued; a real rejection (e.g. sold out) → mark failed.
          if (!isUnavailable(err)) failPending(ticket.ticketCode, err.message);
        }
      }
      flushing.current = false;
      if (synced) {
        toast.success(`${synced} offline registration${synced > 1 ? 's' : ''} confirmed`, {
          description: 'Your tickets are now saved on the server.',
        });
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: qk.myRegistrations });
      }
    }

    flush();
    // Retry when connectivity returns, and every minute in case the server (not the network) was down.
    const id = setInterval(flush, 60_000);
    window.addEventListener('online', flush);
    return () => {
      clearInterval(id);
      window.removeEventListener('online', flush);
    };
  }, [queryClient]);

  return null;
}
