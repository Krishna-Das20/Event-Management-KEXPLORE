import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MAX_TICKETS } from './constants';

/**
 * Registration form validation — the same rules are enforced again on the server,
 * so the browser gives instant feedback and the API stays the source of truth.
 */
export const COUNTRIES = [
  { code: '+91', flag: '🇮🇳', name: 'India', length: 10, pattern: /^[6-9]\d{9}$/, example: '98765 43210' },
  { code: '+1', flag: '🇺🇸', name: 'US / Canada', length: 10, pattern: /^[2-9]\d{9}$/, example: '415 555 0132' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom', length: 10, pattern: /^7\d{9}$/, example: '7400 123456' },
  { code: '+971', flag: '🇦🇪', name: 'UAE', length: 9, pattern: /^5\d{8}$/, example: '50 123 4567' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore', length: 8, pattern: /^[89]\d{7}$/, example: '8123 4567' },
  { code: '+61', flag: '🇦🇺', name: 'Australia', length: 9, pattern: /^4\d{8}$/, example: '412 345 678' },
];

export const COUNTRY_MAP = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

export const digitsOnly = (value = '') => value.replace(/\D/g, '');

/** Group digits as the user types: 9876543210 → "98765 43210" (India), others in 3–4 groups. */
export function formatPhone(value, code) {
  const d = digitsOnly(value).slice(0, COUNTRY_MAP[code]?.length ?? 15);
  if (code === '+91') return d.replace(/^(\d{5})(\d{1,5})$/, '$1 $2');
  if (code === '+1') return d.replace(/^(\d{3})(\d{1,3})?(\d{1,4})?$/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '));
  return d.replace(/(\d{4})(?=\d)/g, '$1 ');
}

const NAME_RE = /^[\p{L}][\p{L}\s.'-]*$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export const registrationSchema = z
  .object({
    eventId: z.string().min(1, 'Please choose an event to attend'),
    name: z
      .string()
      .trim()
      .min(1, 'Your full name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(60, 'Name must be under 60 characters')
      .regex(NAME_RE, 'Use letters only — no numbers or symbols'),
    email: z.string().trim().min(1, 'Email address is required').regex(EMAIL_RE, 'Enter a valid email, like name@example.com'),
    countryCode: z.string(),
    phone: z.string().min(1, 'Mobile number is required'),
    tickets: z.coerce.number().int().min(1, 'At least 1 ticket').max(MAX_TICKETS, `Maximum ${MAX_TICKETS} tickets per booking`),
    agree: z.literal(true, { error: 'Please accept the event guidelines to continue' }),
  });

/** Country-aware mobile number check. Returns an error message, or null when valid. */
export function phoneIssue(countryCode, phone) {
  const country = COUNTRY_MAP[countryCode];
  const digits = digitsOnly(phone);
  if (!country || !digits) return null; // "required" is handled by the schema
  if (digits.length !== country.length) return `${country.name} numbers have ${country.length} digits (you entered ${digits.length})`;
  if (!country.pattern.test(digits)) {
    return countryCode === '+91' ? 'Indian mobile numbers start with 6, 7, 8 or 9' : `Enter a valid ${country.name} mobile number`;
  }
  return null;
}

/**
 * zod skips object-level refinements while any other field is invalid, which would hide
 * phone errors until the rest of the form is fixed. This resolver always runs the
 * cross-field phone check so every field gets instant, independent feedback.
 */
const baseResolver = zodResolver(registrationSchema);
export async function registrationResolver(values, context, options) {
  const result = await baseResolver(values, context, options);
  const message = phoneIssue(values.countryCode, values.phone);
  if (!message || result.errors?.phone) return result;
  return { values: {}, errors: { ...result.errors, phone: { type: 'custom', message } } };
}

const COMMON_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'kiit.ac.in', 'proton.me', 'rediffmail.com'];

function distance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/** Suggest a fix for common email domain typos: "name@gmial.com" → "name@gmail.com". */
export function suggestEmail(email = '') {
  const [user, domain] = email.trim().toLowerCase().split('@');
  if (!user || !domain || COMMON_DOMAINS.includes(domain)) return null;
  let best = null;
  for (const d of COMMON_DOMAINS) {
    const dist = distance(domain, d);
    if (dist > 0 && dist <= 2 && (!best || dist < best.dist)) best = { domain: d, dist };
  }
  return best ? `${user}@${best.domain}` : null;
}
