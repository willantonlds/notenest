import { expect, test } from '@playwright/test';

/** Verify the public shell remains accessible and usable at desktop/mobile widths. */
test('public shell and health are available in Chromium', async ({
  page,
  request,
}) => {
  const health = await request.get('/api/health');
  expect(health.status()).toBe(200);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /good notes/i }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'NoteNest' })).toBeVisible();
  await expect(
    page.getByText('Your study space is getting ready.'),
  ).toBeVisible();
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 1280);
  await page.setViewportSize({ width: 360, height: 812 });
  await expect(
    page.getByRole('heading', { name: /good notes/i }),
  ).toBeVisible();
  expect(
    await page.locator('body').evaluate((node) => node.scrollWidth),
  ).toBeLessThanOrEqual(360);
});
