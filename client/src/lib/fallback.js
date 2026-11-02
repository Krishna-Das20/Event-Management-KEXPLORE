/**
 * Read-only fallback catalogue.
 *
 * If the API (or the database behind it) is unreachable, the UI keeps working from
 * a snapshot of the seed data that ships with the app. The snapshot is code-split and
 * only downloaded when it is actually needed. Event ids fall back to slugs, which the
 * API also accepts, so registrations queued in this mode sync correctly later.
 */
const DAY = 86_400_000;
let catalogue;

function toDTO(e) {
  const now = Date.now();
  const start = new Date(e.startDate).getTime();
  const end = new Date(e.endDate).getTime();
  const seatsLeft = Math.max(0, e.capacity - e.registeredCount);
  return {
    mode: 'in-person',
    ...e,
    id: e.slug,
    seatsLeft,
    status: end < now ? 'ended' : start <= now ? 'live' : seatsLeft === 0 ? 'sold-out' : 'upcoming',
  };
}

async function load() {
  catalogue ??= (await import('@data/events.js')).events.map(toDTO);
  return catalogue;
}

function endOfTodayIST(now) {
  const ist = new Date(now + 5.5 * 3_600_000);
  ist.setUTCHours(23, 59, 59, 999);
  return ist.getTime() - 5.5 * 3_600_000;
}

const SORTS = {
  date: (a, b) => new Date(a.startDate) - new Date(b.startDate),
  popular: (a, b) => b.registeredCount - a.registeredCount,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  newest: () => 0,
};

export async function fallbackEvents(params = {}) {
  const all = await load();
  const now = Date.now();
  const when = params.when ?? 'upcoming';
  const categories = Array.isArray(params.category) ? params.category : params.category ? String(params.category).split(',') : [];
  const q = params.q?.trim().toLowerCase();
  const horizon = { today: endOfTodayIST(now), week: now + 7 * DAY, month: now + 30 * DAY }[when];

  let items = all.filter((e) => {
    const start = new Date(e.startDate).getTime();
    const end = new Date(e.endDate).getTime();
    if (when === 'past' ? end >= now : when !== 'all' && (end < now || (horizon && start > horizon))) return false;
    if (categories.length && !categories.includes(e.category)) return false;
    if (params.price === 'free' && e.price !== 0) return false;
    if (params.price === 'paid' && e.price === 0) return false;
    if (String(params.featured) === 'true' && !e.featured) return false;
    if (params.exclude && e.slug === params.exclude) return false;
    if (q) {
      const hay = [e.title, e.tagline, e.category, e.venue?.city, e.venue?.name, ...(e.tags ?? [])].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sort = params.sort ?? 'date';
  items = [...items].sort(when === 'past' && sort === 'date' ? (a, b) => SORTS.date(b, a) : SORTS[sort] ?? SORTS.date);

  const limit = Number(params.limit ?? 12);
  const page = Number(params.page ?? 1);
  return {
    items: items.slice((page - 1) * limit, page * limit),
    page,
    limit,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / limit)),
    hasMore: page * limit < items.length,
  };
}

export async function fallbackMeta() {
  const all = await load();
  const now = Date.now();
  const upcoming = all.filter((e) => new Date(e.endDate).getTime() >= now);
  const cities = [...new Set(upcoming.map((e) => e.venue.city))].filter((c) => c !== 'Online').sort();
  const categories = {};
  for (const e of upcoming) categories[e.category] = (categories[e.category] ?? 0) + 1;
  return {
    categories,
    cities,
    stats: {
      events: all.length,
      upcoming: upcoming.length,
      attendees: all.reduce((s, e) => s + e.registeredCount, 0),
      free: upcoming.filter((e) => e.price === 0).length,
      cities: cities.length,
    },
  };
}

export async function fallbackEvent(slug) {
  const all = await load();
  const event = all.find((e) => e.slug === slug);
  if (!event) return null;
  const now = Date.now();
  const related = all
    .filter((e) => e.category === event.category && e.slug !== slug && new Date(e.endDate).getTime() >= now)
    .sort(SORTS.date)
    .slice(0, 3);
  return { event, related };
}
