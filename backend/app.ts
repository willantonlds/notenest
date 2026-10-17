import express from 'express';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './errors';
import { createRoutes } from './routes/health';

/** Assemble middleware and API routes without starting a listener. */
export function createApp(
  db: Pick<PrismaClient, '$queryRaw'>,
): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use('/api', createRoutes(db));
  app.use(express.static(resolve(process.cwd(), 'dist/frontend')));
  app.use(errorHandler);
  return app;
}
