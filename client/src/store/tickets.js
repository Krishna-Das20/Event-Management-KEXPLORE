import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Local Storage–backed ticket wallet.
 *
 * Every registration made on this device is stored here so "My Tickets" works
 * instantly, offline and without an account. When the user signs in, tickets from
 * their account are merged in (and marked as synced). If a registration can't reach
 * the server (offline), it is kept as `pending` and retried automatically.
 */

/** Keep only what the wallet needs to render a ticket — not the whole event document. */
export const eventSnapshot = (e) =>
  e && {
    id: e.id,
    slug: e.slug,
    title: e.title,
    image: e.image,
    category: e.category,
    startDate: e.startDate,
    endDate: e.endDate,
    mode: e.mode,
    price: e.price,
    tagline: e.tagline,
    venue: e.venue && { name: e.venue.name, city: e.venue.city, address: e.venue.address },
  };

const fromServer = (r, synced = true) => ({
  ticketCode: r.ticketCode,
  status: r.status,
  name: r.name,
  email: r.email,
  phone: r.phone,
  tickets: r.tickets,
  createdAt: r.createdAt,
  cancelledAt: r.cancelledAt,
  event: eventSnapshot(r.event),
  synced,
  updatedAt: Date.now(),
});

export const useTicketStore = create()(
  persist(
    (set, get) => ({
      tickets: [],

      addFromServer: (registration) =>
        set((s) => ({
          tickets: [fromServer(registration), ...s.tickets.filter((t) => t.ticketCode !== registration.ticketCode)],
        })),

      /** Queue a registration that could not reach the server. */
      addPending: ({ payload, event }) => {
        const ticketCode = `PENDING-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        set((s) => ({
          tickets: [
            {
              ticketCode,
              status: 'pending',
              name: payload.name,
              email: payload.email,
              phone: `${payload.countryCode} ${payload.phone}`,
              tickets: payload.tickets,
              createdAt: new Date().toISOString(),
              event: eventSnapshot(event),
              payload,
              synced: false,
              updatedAt: Date.now(),
            },
            ...s.tickets,
          ],
        }));
        return ticketCode;
      },

      /** Replace a pending entry with the confirmed server registration. */
      resolvePending: (pendingCode, registration) =>
        set((s) => ({
          tickets: s.tickets.map((t) => (t.ticketCode === pendingCode ? fromServer(registration) : t)),
        })),

      failPending: (pendingCode, error) =>
        set((s) => ({
          tickets: s.tickets.map((t) => (t.ticketCode === pendingCode ? { ...t, status: 'failed', error, updatedAt: Date.now() } : t)),
        })),

      updateStatus: (ticketCode, patch) =>
        set((s) => ({
          tickets: s.tickets.map((t) => (t.ticketCode === ticketCode ? { ...t, ...patch, updatedAt: Date.now() } : t)),
        })),

      /** Merge tickets from the signed-in account; server data wins for shared codes. */
      mergeFromServer: (registrations) =>
        set((s) => {
          const byCode = new Map(s.tickets.map((t) => [t.ticketCode, t]));
          for (const r of registrations) byCode.set(r.ticketCode, fromServer(r));
          return { tickets: [...byCode.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) };
        }),

      remove: (ticketCode) => set((s) => ({ tickets: s.tickets.filter((t) => t.ticketCode !== ticketCode) })),

      clear: () => set({ tickets: [] }),

      /** Import a JSON backup exported from this app (deduplicated by ticket code). */
      importBackup: (list) => {
        if (!Array.isArray(list)) throw new Error('Backup file is not a ticket list.');
        const valid = list.filter((t) => t && typeof t.ticketCode === 'string' && t.event?.slug && t.name);
        const existing = new Set(get().tickets.map((t) => t.ticketCode));
        const fresh = valid.filter((t) => !existing.has(t.ticketCode)).map((t) => ({ ...t, synced: false }));
        set((s) => ({ tickets: [...fresh, ...s.tickets] }));
        return fresh.length;
      },
    }),
    {
      name: 'encore.tickets',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const selectPending = (s) => s.tickets.filter((t) => t.status === 'pending');
