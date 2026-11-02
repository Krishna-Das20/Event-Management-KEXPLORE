import { Router } from 'express';
import { Event, toEventDTO } from '../models/Event.js';
import { validate } from '../middleware/validate.js';
import { listEventsQuery, slugParam } from '../validators/schemas.js';
import { escapeRegex, notFound } from '../utils/http.js';

const router = Router();
const DAY = 24 * 60 * 60 * 1000;
// Browsers always revalidate (seat counts change); the CDN may serve a 10s-old copy.
const CACHE = 'public, max-age=0, s-maxage=10, stale-while-revalidate=60';

/** End of "today" in India Standard Time, as a UTC Date. */
function endOfTodayIST(now) {
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  ist.setUTCHours(23, 59, 59, 999);
  return new Date(ist.getTime() - 5.5 * 60 * 60 * 1000);
}

function buildFilter({ q, category, city, when, price, featured, exclude }) {
  const now = new Date();
  const filter = {};

  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: rx }, { tagline: rx }, { tags: rx }, { category: rx }, { 'venue.city': rx }, { 'venue.name': rx }];
  }
  if (category.length) filter.category = { $in: category };
  if (city) filter['venue.city'] = new RegExp(`^${escapeRegex(city)}$`, 'i');
  if (price === 'free') filter.price = 0;
  if (price === 'paid') filter.price = { $gt: 0 };
  if (featured) filter.featured = true;
  if (exclude) filter.slug = { $ne: exclude };

  const horizon = { today: endOfTodayIST(now), week: new Date(+now + 7 * DAY), month: new Date(+now + 30 * DAY) }[when];
  if (when === 'past') filter.endDate = { $lt: now };
  else if (when !== 'all') {
    filter.endDate = { $gte: now };
    if (horizon) filter.startDate = { $lte: horizon };
  }
  return filter;
}

const SORTS = {
  date: { startDate: 1 },
  popular: { registeredCount: -1, startDate: 1 },
  'price-asc': { price: 1, startDate: 1 },
  'price-desc': { price: -1, startDate: 1 },
  newest: { createdAt: -1 },
};

/** GET /api/events — search, filter, sort and paginate. */
router.get('/', validate({ query: listEventsQuery }), async (req, res) => {
  const query = req.valid.query;
  const filter = buildFilter(query);
  let sort = SORTS[query.sort];
  if (query.when === 'past' && query.sort === 'date') sort = { startDate: -1 };

  const { page, limit } = query;
  const [items, total] = await Promise.all([
    Event.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-description -agenda -speakers -faqs -gallery -highlights')
      .lean(),
    Event.countDocuments(filter),
  ]);

  res.set('Cache-Control', CACHE);
  res.json({
    items: items.map((e) => toEventDTO(e)),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasMore: page * limit < total,
  });
});

/** GET /api/events/meta — category counts, cities and headline stats for the UI. */
router.get('/meta', async (_req, res) => {
  const now = new Date();
  const [categories, cities, totals] = await Promise.all([
    Event.aggregate([{ $match: { endDate: { $gte: now } } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    Event.distinct('venue.city', { endDate: { $gte: now } }),
    Event.aggregate([
      {
        $group: {
          _id: null,
          events: { $sum: 1 },
          upcoming: { $sum: { $cond: [{ $gte: ['$endDate', now] }, 1, 0] } },
          attendees: { $sum: '$registeredCount' },
          free: { $sum: { $cond: [{ $and: [{ $eq: ['$price', 0] }, { $gte: ['$endDate', now] }] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const stats = totals[0] ?? { events: 0, upcoming: 0, attendees: 0, free: 0 };
  res.set('Cache-Control', CACHE);
  res.json({
    categories: Object.fromEntries(categories.map((c) => [c._id, c.count])),
    cities: cities.filter((c) => c !== 'Online').sort(),
    stats: {
      events: stats.events,
      upcoming: stats.upcoming,
      attendees: stats.attendees,
      free: stats.free,
      cities: cities.filter((c) => c !== 'Online').length,
    },
  });
});

/** GET /api/events/:slug — full event details plus related events. */
router.get('/:slug', validate({ params: slugParam }), async (req, res) => {
  const event = await Event.findOne({ slug: req.valid.params.slug.toLowerCase() }).lean();
  if (!event) throw notFound('We couldn’t find that event.');

  const related = await Event.find({ category: event.category, slug: { $ne: event.slug }, endDate: { $gte: new Date() } })
    .sort({ startDate: 1 })
    .limit(3)
    .select('-description -agenda -speakers -faqs -gallery -highlights')
    .lean();

  res.set('Cache-Control', CACHE);
  res.json({ event: toEventDTO(event, { full: true }), related: related.map((e) => toEventDTO(e)) });
});

export default router;
