import { Event } from '../models/Event.js';
import { events } from './events.js';

/**
 * Idempotent seed: event content is upserted by slug, while live counters
 * (registeredCount) are only set on first insert so real registrations survive a re-seed.
 */
export async function seedEvents() {
  const ops = events.map(({ registeredCount, ...event }) => ({
    updateOne: {
      filter: { slug: event.slug },
      update: { $set: { mode: 'in-person', ...event }, $setOnInsert: { registeredCount } },
      upsert: true,
    },
  }));
  const res = await Event.bulkWrite(ops, { ordered: false });
  return { upserted: res.upsertedCount, modified: res.modifiedCount, total: events.length };
}
