import type { Server } from 'node:http';
import type { PrismaClient } from '@prisma/client';

type Db = Pick<
  PrismaClient,
  'user' | 'session' | 'sessionRevocation' | '$disconnect'
>;

/** Derive a unique fixture email from the suite's existing UUID. */
export function fixtureUser(userId: string) {
  return {
    id: userId,
    displayName: 'Session test',
    email: `session-test-${userId}@example.invalid`,
    passwordHash: 'test-hash',
  };
}

/** Clean only this fixture's rows, even when setup or server shutdown fails. */
export async function cleanupSessionFixture(
  db: Db,
  userId: string,
  sessionIds: string[],
  server?: Pick<Server, 'listening' | 'close'>,
): Promise<void> {
  try {
    if (server?.listening) {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  } finally {
    try {
      await db.session.deleteMany({ where: { userId } });
      await db.sessionRevocation.deleteMany({
        where: { id: { in: sessionIds } },
      });
      await db.user.deleteMany({ where: { id: userId } });
    } finally {
      await db.$disconnect();
    }
  }
}
