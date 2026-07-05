import { test, expect } from '@playwright/test';

test('nav links to Services and locale switch preserves path', async ({ page }) => {
  await page.goto('/en');
  await page.getByRole('link', { name: 'Services', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/services$/);
  await page.getByRole('link', { name: 'ES', exact: true }).click();
  await expect(page).toHaveURL(/\/es\/services$/);
});
