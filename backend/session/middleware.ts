import { randomBytes } from 'node:crypto';
import session from 'express-session';
import type { PrismaClient } from '@prisma/client';
import type { CookieOptions } from 'express-session';
import { PrismaSessionStore } from './store';

const localSecret = randomBytes(32).toString('hex');

/** Build the shared server-side session middleware with fixed cookie policy. */
export function createSessionMiddleware(
  db: Pick<PrismaClient, '$transaction'>,
): ReturnType<typeof session> {
  const secret = process.env.SESSION_SECRET;
  if (
    process.env.NODE_ENV === 'production' &&
    (!secret || secret.length < 32)
  ) {
    throw new Error(
      'SESSION_SECRET must contain at least 32 characters in production.',
    );
  }
  return session({
    name: 'notenest.sid',
    secret: secret ?? localSecret,
    store: new PrismaSessionStore(db),
    resave: false,
    rolling: true,
    saveUninitialized: false,
    cookie: sessionCookieOptions(),
  });
}

/** Return strict session-cookie settings for the active runtime environment. */
export function sessionCookieOptions(
  env: NodeJS.ProcessEnv = process.env,
): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.NODE_ENV === 'production',
    maxAge: 30 * 60 * 1000,
  };
}
