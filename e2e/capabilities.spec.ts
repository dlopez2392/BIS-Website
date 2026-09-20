import { test, expect } from '@playwright/test';

test('capabilities is reachable from the footer and lists tech', async ({ page }) => {
  // The home-page logo wall and its "full technology stack" link were removed
  // (#43); the footer is where a visitor finds this page now.
  await page.goto('/en');
  await page.getByRole('contentinfo').getByRole('link', { name: /^Capabilities$/i }).click();
  await expect(page).toHaveURL(/\/en\/capabilities/);
  await expect(page.getByRole('heading', { level: 1, name: /Capabilities/i })).toBeVisible();
  await expect(page.getByText('Litify')).toBeVisible();
});

test('spanish capabilities renders the localized title', async ({ page }) => {
  await page.goto('/es/capabilities');
  await expect(page.getByRole('heading', { level: 1, name: /Capacidades/i })).toBeVisible();
});
