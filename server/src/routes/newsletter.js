import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Subscriber } from '../models/Subscriber.js';
import { validate } from '../middleware/validate.js';
import { newsletterBody } from '../validators/schemas.js';

const router = Router();

const limiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });

/** POST /api/newsletter — idempotent: subscribing twice is not an error. */
router.post('/', limiter, validate({ body: newsletterBody }), async (req, res) => {
  const { email } = req.valid.body;
  const result = await Subscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
  res.status(result.upsertedCount ? 201 : 200).json({ subscribed: true, alreadySubscribed: !result.upsertedCount });
});

export default router;
