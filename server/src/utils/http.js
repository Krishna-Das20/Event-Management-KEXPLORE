/** An error that carries an HTTP status code and an optional machine-readable code. */
export class HttpError extends Error {
  constructor(status, message, { code, fields } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const badRequest = (message, opts) => new HttpError(400, message, opts);
export const unauthorized = (message = 'Please sign in to continue.') => new HttpError(401, message, { code: 'UNAUTHORIZED' });
export const notFound = (message = 'Not found.') => new HttpError(404, message, { code: 'NOT_FOUND' });
export const conflict = (message, opts) => new HttpError(409, message, opts);

/** Escape user input before building a RegExp from it. */
export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Mask an email address for public display: krishna@gmail.com → kr•••••@gmail.com */
export function maskEmail(email = '') {
  const [user, domain] = email.split('@');
  if (!domain) return '•••';
  return `${user.slice(0, 2)}${'•'.repeat(Math.max(3, user.length - 2))}@${domain}`;
}
