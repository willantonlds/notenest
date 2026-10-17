import { expect, test } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/** Verify logout revokes the browser session and protects history navigation. */
test('logout clears session and browser history cannot reveal notes', async ({
  page,
}) => {
  const db = new PrismaClient();
  const email = `browser-logout-${crypto.randomUUID()}@example.test`;
  const password = 'correct-horse';
  let userId: string | undefined;
  try {
    const user = await db.user.create({
      data: {
        displayName: 'Browser logout',
        email,
        passwordHash: await bcrypt.hash(password, 4),
      },
      select: { id: true },
    });
    userId = user.id;
    const loginPage = await page.goto('/login');
    expect(loginPage?.headers()['cache-control']).toContain('no-store');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/notes$/);
    await expect(
      page.getByRole('heading', { name: 'Your notes' }),
    ).toBeVisible();
    await page.goto('/register');
    await page
      .locator('header')
      .getByRole('button', { name: 'Log out' })
      .click();
    await expect(page).toHaveURL('/');
    const me = await page.request.get('/api/auth/me');
    expect(me.status()).toBe(401);
    await page.goBack();
    await expect(page).toHaveURL(/\/login\?expired=1$/);
    await expect(page.getByRole('heading', { name: 'Your notes' })).toHaveCount(
      0,
    );
    await page.goForward();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Your notes' })).toHaveCount(
      0,
    );
  } finally {
    if (userId) {
      await db.session.deleteMany({ where: { userId } });
      await db.user.deleteMany({ where: { id: userId } });
    }
    await db.$disconnect();
  }
});
