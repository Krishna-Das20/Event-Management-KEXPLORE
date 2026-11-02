/**
 * Centralised, typed access to environment variables.
 * Values are read lazily so a missing secret surfaces as a clean API error
 * (and in /api/health) instead of crashing the whole serverless function.
 */
const list = (value, fallback) =>
  (value ?? fallback)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const env = {
  get nodeEnv() {
    return process.env.NODE_ENV ?? 'development';
  },
  get isProd() {
    return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  },
  /** API_PORT wins locally (tooling often exports PORT for the front-end); hosts like Render set PORT. */
  get port() {
    return Number(process.env.API_PORT ?? process.env.PORT ?? 5000);
  },
  get mongoUri() {
    return process.env.MONGODB_URI;
  },
  get jwtSecret() {
    return process.env.JWT_SECRET;
  },
  get googleClientId() {
    return process.env.GOOGLE_CLIENT_ID;
  },
  /** Origins allowed to call the API cross-site (only needed when the API runs on its own host). */
  get clientOrigins() {
    return list(process.env.CLIENT_URL, 'http://localhost:5173');
  },
  /** Seed the demo catalogue automatically the first time the database is empty. */
  get seedOnEmpty() {
    return process.env.SEED_ON_EMPTY !== 'false';
  },
};

export function missingConfig() {
  return ['MONGODB_URI', 'JWT_SECRET', 'GOOGLE_CLIENT_ID'].filter((key) => !process.env[key]);
}
