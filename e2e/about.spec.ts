import { test, expect } from '@playwright/test';

test('about shows founder and methodology in EN', async ({ page }) => {
  await page.goto('/en/about');
  await expect(page.getByRole('heading', { name: 'Dan Lopez' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Assess' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hand off' })).toBeVisible();
});
