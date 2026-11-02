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

/** Verify a Google Identity Services ID token (signature, audience, expiry) and return its payload. */
async function verifyGoogleCredential(credential) {
  if (!env.googleClientId) throw new HttpError(503, 'Google sign-in is not configured.', { code: 'AUTH_NOT_CONFIGURED' });
  googleClient ??= new OAuth2Client(env.googleClientId);

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: env.googleClientId });
    payload = ticket.getPayload();
  } catch {
    throw unauthorized('Google sign-in could not be verified. Please try again.');
  }
  if (!payload?.email || !payload.email_verified) throw unauthorized('Your Google account email is not verified.');
  return payload;
}

/** Upsert the user, link tickets they booked as a guest, and start a session. */
async function signInWithGoogle(res, payload) {
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
  return { user, claimed };
}

/**
 * POST /api/auth/google — popup / One Tap flow: the browser sends the ID token as JSON.
 */
router.post('/google', authLimiter, validate({ body: googleAuthBody }), async (req, res) => {
  const payload = await verifyGoogleCredential(req.valid.body.credential);
  const { user, claimed } = await signInWithGoogle(res, payload);
  res.json({ user: toUserDTO(user), claimed });
});

/**
 * POST /api/auth/google/redirect — full-page redirect flow (phones, in-app browsers, blocked popups).
 * Google posts the ID token as a form; we start the session and send the user back into the app.
 * The double-submit CSRF token is checked whenever the browser includes Google's g_csrf_token cookie.
 */
router.post('/google/redirect', authLimiter, async (req, res) => {
  const credential = typeof req.body?.credential === 'string' ? req.body.credential : '';
  const csrfCookie = req.cookies?.g_csrf_token;
  try {
    if (!credential) throw unauthorized('Missing Google credential.');
    if (csrfCookie && csrfCookie !== req.body?.g_csrf_token) throw unauthorized('Sign-in request could not be validated.');
    const payload = await verifyGoogleCredential(credential);
    const { claimed } = await signInWithGoogle(res, payload);
    res.redirect(303, `/?signin=success${claimed ? `&claimed=${claimed}` : ''}`);
  } catch (err) {
    console.error('[auth] redirect sign-in failed:', err.message);
    res.redirect(303, '/?signin=error');
  }
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
