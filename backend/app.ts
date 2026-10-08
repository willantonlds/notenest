import express from 'express';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './errors';
import { createRoutes } from './routes/health';
import { createSessionMiddleware } from './session/middleware';
import { currentUserMiddleware, protectWrites } from './security/middleware';
import { issueCsrf } from './security/request-protection';
import { csrfSecret as resolveCsrfSecret } from './security/csrf-secret';

/** Assemble middleware and API routes without starting a listener. */
export function createApp(
  db: Pick<PrismaClient, '$queryRaw' | '$transaction' | 'user'>,
): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(createSessionMiddleware(db));
  app.use(express.json({ limit: '64kb', strict: true }));
  const csrfSecret = resolveCsrfSecret();
  app.get('/api/csrf', (_req, res) => {
    const token = issueCsrf(res, csrfSecret);
    res.status(200).json({ csrfToken: token });
  });
  app.use('/api', currentUserMiddleware(db));
  app.use('/api', protectWrites(csrfSecret));
  app.use('/api', createRoutes(db));
  app.use(express.static(resolve(process.cwd(), 'dist/frontend')));
  app.use(errorHandler);
  return app;
}
