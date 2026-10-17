import type { PrismaClient } from '@prisma/client';
import type { SessionData } from 'express-session';
import { persistSession } from './write-operations';

type Db = Pick<PrismaClient, '$transaction'>;

/** Save or touch a session while preserving its creation-time deadline. */
export async function writeSession(
  db: Db,
  sid: string,
  value: SessionData,
  touchOnly: boolean,
): Promise<void> {
  await db.$transaction((tx) => persistSession(tx, sid, value, touchOnly));
}
