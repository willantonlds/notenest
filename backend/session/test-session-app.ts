import express from 'express';
import type { PrismaClient } from '@prisma/client';
import { createSessionMiddleware } from './middleware';

/** Build private test routes to exercise the real session middleware lifecycle. */
export function createTestSessionApp(
  db: Pick<PrismaClient, '$transaction'>,
  userId: string,
): express.Express {
  const app = express();
  app.use(createSessionMiddleware(db));
  app.post('/test/login', (req, res, next) => {
    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.userId = userId;
      req.session.save((saveError) =>
        saveError ? next(saveError) : res.sendStatus(204),
      );
    });
  });
  app.get('/test/me', (req, res) =>
    res.status(200).json({ userId: req.session.userId ?? null }),
  );
  app.post('/test/destroy', (req, res, next) =>
    req.session.destroy((error) => (error ? next(error) : res.sendStatus(204))),
  );
  return app;
}
