import { env } from '../config/env.js';
import { HttpError } from '../utils/http.js';

export function notFoundHandler(req, _res, next) {
  next(new HttpError(404, `No route for ${req.method} ${req.originalUrl}`, { code: 'ROUTE_NOT_FOUND' }));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.status ?? err.statusCode ?? 500;
  let message = err.message;
  let code = err.code;

  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier.';
    code = 'INVALID_ID';
  } else if (err.code === 11000) {
    status = 409;
    message = 'That record already exists.';
    code = 'DUPLICATE';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body.';
    code = 'BAD_JSON';
  }

  if (status >= 500) {
    console.error('[api]', err);
    if (env.isProd && !(err instanceof HttpError)) message = 'Something went wrong on our side. Please try again.';
  }

  res.status(status).json({
    error: { message, code: typeof code === 'string' ? code : 'ERROR', ...(err.fields && { fields: err.fields }) },
  });
}
