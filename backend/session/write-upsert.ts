import type { Prisma } from '@prisma/client';
import type { SessionData } from 'express-session';

type Tx = Prisma.TransactionClient;

/** Persist the selected values using an atomic upsert. */
async function upsertSession(
  tx: Tx,
  sid: string,
  value: SessionData,
  userId: string,
  expiresAt: Date,
  createdAt: Date,
): Promise<void> {
  const data = value as unknown as Prisma.InputJsonValue;
  await tx.session.upsert({
    where: { id: sid },
    create: { id: sid, userId, expiresAt, data, createdAt },
    update: { userId, expiresAt, data },
  });
}

/** Upsert only when a session has an owner. */
export async function persistUserSession(
  tx: Tx,
  sid: string,
  value: SessionData,
  userId: string | undefined,
  expiresAt: Date,
  createdAt: Date,
): Promise<void> {
  if (!userId) return;
  await upsertSession(tx, sid, value, userId, expiresAt, createdAt);
}
