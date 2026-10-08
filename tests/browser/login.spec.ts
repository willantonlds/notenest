import { expect, test } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/** Exercise sign-in in Chromium and verify the saved server session survives reload. */
test('login persists the session and exposes only safe profile data', async ({
  page,
}) => {
  const db = new PrismaClient();
  const email = `browser-${crypto.randomUUID()}@example.test`;
  const password = 'correct-horse';
  let userId: string | undefined;
  try {
    const user = await db.user.create({
      data: {
        displayName: 'Browser sign-in',
        email,
        passwordHash: await bcrypt.hash(password, 4),
      },
      select: { id: true },
    });
    userId = user.id;
    const anonymous = await page.request.get('/api/auth/me');
    expect(anonymous.status()).toBe(401);
    await page.goto('/login?expired=1');
    await expect(page.getByRole('status')).toContainText('session expired');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/notes$/);
    await page.reload();
    const me = await page.request.get('/api/auth/me');
    expect(me.status()).toBe(200);
    expect(me.headers()['cache-control']).toContain('no-store');
    expect(await me.json()).toMatchObject({
      user: { email, displayName: 'Browser sign-in' },
    });
  } finally {
    if (userId) {
      await db.session.deleteMany({ where: { userId } });
      await db.user.deleteMany({ where: { id: userId } });
    }
    await db.$disconnect();
  }
});
