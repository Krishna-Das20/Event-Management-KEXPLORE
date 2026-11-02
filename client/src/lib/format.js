// All events take place in India, so dates are always shown in IST for consistency.
const TZ = 'Asia/Kolkata';

const fmt = (opts) => new Intl.DateTimeFormat('en-IN', { timeZone: TZ, ...opts });
const dayFmt = fmt({ day: '2-digit' });
const monthFmt = fmt({ month: 'short' });
const weekdayFmt = fmt({ weekday: 'short' });
const longDateFmt = fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDateFmt = fmt({ weekday: 'short', day: 'numeric', month: 'short' });
const timeFmt = fmt({ hour: 'numeric', minute: '2-digit', hour12: true });
const ymdFmt = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' });

export const dateParts = (date) => {
  const d = new Date(date);
  return { day: dayFmt.format(d), month: monthFmt.format(d).toUpperCase(), weekday: weekdayFmt.format(d) };
};

export const formatLongDate = (date) => longDateFmt.format(new Date(date));
export const formatShortDate = (date) => shortDateFmt.format(new Date(date));
export const formatTime = (date) => timeFmt.format(new Date(date)).toUpperCase();

const sameDay = (a, b) => ymdFmt.format(new Date(a)) === ymdFmt.format(new Date(b));

/** "Sat, 21 Nov · 7:00 PM" or "27 Dec – 29 Dec" for multi-day events. */
export function formatEventWhen(start, end) {
  if (!end || sameDay(start, end)) return `${formatShortDate(start)} · ${formatTime(start)}`;
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}

export function formatTimeRange(start, end) {
  return `${formatTime(start)} – ${formatTime(end)} IST`;
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const formatPrice = (price) => (price > 0 ? inr.format(price) : 'Free');

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });
export const formatCompact = (n) => compact.format(n);

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
/** "in 3 days", "tomorrow", "2 hours ago" */
export function formatRelative(date) {
  const diff = new Date(date).getTime() - Date.now();
  const abs = Math.abs(diff);
  const units = [
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === 'minute') return rtf.format(Math.round(diff / ms), unit);
  }
  return '';
}

export const pluralize = (n, word, plural = `${word}s`) => `${n} ${n === 1 ? word : plural}`;

/** Initials for avatar fallbacks. */
export const initials = (name = '') =>
  name
    .replace(/[“”"]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
