import { useUiStore } from '@/store/ui';

const BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'ERROR', fields } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
  /** True when the request never reached the server (offline, DNS, timeout…). */
  get isNetwork() {
    return this.status === 0;
  }
}

/**
 * Small fetch wrapper: JSON in/out, cookies included, timeouts, and
 * normalised errors so components can show friendly messages.
 */
export async function api(path, { method = 'GET', body, query, signal, timeout = 15000 } = {}) {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) continue;
      url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
    }
  }

  const timeoutSignal = AbortSignal.timeout(timeout);
  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError(
      err?.name === 'TimeoutError' ? 'The server took too long to respond.' : 'You appear to be offline. Check your connection.',
      { status: 0, code: 'NETWORK' },
    );
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error?.message ?? `Request failed (${res.status})`, {
      status: res.status,
      code: data?.error?.code,
      fields: data?.error?.fields,
    });
  }
  return data;
}

/** The server is unreachable or its database is down — not a client mistake. */
export const isUnavailable = (err) => err instanceof ApiError && (err.status === 0 || err.status >= 500);

/**
 * Read requests degrade gracefully: if the API is unavailable we serve the bundled
 * catalogue and flag the UI so it can show a gentle "cached data" notice.
 */
async function withFallback(request, fallback) {
  try {
    // Already serving cached data? Don't keep users waiting on a slow/unhealthy API.
    const data = await request(useUiStore.getState().usingFallback ? 4000 : undefined);
    if (useUiStore.getState().usingFallback) useUiStore.getState().setUsingFallback(false);
    return data;
  } catch (err) {
    if (!isUnavailable(err)) throw err;
    const data = await (await import('./fallback.js'))[fallback.name](...fallback.args);
    if (!data) throw new ApiError('We couldn’t find that event.', { status: 404, code: 'NOT_FOUND' });
    useUiStore.getState().setUsingFallback(true);
    return data;
  }
}

export const endpoints = {
  events: (params, signal) => withFallback((timeout) => api('/events', { query: params, signal, timeout }), { name: 'fallbackEvents', args: [params] }),
  eventsMeta: () => withFallback((timeout) => api('/events/meta', { timeout }), { name: 'fallbackMeta', args: [] }),
  event: (slug) => withFallback((timeout) => api(`/events/${encodeURIComponent(slug)}`, { timeout }), { name: 'fallbackEvent', args: [slug] }),
  register: (payload) => api('/registrations', { method: 'POST', body: payload }),
  myRegistrations: () => api('/registrations/me'),
  verifyTicket: (code) => api(`/registrations/${encodeURIComponent(code)}`),
  cancelTicket: (code, email) => api(`/registrations/${encodeURIComponent(code)}/cancel`, { method: 'POST', body: { email } }),
  me: () => api('/auth/me'),
  googleSignIn: (credential) => api('/auth/google', { method: 'POST', body: { credential } }),
  logout: () => api('/auth/logout', { method: 'POST' }),
  subscribe: (email) => api('/newsletter', { method: 'POST', body: { email } }),
};
