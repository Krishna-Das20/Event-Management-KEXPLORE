import { z } from 'zod';
import { CATEGORIES, MAX_TICKETS_PER_REGISTRATION } from '../constants.js';

/** Phone rules per dialling code — mirrors the client-side validation exactly. */
export const PHONE_RULES = {
  '+91': { length: 10, pattern: /^[6-9]\d{9}$/, label: 'India' },
  '+1': { length: 10, pattern: /^[2-9]\d{9}$/, label: 'US / Canada' },
  '+44': { length: 10, pattern: /^7\d{9}$/, label: 'United Kingdom' },
  '+971': { length: 9, pattern: /^5\d{8}$/, label: 'UAE' },
  '+65': { length: 8, pattern: /^[89]\d{7}$/, label: 'Singapore' },
  '+61': { length: 9, pattern: /^4\d{8}$/, label: 'Australia' },
};

const csv = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []));

export const listEventsQuery = z.object({
  q: z.string().trim().max(80).optional(),
  category: csv.pipe(z.array(z.enum(CATEGORIES))),
  city: z.string().trim().max(40).optional(),
  when: z.enum(['upcoming', 'today', 'week', 'month', 'past', 'all']).default('upcoming'),
  price: z.enum(['all', 'free', 'paid']).default('all'),
  sort: z.enum(['date', 'popular', 'price-asc', 'price-desc', 'newest']).default('date'),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  exclude: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

export const slugParam = z.object({ slug: z.string().trim().min(1).max(120) });
export const codeParam = z.object({ code: z.string().trim().toUpperCase().regex(/^ENC-[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Invalid ticket code') });

export const createRegistrationBody = z
  .object({
    // Accepts a Mongo id or an event slug (registrations queued offline only know the slug).
    eventId: z.string().trim().min(1, 'Please choose an event').max(120),
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(60, 'Name must be under 60 characters')
      .regex(/^[\p{L}][\p{L}\s.'-]*$/u, 'Name can only contain letters, spaces and . \' -'),
    email: z.string().trim().toLowerCase().pipe(z.email('Please enter a valid email address')),
    countryCode: z.enum(Object.keys(PHONE_RULES)),
    phone: z.string().trim().transform((v) => v.replace(/[\s()-]/g, '')),
    tickets: z.coerce
      .number()
      .int()
      .min(1, 'Book at least 1 ticket')
      .max(MAX_TICKETS_PER_REGISTRATION, `You can book up to ${MAX_TICKETS_PER_REGISTRATION} tickets at once`),
  })
  .superRefine((data, ctx) => {
    const rule = PHONE_RULES[data.countryCode];
    if (!rule.pattern.test(data.phone)) {
      ctx.addIssue({
        code: 'custom',
        path: ['phone'],
        message: `Enter a valid ${rule.length}-digit ${rule.label} mobile number`,
      });
    }
  });

export const cancelRegistrationBody = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()).optional(),
});

export const googleAuthBody = z.object({ credential: z.string().min(20).max(4096) });

export const newsletterBody = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Please enter a valid email address')),
});
