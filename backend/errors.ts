import type { ErrorRequestHandler } from 'express';

/** Return a stable JSON error without logging private request or session data. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  void _next;
  const status = getStatus(error);
  res.status(status).json({ error: getMessage(status) });
};

/** Accept only numeric HTTP status values from trusted error objects. */
function getStatus(error: unknown): number {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return 500;
  }
  return typeof error.status === 'number' ? error.status : 500;
}

/** Map supported client errors to stable public messages. */
function getMessage(status: number): string {
  if (status === 413) return 'Request body too large';
  if (status === 400) return 'Invalid request body';
  return 'Internal server error';
}
