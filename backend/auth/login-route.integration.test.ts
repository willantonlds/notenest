import { afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  cleanupTestUser,
  shutdownAuthTestServer,
  startAuthTestServer,
} from './auth-test-support';

const db = new PrismaClient();
const { server, base } = startAuthTestServer(db);
afterAll(() => shutdownAuthTestServer(server, db));
describe('login API', () => {
  it('keeps errors generic and persists a safe authenticated session', async () => {
    const csrf = await fetch(`${base}/api/csrf`);
    const token = ((await csrf.json()) as { csrfToken: string }).csrfToken;
    const cookie = csrf.headers
      .getSetCookie()
      .map((v) => v.split(';')[0])
      .join('; ');
    const original = process.env.APP_ORIGIN,
      email = `login-${crypto.randomUUID()}@example.test`,
      password = 'correct-horse';
    process.env.APP_ORIGIN = base;
    try {
      const registered = await fetch(`${base}/api/auth/register`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: base,
          cookie,
          'x-csrf-token': token,
        },
        body: JSON.stringify({ displayName: 'Login test', email, password }),
      });
      expect(registered.status).toBe(201);
      const attempt = (account: string, secret: string) =>
        fetch(`${base}/api/auth/login`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            origin: base,
            cookie,
            'x-csrf-token': token,
          },
          body: JSON.stringify({ email: account, password: secret }),
        });
      const wrong = await attempt(email, 'wrong-password'),
        unknown = await attempt(`absent-${email}`, 'wrong-password');
      expect(wrong.status).toBe(401);
      expect(await wrong.text()).toBe(await unknown.text());
      const good = await attempt(email, password);
      expect(good.status).toBe(200);
      expect(await good.text()).not.toContain('passwordHash');
      const sid = good.headers
        .getSetCookie()
        .find((v) => v.startsWith('notenest.sid='));
      expect(sid).toBeTruthy();
      expect(
        await db.session.findFirst({
          where: {
            userId: (await db.user.findUniqueOrThrow({ where: { email } })).id,
          },
        }),
      ).not.toBeNull();
      const me = await fetch(`${base}/api/auth/me`, {
        headers: { cookie: sid!.split(';')[0] },
      });
      expect(me.status).toBe(200);
      expect(me.headers.get('cache-control')).toContain('no-store');
      expect(await me.text()).not.toContain('passwordHash');
    } finally {
      if (original === undefined) delete process.env.APP_ORIGIN;
      else process.env.APP_ORIGIN = original;
      await cleanupTestUser(db, email);
    }
  });
});
