import { afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  authTestBase,
  cleanupTestUser,
  createAuthTestServer,
  shutdownAuthTestServer,
} from './auth-test-support';
import { cookieHeader, sessionId, sidCookie } from './test-helpers/logout';
const db = new PrismaClient();
const server = createAuthTestServer(db);
afterAll(() => shutdownAuthTestServer(server, db));
describe('logout API', () => {
  it('revokes only the current persistent session', async () => {
    const base = authTestBase(server);
    const original = process.env.APP_ORIGIN;
    process.env.APP_ORIGIN = base;
    const email = `logout-${crypto.randomUUID()}@example.test`;
    try {
      const csrf = await fetch(`${base}/api/csrf`);
      const token = ((await csrf.json()) as { csrfToken: string }).csrfToken;
      const csrfCookie = cookieHeader(csrf);
      const headers = {
        'content-type': 'application/json',
        origin: base,
        cookie: csrfCookie,
        'x-csrf-token': token,
      };
      const registered = await fetch(`${base}/api/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          displayName: 'Logout test',
          email,
          password: 'correct-horse',
        }),
      });
      expect(registered.status).toBe(201);
      const login = () =>
        fetch(`${base}/api/auth/login`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email, password: 'correct-horse' }),
        });
      const first = await login();
      const second = await login();
      const firstSid = sidCookie(first);
      const secondSid = sidCookie(second);
      const result = await fetch(`${base}/api/auth/logout`, {
        method: 'POST',
        headers: {
          origin: base,
          cookie: `${csrfCookie}; ${firstSid}`,
          'x-csrf-token': token,
          'content-type': 'application/json',
        },
      });
      expect(result.status).toBe(204);
      expect(result.headers.get('cache-control')).toBe('no-store');
      expect(
        result.headers
          .getSetCookie()
          .some((v) => v.startsWith('notenest.sid=;')),
      ).toBe(true);
      const me = (cookie: string) =>
        fetch(`${base}/api/auth/me`, { headers: { cookie } });
      expect((await me(firstSid)).status).toBe(401);
      expect((await me(secondSid)).status).toBe(200);
      const sid = sessionId(firstSid);
      expect(await db.session.findUnique({ where: { id: sid } })).toBeNull();
      expect(
        await db.sessionRevocation.findUnique({ where: { id: sid } }),
      ).not.toBeNull();
    } finally {
      if (original === undefined) delete process.env.APP_ORIGIN;
      else process.env.APP_ORIGIN = original;
      await cleanupTestUser(db, email);
    }
  });
});
