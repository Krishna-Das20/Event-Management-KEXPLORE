/**
 * Seed the database with the demo catalogue.
 *   npm run seed            → upsert all events
 *   npm run seed -- --fresh → wipe events & registrations first
 */
import mongoose from 'mongoose';
import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { seedEvents } from '../data/seed.js';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('✖ MONGODB_URI is not set. Copy server/.env.example to server/.env first.');
  process.exit(1);
}

const fresh = process.argv.includes('--fresh');

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('✔ Connected to MongoDB');

  if (fresh) {
    await Promise.all([Event.deleteMany({}), Registration.deleteMany({})]);
    console.log('✔ Cleared events and registrations');
  }

  await Promise.all([Event.syncIndexes(), Registration.syncIndexes()]);
  const result = await seedEvents();
  console.log(`✔ Seeded ${result.total} events (${result.upserted} new, ${result.modified} updated)`);
} catch (err) {
  console.error('✖ Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
