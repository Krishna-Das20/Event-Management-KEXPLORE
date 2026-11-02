import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Event, toEventDTO } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { cancelRegistrationBody, codeParam, createRegistrationBody } from '../validators/schemas.js';
import { HttpError, badRequest, conflict, maskEmail, notFound } from '../utils/http.js';
import { generateTicketCode } from '../utils/ticketCode.js';

const router = Router();

const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { message: 'Too many registrations from this device. Please try again in a few minutes.', code: 'RATE_LIMITED' } },
});

const EVENT_SUMMARY = 'slug title image category startDate endDate venue mode price capacity registeredCount featured organizer tagline tags';

function toRegistrationDTO(reg, { masked = false } = {}) {
  const event = reg.event && typeof reg.event === 'object' && 'slug' in reg.event ? toEventDTO(reg.event) : undefined;
  return {
    id: String(reg._id),
    ticketCode: reg.ticketCode,
    status: reg.status,
    name: reg.name,
    email: masked ? maskEmail(reg.email) : reg.email,
    ...(masked ? {} : { phone: reg.phone }),
    tickets: reg.tickets,
    createdAt: reg.createdAt,
    cancelledAt: reg.cancelledAt,
    event,
  };
}

/** POST /api/registrations — register for an event (guests welcome; signed-in users are linked). */
router.post('/', registerLimiter, optionalAuth, validate({ body: createRegistrationBody }), async (req, res) => {
  const { eventId: ref, name, email, countryCode, phone, tickets } = req.valid.body;
  const now = new Date();

  const eventKey = /^[a-f\d]{24}$/i.test(ref) ? { _id: ref } : { slug: ref.toLowerCase() };
  const target = await Event.findOne(eventKey).select('_id').lean();
  if (!target) throw notFound('That event no longer exists.');
  const eventId = target._id;

  const existing = await Registration.exists({ event: eventId, email, status: 'confirmed' });
  if (existing) {
    throw conflict('This email is already registered for this event. Check “My Tickets” for your pass.', {
      code: 'ALREADY_REGISTERED',
      fields: { email: 'Already registered for this event' },
    });
  }

  // Atomically reserve seats: only succeeds if the event is upcoming and has capacity.
  const event = await Event.findOneAndUpdate(
    {
      _id: eventId,
      startDate: { $gt: now },
      $expr: { $lte: [{ $add: ['$registeredCount', tickets] }, '$capacity'] },
    },
    { $inc: { registeredCount: tickets } },
    { new: true, lean: true },
  );

  if (!event) {
    const current = await Event.findById(eventId).lean();
    if (!current) throw notFound('That event no longer exists.');
    if (new Date(current.startDate) <= now) throw badRequest('Registration for this event has closed.', { code: 'REGISTRATION_CLOSED' });
    const left = Math.max(0, current.capacity - current.registeredCount);
    throw new HttpError(409, left === 0 ? 'Sorry — this event is sold out.' : `Only ${left} seat${left === 1 ? '' : 's'} left. Please reduce your tickets.`, {
      code: left === 0 ? 'SOLD_OUT' : 'NOT_ENOUGH_SEATS',
      fields: left === 0 ? undefined : { tickets: `Only ${left} left` },
    });
  }

  try {
    const registration = await Registration.create({
      ticketCode: generateTicketCode(),
      event: event._id,
      user: req.user?.id,
      name,
      email,
      phone: `${countryCode} ${phone}`,
      tickets,
    });
    res.status(201).json({ registration: toRegistrationDTO({ ...registration.toObject(), event }) });
  } catch (err) {
    // Roll the seat reservation back if the insert lost a race (duplicate email or code).
    await Event.updateOne({ _id: event._id }, { $inc: { registeredCount: -tickets } });
    if (err.code === 11000) {
      throw conflict('This email is already registered for this event.', { code: 'ALREADY_REGISTERED', fields: { email: 'Already registered for this event' } });
    }
    throw err;
  }
});

/** GET /api/registrations/me — every registration tied to the signed-in user (or their email). */
router.get('/me', requireAuth, async (req, res) => {
  const regs = await Registration.find({ $or: [{ user: req.user.id }, { email: req.user.email }] })
    .populate('event', EVENT_SUMMARY)
    .sort({ createdAt: -1 })
    .lean();
  res.set('Cache-Control', 'private, no-store');
  res.json({ registrations: regs.filter((r) => r.event).map((r) => toRegistrationDTO(r)) });
});

/** GET /api/registrations/:code — public ticket verification (personal details masked). */
router.get('/:code', validate({ params: codeParam }), async (req, res) => {
  const reg = await Registration.findOne({ ticketCode: req.valid.params.code }).populate('event', EVENT_SUMMARY).lean();
  if (!reg || !reg.event) throw notFound('No ticket matches that code.');
  res.set('Cache-Control', 'private, no-store');
  res.json({ registration: toRegistrationDTO(reg, { masked: true }) });
});

/** POST /api/registrations/:code/cancel — owner (session) or guest (matching email) can cancel. */
router.post(
  '/:code/cancel',
  optionalAuth,
  validate({ params: codeParam, body: cancelRegistrationBody }),
  async (req, res) => {
    const reg = await Registration.findOne({ ticketCode: req.valid.params.code });
    if (!reg) throw notFound('No ticket matches that code.');

    const isOwner =
      (req.user && (String(reg.user) === req.user.id || reg.email === req.user.email)) ||
      (req.valid.body.email && req.valid.body.email === reg.email);
    if (!isOwner) throw new HttpError(403, 'You can only cancel your own tickets.', { code: 'FORBIDDEN' });
    if (reg.status === 'cancelled') throw conflict('This ticket is already cancelled.', { code: 'ALREADY_CANCELLED' });

    const event = await Event.findById(reg.event).lean();
    if (event && new Date(event.startDate) <= new Date()) {
      throw badRequest('This event has already started, so the ticket can’t be cancelled.', { code: 'EVENT_STARTED' });
    }

    reg.status = 'cancelled';
    reg.cancelledAt = new Date();
    await reg.save();
    if (event) await Event.updateOne({ _id: event._id }, { $inc: { registeredCount: -reg.tickets } });

    const fresh = await Registration.findById(reg._id).populate('event', EVENT_SUMMARY).lean();
    res.json({ registration: toRegistrationDTO(fresh) });
  },
);

export default router;
