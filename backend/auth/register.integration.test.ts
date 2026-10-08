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
describe('registration API', () => {
  it('registers a member once and does not return password material', async () => {
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('Missing server address.');
    const base = `http://127.0.0.1:${address.port}`;
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
      const cleanupUser = await db.user.findUnique({
        where: { email: payload.email },
        select: { id: true },
      });
      if (cleanupUser) {
        await db.session.deleteMany({ where: { userId: cleanupUser.id } });
        await db.user.deleteMany({ where: { id: cleanupUser.id } });
      }
    }
  });
});
