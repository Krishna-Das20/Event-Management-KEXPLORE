import { HttpError } from '../utils/http.js';

/**
 * Validate request parts with zod schemas. Parsed (and transformed) values are
 * exposed on `req.valid` — Express 5 makes `req.query` read-only.
 */
export const validate =
  (schemas) =>
  (req, _res, next) => {
    req.valid ??= {};
    for (const part of ['params', 'query', 'body']) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        const fields = {};
        for (const issue of result.error.issues) {
          const key = issue.path.join('.') || part;
          fields[key] ??= issue.message;
        }
        const first = Object.values(fields)[0];
        return next(new HttpError(400, first ?? 'Invalid request', { code: 'VALIDATION_ERROR', fields }));
      }
      req.valid[part] = result.data;
    }
    next();
  };
