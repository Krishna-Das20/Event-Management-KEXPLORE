import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

// Long-running server for local development or container hosts (Render, Railway…).
const server = app.listen(env.port, () => {
  console.log(`▶ Encore API listening on http://localhost:${env.port}/api`);
});

connectDB()
  .then(() => console.log('✔ MongoDB connected'))
  .catch((err) => console.warn('⚠ MongoDB not reachable yet:', err.message));

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
