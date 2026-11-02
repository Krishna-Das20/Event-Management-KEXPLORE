import mongoose from 'mongoose';
import { env } from './env.js';
import { HttpError } from '../utils/http.js';
import { Event } from '../models/Event.js';
import { seedEvents } from '../data/seed.js';

mongoose.set('strictQuery', true);

/**
 * Serverless-friendly connection cache: warm invocations reuse the same
 * connection instead of opening a new pool on every request.
 */
const cache = (globalThis.__encoreMongo ??= { conn: null, promise: null, seeded: false });

export async function connectDB() {
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn;

  if (!env.mongoUri) {
    throw new HttpError(503, 'The database is not configured yet.', { code: 'DB_NOT_CONFIGURED' });
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(env.mongoUri, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10,
        bufferCommands: false,
        appName: 'encore-api',
      })
      .catch((err) => {
        cache.promise = null;
        throw err;
      });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    throw new HttpError(503, 'We could not reach the database. Please try again in a moment.', {
      code: 'DB_UNAVAILABLE',
    });
  }

  if (env.seedOnEmpty && !cache.seeded) {
    cache.seeded = true;
    const count = await Event.estimatedDocumentCount();
    if (count === 0) {
      const result = await seedEvents();
      console.log(`[db] empty catalogue — seeded ${result.upserted} events`);
    }
  }

  return cache.conn;
}

export const dbState = () =>
  ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] ?? 'unknown';
