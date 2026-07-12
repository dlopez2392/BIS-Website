import { test, expect } from '@playwright/test';

test('capabilities reachable from the marquee link and lists tech', async ({ page }) => {
  await page.goto('/en');
  await page.getByRole('link', { name: /full technology stack/i }).click();
  await expect(page).toHaveURL(/\/en\/capabilities/);
  await expect(page.getByRole('heading', { level: 1, name: /Capabilities/i })).toBeVisible();
  await expect(page.getByText('Litify')).toBeVisible();
});

test('spanish capabilities renders the localized title', async ({ page }) => {
  await page.goto('/es/capabilities');
  await expect(page.getByRole('heading', { level: 1, name: /Capacidades/i })).toBeVisible();
});
