import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import type { AccountDto } from './register-service';
import { register } from './register-service';
import { RegistrationError } from './register-validation';

type Db = Pick<PrismaClient, 'user'>;
/** Map registration failures to stable, non-sensitive feedback. */
export function registrationMessage(error: RegistrationError): string {
  if (error.code === 'duplicate') return 'Email is already registered.';
  if (error.code === 'password')
    return 'Password must be at least 8 characters.';
  if (error.code === 'password-long')
    return 'Password must be at most 72 UTF-8 bytes.';
  return 'Enter a valid display name and email.';
}
/** Express registration handler type. */
type Handler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;
/** Run validation, account creation, and session setup. */
async function handle(
  db: Db,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await createSession(req, res, await register(db, req.body), next);
  } catch (error) {
    if (error instanceof RegistrationError) replyError(res, error);
    else next(error);
  }
}
/** Send a bounded client error response. */
function replyError(res: Response, error: RegistrationError): void {
  res
    .status(error.code === 'duplicate' ? 409 : 400)
    .json({ error: registrationMessage(error) });
}
/** Regenerate and save authenticated session state before replying. */
function createSession(
  req: Request,
  res: Response,
  user: AccountDto,
  next: NextFunction,
): void {
  req.session.regenerate((error) => {
    if (error) return next(error);
    req.session.userId = user.id;
    req.session.save((saveError) =>
      saveError ? next(saveError) : res.status(201).json({ user }),
    );
  });
}
/** Registration route persists member identity, then regenerates server session. */
export function registrationRoute(db: Db): Router {
  const router = Router();
  const handler: Handler = (req, res, next) => handle(db, req, res, next);
  router.post('/auth/register', handler);
  return router;
}
