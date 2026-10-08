import type { PrismaClient } from '@prisma/client';
import type { Server } from 'node:http';
import { vi } from 'vitest';
import { createApp } from '../app';

export const account = {
  id: 'uuid',
  displayName: 'Ada',
  email: 'ada@example.com',
  role: 'MEMBER' as const,
};

type CreateArgs = {
  data: { passwordHash: string; role: string; email: string };
};

/** Create the mock user service used by registration unit tests. */
export function createUserMock() {
  return vi.fn(async (args: CreateArgs) => {
    void args;
    return account;
  });
}

/** Start the real app on an ephemeral loopback port for auth integration tests. */
export function createAuthTestServer(db: PrismaClient) {
  return createApp(db).listen(0, '127.0.0.1');
}

/** Read the ephemeral address after the test runner has started listening. */
export function authTestBase(server: Server) {
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No server.');
  return `http://127.0.0.1:${address.port}`;
}

/** Stop the ephemeral server and disconnect its database client. */
export async function shutdownAuthTestServer(server: Server, db: PrismaClient) {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await db.$disconnect();
}

/** Delete only the generated test user's sessions and account. */
export async function cleanupTestUser(db: PrismaClient, email: string) {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return;
  await db.session.deleteMany({ where: { userId: user.id } });
  await db.user.deleteMany({ where: { id: user.id } });
}
