import { afterAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { login, LoginError } from './login-service';

const db = new PrismaClient();
describe('login service throttle', () => {
  it('locks after five failures, resets expired locks, and clears on success', async () => {
    const email = `service-${crypto.randomUUID()}@example.test`;
    const password = 'valid-password';
    const user = await db.user.create({
      data: {
        displayName: 'Service test',
        email,
        passwordHash: await bcrypt.hash(password, 12),
      },
    });
    try {
      for (let i = 0; i < 5; i++)
        await expect(
          login(db, { email, password: 'wrong' }),
        ).rejects.toBeInstanceOf(LoginError);
      expect(
        (await db.user.findUniqueOrThrow({ where: { id: user.id } }))
          .loginFailures,
      ).toBe(5);
      await expect(login(db, { email, password })).rejects.toBeInstanceOf(
        LoginError,
      );
      let row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(row.lockedUntil).not.toBeNull();
      expect(row.loginFailures).toBe(5);
      await db.user.update({
        where: { id: user.id },
        data: { lockedUntil: new Date(Date.now() - 1000) },
      });
      await expect(
        login(db, { email, password: 'wrong' }),
      ).rejects.toBeInstanceOf(LoginError);
      row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(row.loginFailures).toBe(1);
      expect(row.lockedUntil).toBeNull();
      expect(
        await login(db, { email: email.toUpperCase(), password }),
      ).toMatchObject({ id: user.id, email });
      row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(row.loginFailures).toBe(0);
      expect(row.lockedUntil).toBeNull();
    } finally {
      await db.user.deleteMany({ where: { id: user.id } });
    }
  });
});
afterAll(async () => {
  await db.$disconnect();
});
