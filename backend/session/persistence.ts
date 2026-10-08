import type { PrismaClient } from '@prisma/client';
import { lock, markRevoked } from './write-operations';
import { absoluteExpired } from './write-policy';
import { writeSession } from './write';
import type { SessionData } from 'express-session';

type Db = Pick<PrismaClient, '$transaction'>;

/** Read a live session under the same SID lock used by mutations. */
export async function readSession(
  db: Db,
  sid: string,
): Promise<SessionData | null> {
  return db.$transaction(async (tx) => {
    await lock(tx, sid);
    const revoked = await tx.sessionRevocation.findUnique({
      where: { id: sid },
    });
    const row = await tx.session.findUnique({ where: { id: sid } });
    if (revoked || !row) return null;
    const now = new Date();
    if (row.expiresAt <= now || absoluteExpired(row.createdAt, now)) {
      await markRevoked(tx, sid);
      await tx.session.deleteMany({ where: { id: sid } });
      return null;
    }
    return row.data as unknown as SessionData;
  });
}

/** Record permanent revocation and remove its session atomically. */
export async function revokeSession(db: Db, sid: string): Promise<void> {
  await db.$transaction(async (tx) => {
    await lock(tx, sid);
    await markRevoked(tx, sid);
    await tx.session.deleteMany({ where: { id: sid } });
  });
}

export { writeSession };
