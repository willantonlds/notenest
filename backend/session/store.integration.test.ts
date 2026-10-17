import { afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { SessionData } from 'express-session';
import { PrismaSessionStore } from './store';

const db = new PrismaClient();
const store = new PrismaSessionStore(db);
const userId = crypto.randomUUID();

/** Exercise revocation persistence and stale write serialization on PostgreSQL. */
describe('PrismaSessionStore concurrency', () => {
  afterAll(async () => {
    await db.sessionRevocation.deleteMany({
      where: { id: { startsWith: 'e06-race-' } },
    });
    await db.session.deleteMany({ where: { id: { startsWith: 'e06-race-' } } });
    await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  });

  it('does not let a delayed set restore a destroyed SID', async () => {
    await db.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        displayName: 'Session test',
        email: `session-test-${userId}@example.invalid`,
        passwordHash: 'test-hash',
      },
      update: {},
    });
    const sid = 'e06-race-' + crypto.randomUUID();
    const data = {
      cookie: {
        originalMaxAge: null,
        expires: null,
        secure: false,
        httpOnly: true,
        path: '/',
        sameSite: 'strict',
      },
      userId,
    } as unknown as SessionData;
    await new Promise<void>((resolve, reject) =>
      store.set(sid, data, (error) => (error ? reject(error) : resolve())),
    );
    await Promise.all([
      new Promise<void>((resolve, reject) =>
        store.destroy(sid, (error) => (error ? reject(error) : resolve())),
      ),
      new Promise<void>((resolve, reject) =>
        store.set(sid, data, (error) => (error ? reject(error) : resolve())),
      ),
    ]);
    const found = await new Promise<SessionData | null>((resolve, reject) =>
      store.get(sid, (error, value) =>
        error ? reject(error) : resolve(value ?? null),
      ),
    );
    expect(found).toBeNull();
    expect(
      await db.sessionRevocation.findUnique({ where: { id: sid } }),
    ).not.toBeNull();
  });
});
