import type { Prisma } from '@prisma/client';
import type { SessionData } from 'express-session';
import { persistUserSession } from './write-upsert';
import {
  existingExpired,
  getExpiry,
  sessionUserId,
  shouldSkipTouch,
} from './write-policy';

type Tx = Prisma.TransactionClient;
/** Persist a SID tombstone for an expiry or explicit destroy. */
export async function markRevoked(tx: Tx, sid: string): Promise<void> {
  await tx.sessionRevocation.upsert({
    where: { id: sid },
    create: { id: sid },
    update: {},
  });
}

/** Acquire this SID's transaction-scoped database lock. */
export async function lock(tx: Tx, sid: string): Promise<void> {
  await tx.$queryRaw`WITH held AS MATERIALIZED (SELECT pg_advisory_xact_lock(hashtextextended(${sid}, 0))) SELECT 1 FROM held`;
}

/** Perform the locked save while preserving expiry and tombstone rules. */
export async function persistSession(
  tx: Tx,
  sid: string,
  value: SessionData,
  touchOnly: boolean,
): Promise<void> {
  await lock(tx, sid);
  await saveUnlockedSession(tx, sid, value, touchOnly);
}

/** Apply tombstone, expiry, and owner checks before persisting. */
async function saveUnlockedSession(
  tx: Tx,
  sid: string,
  value: SessionData,
  touchOnly: boolean,
): Promise<void> {
  if (await isRevoked(tx, sid)) return;
  const existing = await tx.session.findUnique({ where: { id: sid } });
  await persistActiveSession(tx, sid, value, touchOnly, existing);
}

/** Enforce expiry and ownership for a non-revoked session. */
async function persistActiveSession(
  tx: Tx,
  sid: string,
  value: SessionData,
  touchOnly: boolean,
  existing: Awaited<ReturnType<Tx['session']['findUnique']>>,
): Promise<void> {
  const now = new Date();
  const createdAt = existing?.createdAt ?? now;
  const expiresAt = getExpiry(now, createdAt);
  if (existingExpired(existing, now, expiresAt)) {
    await expireSession(tx, sid);
    return;
  }
  if (shouldSkipTouch(touchOnly, existing)) return;
  const userId = sessionUserId(value, existing?.userId);
  await persistUserSession(tx, sid, value, userId, expiresAt, createdAt);
}

/** Check whether an SID was already permanently revoked. */
async function isRevoked(tx: Tx, sid: string): Promise<boolean> {
  return Boolean(await tx.sessionRevocation.findUnique({ where: { id: sid } }));
}

/** Revoke expired records atomically with removal. */
async function expireSession(tx: Tx, sid: string): Promise<void> {
  await markRevoked(tx, sid);
  await tx.session.deleteMany({ where: { id: sid } });
}
