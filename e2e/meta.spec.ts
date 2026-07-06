import { test, expect } from '@playwright/test';

test('localized titles and 404', async ({ page }) => {
  await page.goto('/es');
  await expect(page).toHaveTitle(/Valle del Río Grande/);
  const res = await page.goto('/en/does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.getByText('Page not found')).toBeVisible();
});
