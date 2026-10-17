import type { NextFunction, Request, Response } from 'express';
import type { PrismaClient, UserRole } from '@prisma/client';
import { resolveCurrentUser } from './current-user';
import { validWriteRequest } from './request-protection';

declare module 'express' {
  interface Request {
    currentUser?: { id: string; role: UserRole };
  }
}
type Db = Pick<PrismaClient, 'user'>;

/** Populate verified identity; fail closed for invalid or deleted accounts. */
export function currentUserMiddleware(db: Db) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.currentUser = (await resolveCurrentUser(req, db)) ?? undefined;
      next();
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/** Require an authenticated account and optionally its current database role. */
export function requireUser(role?: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.currentUser;
    if (!user)
      return res.status(401).json({ error: 'Authentication required' });
    if (role && user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

/** Reject writes without JSON, exact-origin, signed double-submit validation. */
export function protectWrites(secret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
    if (!req.is('application/json')) {
      return res.status(415).json({ error: 'JSON required' });
    }
    if (!validWriteRequest(req, secret)) {
      return res.status(403).json({ error: 'Request verification failed' });
    }
    next();
  };
}
