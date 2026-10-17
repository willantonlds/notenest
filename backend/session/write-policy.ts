import type { SessionData } from 'express-session';

const IDLE_MS = 30 * 60 * 1000;
const ABSOLUTE_MS = 24 * 60 * 60 * 1000;

/** Bound idle expiry by the session's immutable absolute deadline. */
export function getExpiry(now: Date, createdAt: Date): Date {
  return new Date(
    Math.min(now.getTime() + IDLE_MS, createdAt.getTime() + ABSOLUTE_MS),
  );
}

/** Identify sessions that must be permanently revoked. */
export function existingExpired(
  existing: { expiresAt: Date } | null,
  now: Date,
  expiresAt: Date,
): boolean {
  return Boolean((existing && existing.expiresAt <= now) || expiresAt <= now);
}

/** Select the current user or retain the existing session owner. */
export function sessionUserId(
  value: SessionData,
  existing?: string,
): string | undefined {
  return typeof value.userId === 'string' ? value.userId : existing;
}

/** Check the immutable absolute lifetime independently of idle expiry. */
export function absoluteExpired(createdAt: Date, now: Date): boolean {
  return createdAt.getTime() + ABSOLUTE_MS <= now.getTime();
}

/** Do not recreate a missing session during a touch-only update. */
export function shouldSkipTouch(
  touchOnly: boolean,
  existing: unknown,
): boolean {
  return touchOnly && !existing;
}
