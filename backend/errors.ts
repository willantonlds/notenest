import type { ErrorRequestHandler } from 'express';

/** Return a stable JSON error without logging private request or session data. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const status =
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
      ? error.status
      : 500;
  const message =
    status === 413
      ? 'Request body too large'
      : status === 400
        ? 'Invalid request body'
        : 'Internal server error';
  res.status(status).json({ error: message });
};
