import { afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../app';

const db = new PrismaClient();
const app = createApp(db);
const server = app.listen(0, '127.0.0.1');
afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await db.$disconnect();
});

describe('logout API', () => {
  it('revokes only the current persistent session', async () => {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No server.');
    const base = `http://127.0.0.1:${address.port}`;
    const original = process.env.APP_ORIGIN;
    process.env.APP_ORIGIN = base;
    const email = `logout-${crypto.randomUUID()}@example.test`;
    const password = 'correct-horse';
    try {
      const csrf = await fetch(`${base}/api/csrf`);
      const token = ((await csrf.json()) as { csrfToken: string }).csrfToken;
      const csrfCookie = csrf.headers
        .getSetCookie()
        .map((v) => v.split(';')[0])
        .join('; ');
      const headers = {
        'content-type': 'application/json',
        origin: base,
        cookie: csrfCookie,
        'x-csrf-token': token,
      };
      const registered = await fetch(`${base}/api/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ displayName: 'Logout test', email, password }),
      });
      expect(registered.status).toBe(201);
      const login = async () =>
        fetch(`${base}/api/auth/login`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email, password }),
        });
      const first = await login();
      const second = await login();
      const sidCookie = (response: Response) =>
        response.headers
          .getSetCookie()
          .find((v) => v.startsWith('notenest.sid='))!
          .split(';')[0];
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
      const sid = decodeURIComponent(firstSid.split('=')[1])
        .split('.')[0]
        .replace(/^s:/, '');
      expect(await db.session.findUnique({ where: { id: sid } })).toBeNull();
      expect(
        await db.sessionRevocation.findUnique({ where: { id: sid } }),
      ).not.toBeNull();
    } finally {
      if (original === undefined) delete process.env.APP_ORIGIN;
      else process.env.APP_ORIGIN = original;
      const user = await db.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (user) {
        await db.session.deleteMany({ where: { userId: user.id } });
        await db.user.deleteMany({ where: { id: user.id } });
      }
    }
  });
});
