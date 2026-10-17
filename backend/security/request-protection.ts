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
  const origin = req.get('origin');
  if (!origin || !process.env.APP_ORIGIN || origin !== process.env.APP_ORIGIN) {
    return false;
  }
  const header = req.get('x-csrf-token');
  const cookie = readCookie(req, COOKIE);
  if (!header || !cookie || header !== cookie) return false;
  const [nonce, signature, extra] = cookie.split('.');
  if (!nonce || !signature || extra) return false;
  const left = Buffer.from(signature);
  const right = Buffer.from(sign(nonce, secret));
  return left.length === right.length && timingSafeEqual(left, right);
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
