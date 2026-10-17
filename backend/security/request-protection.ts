import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { CookieOptions, Request, Response } from 'express';

const COOKIE = 'notenest.csrf';
const MAX_AGE = 30 * 60 * 1000;

/** Issue a signed, HttpOnly pre-authentication CSRF token. */
export function issueCsrf(res: Response, secret: string): string {
  const nonce = randomBytes(32).toString('base64url');
  const token = `${nonce}.${sign(nonce, secret)}`;
  res.cookie(COOKIE, token, csrfCookieOptions());
  res.set('Cache-Control', 'no-store');
  return token;
}

/** Validate exact origin and signed double-submit cookie/header values. */
export function validWriteRequest(req: Request, secret: string): boolean {
  if (!validOrigin(req)) return false;
  const header = req.get('x-csrf-token');
  const cookie = readCookie(req, COOKIE);
  return Boolean(
    header && cookie && header === cookie && validSignature(cookie, secret),
  );
}

/** Keep the pre-auth token unavailable to scripts and cross-site requests. */
export function csrfCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
    path: '/',
  };
}

/** Read only the named cookie; malformed encodings fail closed. */
function readCookie(req: Request, name: string): string | null {
  const raw = req.get('cookie');
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key !== name || value.length !== 1) continue;
    try {
      return decodeURIComponent(value[0]);
    } catch {
      return null;
    }
  }
  return null;
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

/** Require the configured exact site origin. */
function validOrigin(req: Request): boolean {
  const origin = req.get('origin');
  const expected = process.env.APP_ORIGIN;
  return Boolean(origin && expected && origin === expected);
}

/** Verify a well-formed token signature using constant-time comparison. */
function validSignature(token: string, secret: string): boolean {
  const [nonce, signature, extra] = token.split('.');
  if (!nonce || !signature || extra) return false;
  const actual = Buffer.from(signature);
  const expected = Buffer.from(sign(nonce, secret));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
