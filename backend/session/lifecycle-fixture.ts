import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll } from 'vitest';
import { createTestSessionApp } from './test-session-app';
import { cleanupSessionFixture, fixtureUser } from './lifecycle-resources';

export const db = new PrismaClient();
export const userId = crypto.randomUUID();
let server: Server | undefined;
let base = '';
const sessionIds: string[] = [];

/** Start and clean up one isolated HTTP session fixture per suite. */
export function useSessionFixture(): void {
  beforeAll(async () => {
    await db.user.upsert({
      where: { id: userId },
      create: fixtureUser(userId),
      update: {},
    });
    const httpServer = createServer(createTestSessionApp(db, userId));
    server = httpServer;
    await new Promise<void>((resolve) =>
      httpServer.listen(0, '127.0.0.1', resolve),
    );
    base = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
  });
  afterAll(() => cleanupSessionFixture(db, userId, sessionIds, server));
}

/** Send a request to an isolated test-only session endpoint. */
export function request(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  return fetch(`${base}${path}`, options);
}

/** Return a session cookie issued by the test-only login route. */
export async function login(existingCookie?: string): Promise<string> {
  const response = await request('/test/login', {
    method: 'POST',
    ...(existingCookie ? { headers: { cookie: existingCookie } } : {}),
  });
  const value = cookie(response);
  const token = decodeURIComponent(value.split('=')[1] ?? '');
  if (token.startsWith('s:')) sessionIds.push(token.slice(2).split('.')[0]);
  return value;
}

/** Fetch the test identity endpoint with an existing browser cookie. */
export async function identity(cookieValue: string): Promise<string | null> {
  const response = await request('/test/me', {
    headers: { cookie: cookieValue },
  });
  return (await response.json()).userId;
}

/** Resolve the newest test session row for expiry and revocation assertions. */
export async function latestSession() {
  const row = await db.session.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  if (!row) throw new Error('Expected a persisted test session.');
  return row;
}

/** Extract only the cookie pair from a response header. */
export function cookie(response: Response): string {
  return decodeURIComponent(
    response.headers.get('set-cookie')?.split(';')[0] ?? '',
  ).split(';')[0];
}
