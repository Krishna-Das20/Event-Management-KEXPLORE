import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { User, toUserDTO } from '../models/User.js';
import { Registration } from '../models/Registration.js';
import { clearSession, issueSession, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { googleAuthBody } from '../validators/schemas.js';
import { HttpError, unauthorized } from '../utils/http.js';

const router = Router();
let googleClient;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { message: 'Too many sign-in attempts. Please wait a few minutes.', code: 'RATE_LIMITED' } },
});

/**
 * POST /api/auth/google — exchange a Google Identity Services ID token for a session.
 * The token's signature, audience and expiry are verified against Google's public keys.
 */
router.post('/google', authLimiter, validate({ body: googleAuthBody }), async (req, res) => {
  if (!env.googleClientId) throw new HttpError(503, 'Google sign-in is not configured.', { code: 'AUTH_NOT_CONFIGURED' });
  googleClient ??= new OAuth2Client(env.googleClientId);

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: req.valid.body.credential, audience: env.googleClientId });
    payload = ticket.getPayload();
  } catch {
    throw unauthorized('Google sign-in could not be verified. Please try again.');
  }
  if (!payload?.email || !payload.email_verified) throw unauthorized('Your Google account email is not verified.');

  const user = await User.findOneAndUpdate(
    { googleId: payload.sub },
    {
      $set: {
        email: payload.email.toLowerCase(),
        name: payload.name ?? payload.email.split('@')[0],
        avatar: payload.picture,
        lastLoginAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // Claim any tickets booked as a guest with the same email.
  const { modifiedCount: claimed } = await Registration.updateMany(
    { email: user.email, user: { $exists: false } },
    { $set: { user: user._id } },
  );

  issueSession(res, user);
  res.json({ user: toUserDTO(user), claimed });
});

/** GET /api/auth/me — the current session's user, or null. */
router.get('/me', optionalAuth, async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  if (!req.user) return res.json({ user: null });
  const user = await User.findById(req.user.id).lean();
  if (!user) {
    clearSession(res);
    return res.json({ user: null });
  }
  res.json({ user: toUserDTO(user) });
});

/** POST /api/auth/logout */
router.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

export default router;
