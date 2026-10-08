import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { LOGIN_ERROR, login, LoginError } from './login-service';

type Db = Pick<PrismaClient, 'user' | '$transaction'>;
/** Build login and safe current-account endpoints. */
export function loginRoute(db: Db): Router {
  const router = Router();
  router.post(
    '/auth/login',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await login(db, req.body);
        req.session.regenerate((error) => {
          if (error) return next(error);
          req.session.userId = user.id;
          req.session.save((saveError) =>
            saveError
              ? next(saveError)
              : res.set('Cache-Control', 'no-store').json({ user }),
          );
        });
      } catch (error) {
        if (error instanceof LoginError)
          res
            .set('Cache-Control', 'no-store')
            .status(401)
            .json({ error: LOGIN_ERROR });
        else next(error);
      }
    },
  );
  router.get('/auth/me', (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    if (!req.currentUser)
      return res.status(401).json({ error: 'Authentication required' });
    void db.user
      .findUnique({
        where: { id: req.currentUser.id },
        select: { id: true, displayName: true, email: true, role: true },
      })
      .then((user) =>
        user
          ? res.json({ user })
          : res.status(401).json({ error: 'Authentication required' }),
      )
      .catch(() => res.status(500).json({ error: 'Internal server error' }));
  });
  return router;
}
