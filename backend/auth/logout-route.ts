import { Router } from 'express';
import type { CookieOptions, Request, Response } from 'express';
import { requireUser } from '../security/middleware';
import { sessionCookieOptions } from '../session/middleware';

/** Build the authenticated current-session logout endpoint. */
export function logoutRoute(): Router {
  const router = Router();
  router.post(
    '/auth/logout',
    (req: Request, res: Response, next) => {
      res.set('Cache-Control', 'no-store');
      next();
    },
    requireUser(),
    (req: Request, res: Response) => {
      req.session.destroy((error) => {
        if (error)
          return res.status(500).json({ error: 'Internal server error' });
        res
          .cookie('notenest.sid', '', {
            ...(sessionCookieOptions() as CookieOptions),
            expires: new Date(1),
            maxAge: 0,
          })
          .status(204)
          .end();
      });
    },
  );
  return router;
}
