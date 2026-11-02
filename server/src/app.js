import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env, missingConfig } from './config/env.js';
import { connectDB, dbState } from './config/db.js';
import eventsRouter from './routes/events.js';
import registrationsRouter from './routes/registrations.js';
import authRouter from './routes/auth.js';
import newsletterRouter from './routes/newsletter.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind Vercel / Render proxies — needed for secure cookies & rate limits

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || env.clientOrigins.includes(origin)),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '50kb' }));
  app.use(express.urlencoded({ extended: false, limit: '10kb' })); // Google redirect sign-in posts a form
  app.use(cookieParser());
  if (!env.isProd) app.use(morgan('dev'));

  const api = express.Router();

  api.get('/health', async (_req, res) => {
    let db = dbState();
    try {
      await connectDB();
      db = dbState();
    } catch {
      // reported below
    }
    const missing = missingConfig();
    res.set('Cache-Control', 'no-store');
    res.status(db === 'connected' && missing.length === 0 ? 200 : 503).json({
      ok: db === 'connected' && missing.length === 0,
      db,
      missingConfig: missing,
      time: new Date().toISOString(),
    });
  });

  // Every other API route needs the database: connect lazily (cached across warm invocations).
  api.use(async (_req, _res, next) => {
    await connectDB();
    next();
  });

  api.use('/events', eventsRouter);
  api.use('/registrations', registrationsRouter);
  api.use('/auth', authRouter);
  api.use('/newsletter', newsletterRouter);

  app.use('/api', api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const app = createApp();
export default app;
