import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

/** Build API routes with injectable persistence for deterministic tests. */
export function createRoutes(db: Pick<PrismaClient, '$queryRaw'>): Router {
  const router = Router();
  router.get('/health', async (_req, res, next) => {
    try {
      await db.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ok', database: 'ok' });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
