import { afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  authTestBase,
  cleanupTestUser,
  createAuthTestServer,
  shutdownAuthTestServer,
} from './auth-test-support';

const db = new PrismaClient();
const server = createAuthTestServer(db);
afterAll(() => shutdownAuthTestServer(server, db));
describe('registration API', () => {
  it('registers a member once and does not return password material', async () => {
    const base = authTestBase(server);
    const csrfResponse = await fetch(`${base}/api/csrf`);
    const token = ((await csrfResponse.json()) as { csrfToken: string })
      .csrfToken;
    const cookies = csrfResponse.headers
      .getSetCookie()
      .map((cookie) => cookie.split(';')[0])
      .join('; ');
    const original = process.env.APP_ORIGIN;
    process.env.APP_ORIGIN = base;
    const payload = {
      displayName: 'S01 test',
      email: `s01-${crypto.randomUUID()}@example.test`,
      password: 'correct-horse',
    };
    try {
      const response = await fetch(`${base}/api/auth/register`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: base,
          cookie: cookies,
          'x-csrf-token': token,
        },
        body: JSON.stringify(payload),
      });
      expect(response.status).toBe(201);
      const sessionCookies = response.headers.getSetCookie();
      expect(
        sessionCookies.some((cookie) => cookie.startsWith('notenest.sid=')),
      ).toBe(true);
      const text = await response.text();
      expect(text).not.toContain(payload.password);
      expect(JSON.parse(text).user).toMatchObject({
        displayName: 'S01 test',
        role: 'MEMBER',
      });
      const user = await db.user.findUniqueOrThrow({
        where: { email: payload.email },
      });
      expect(user.passwordHash).not.toBe(payload.password);
      expect(
        await db.session.findFirst({ where: { userId: user.id } }),
      ).not.toBeNull();
      const duplicate = await fetch(`${base}/api/auth/register`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: base,
          cookie: cookies,
          'x-csrf-token': token,
        },
        body: JSON.stringify({
          ...payload,
          email: payload.email.toUpperCase(),
        }),
      });
      expect(duplicate.status).toBe(409);
      expect(await db.user.count({ where: { email: payload.email } })).toBe(1);
    } finally {
      if (original === undefined) delete process.env.APP_ORIGIN;
      else process.env.APP_ORIGIN = original;
      await cleanupTestUser(db, payload.email);
    }
  });
});
