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
describe('login API', () => {
  it('keeps errors generic and persists a safe authenticated session', async () => {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No server.');
    const base = `http://127.0.0.1:${address.port}`;
    const csrf = await fetch(`${base}/api/csrf`);
    const token = ((await csrf.json()) as { csrfToken: string }).csrfToken;
    const cookie = csrf.headers
      .getSetCookie()
      .map((v) => v.split(';')[0])
      .join('; ');
    const original = process.env.APP_ORIGIN;
    process.env.APP_ORIGIN = base;
    const email = `login-${crypto.randomUUID()}@example.test`;
    const password = 'correct-horse';
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
      const attempt = async (account: string, secret: string) =>
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
      const wrong = await attempt(email, 'wrong-password');
      const unknown = await attempt(`absent-${email}`, 'wrong-password');
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
