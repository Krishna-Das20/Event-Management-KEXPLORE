import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from './api';
import { useTicketStore } from '@/store/tickets';

export const qk = {
  events: (params) => ['events', params],
  eventsInfinite: (params) => ['events', 'infinite', params],
  event: (slug) => ['event', slug],
  meta: ['events', 'meta'],
  me: ['session'],
  myRegistrations: ['registrations', 'me'],
};

export function useEvents(params, options = {}) {
  return useQuery({
    queryKey: qk.events(params),
    queryFn: ({ signal }) => endpoints.events(params, signal),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useInfiniteEvents(params) {
  return useInfiniteQuery({
    queryKey: qk.eventsInfinite(params),
    queryFn: ({ pageParam, signal }) => endpoints.events({ ...params, page: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

export function useEvent(slug) {
  return useQuery({
    queryKey: qk.event(slug),
    queryFn: () => endpoints.event(slug),
    enabled: Boolean(slug),
    retry: (count, err) => err?.status !== 404 && count < 2,
  });
}

export function useEventsMeta() {
  return useQuery({ queryKey: qk.meta, queryFn: endpoints.eventsMeta, staleTime: 5 * 60_000 });
}

export function useSession() {
  const query = useQuery({ queryKey: qk.me, queryFn: endpoints.me, staleTime: 10 * 60_000, retry: 1 });
  return { user: query.data?.user ?? null, isLoading: query.isLoading, isError: query.isError };
}

export function useMyRegistrations(enabled) {
  return useQuery({ queryKey: qk.myRegistrations, queryFn: endpoints.myRegistrations, enabled, staleTime: 30_000 });
}

/** Reflect a seat change in every cached copy of an event so counters update instantly. */
function patchEventCaches(queryClient, eventId, delta) {
  const patch = (e) => (e?.id === eventId ? { ...e, registeredCount: e.registeredCount + delta, seatsLeft: Math.max(0, e.seatsLeft - delta) } : e);
  queryClient.setQueriesData({ queryKey: ['event'] }, (data) => (data?.event ? { ...data, event: patch(data.event) } : data));
  queryClient.setQueriesData({ queryKey: ['events'] }, (data) => {
    if (data?.items) return { ...data, items: data.items.map(patch) };
    if (data?.pages) return { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map(patch) })) };
    return data;
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const addFromServer = useTicketStore((s) => s.addFromServer);
  return useMutation({
    mutationFn: endpoints.register,
    onSuccess: ({ registration }) => {
      addFromServer(registration);
      patchEventCaches(queryClient, registration.event?.id, registration.tickets);
      queryClient.invalidateQueries({ queryKey: qk.myRegistrations });
      queryClient.invalidateQueries({ queryKey: qk.meta });
    },
  });
}

export function useCancelTicket() {
  const queryClient = useQueryClient();
  const updateStatus = useTicketStore((s) => s.updateStatus);
  return useMutation({
    mutationFn: ({ ticketCode, email }) => endpoints.cancelTicket(ticketCode, email),
    onSuccess: ({ registration }) => {
      updateStatus(registration.ticketCode, { status: 'cancelled', cancelledAt: registration.cancelledAt, synced: true });
      patchEventCaches(queryClient, registration.event?.id, -registration.tickets);
      queryClient.invalidateQueries({ queryKey: qk.myRegistrations });
    },
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endpoints.googleSignIn,
    onSuccess: (data) => {
      queryClient.setQueryData(qk.me, { user: data.user });
      queryClient.invalidateQueries({ queryKey: qk.myRegistrations });
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endpoints.logout,
    onSuccess: () => {
      queryClient.setQueryData(qk.me, { user: null });
      queryClient.removeQueries({ queryKey: qk.myRegistrations });
    },
  });
}
