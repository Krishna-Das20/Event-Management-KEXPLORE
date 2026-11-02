import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from '../constants.js';
import { HttpError, unauthorized } from '../utils/http.js';

const secret = () => {
  if (!env.jwtSecret) throw new HttpError(503, 'Authentication is not configured yet.', { code: 'AUTH_NOT_CONFIGURED' });
  return env.jwtSecret;
};

export const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_TTL_SECONDS * 1000,
});

export function issueSession(res, user) {
  const token = jwt.sign({ sub: String(user._id), email: user.email, name: user.name }, secret(), {
    expiresIn: SESSION_TTL_SECONDS,
  });
  res.cookie(SESSION_COOKIE, token, cookieOptions());
}

export function clearSession(res) {
  const { maxAge: _maxAge, ...opts } = cookieOptions();
  res.clearCookie(SESSION_COOKIE, opts);
}

/** Attaches `req.user` when a valid session cookie is present; never rejects. */
export function optionalAuth(req, _res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token && env.jwtSecret) {
    try {
      const payload = jwt.verify(token, env.jwtSecret);
      req.user = { id: payload.sub, email: payload.email, name: payload.name };
    } catch {
      // Expired or tampered token: treat as signed out.
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  optionalAuth(req, res, () => (req.user ? next() : next(unauthorized())));
}
