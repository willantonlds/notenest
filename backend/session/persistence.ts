import type { Prisma, PrismaClient } from '@prisma/client';
import type { SessionData } from 'express-session';

const IDLE_MS = 30 * 60 * 1000;
const ABSOLUTE_MS = 24 * 60 * 60 * 1000;
type Tx = Prisma.TransactionClient;
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
    if (
      row.expiresAt <= now ||
      row.createdAt.getTime() + ABSOLUTE_MS <= now.getTime()
    ) {
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

/** Save or touch a session while preserving its creation-time deadline. */
export async function writeSession(
  db: Db,
  sid: string,
  value: SessionData,
  touchOnly: boolean,
): Promise<void> {
  await db.$transaction(async (tx) => {
    await lock(tx, sid);
    if (await tx.sessionRevocation.findUnique({ where: { id: sid } })) return;
    const existing = await tx.session.findUnique({ where: { id: sid } });
    const now = new Date();
    const createdAt = existing?.createdAt ?? now;
    const expiresAt = new Date(
      Math.min(now.getTime() + IDLE_MS, createdAt.getTime() + ABSOLUTE_MS),
    );
    if ((existing && existing.expiresAt <= now) || expiresAt <= now) {
      await markRevoked(tx, sid);
      await tx.session.deleteMany({ where: { id: sid } });
      return;
    }
    if (touchOnly && !existing) return;
    const userId =
      typeof value.userId === 'string' ? value.userId : existing?.userId;
    if (!userId) return;
    await tx.session.upsert({
      where: { id: sid },
      create: {
        id: sid,
        userId,
        expiresAt,
        data: value as unknown as Prisma.InputJsonValue,
        createdAt,
      },
      update: {
        userId,
        expiresAt,
        data: value as unknown as Prisma.InputJsonValue,
      },
    });
  });
}

/** Persist a SID tombstone for an expiry or explicit destroy. */
async function markRevoked(tx: Tx, sid: string): Promise<void> {
  await tx.sessionRevocation.upsert({
    where: { id: sid },
    create: { id: sid },
    update: {},
  });
}

/** Acquire this SID's transaction-scoped database lock. */
async function lock(tx: Tx, sid: string): Promise<void> {
  await tx.$queryRaw`WITH held AS MATERIALIZED (SELECT pg_advisory_xact_lock(hashtextextended(${sid}, 0))) SELECT 1 FROM held`;
}
