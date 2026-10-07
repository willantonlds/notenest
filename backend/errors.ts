import type { ErrorRequestHandler } from 'express';

/** Return a stable JSON response without exposing internal error details. */
export const errorHandler: ErrorRequestHandler = (_error, _req, res, next) => {
  void next;
  res.status(500).json({ error: 'Internal server error' });
};
