import { test, expect } from '@playwright/test';

test('service-area page renders heading + a city (EN)', async ({ page }) => {
  await page.goto('/en/service-area');
  await expect(page.getByRole('heading', { level: 1, name: /Serving the whole Rio Grande Valley/i })).toBeVisible();
  await expect(page.getByText('McAllen')).toBeVisible();
});

test('service-area page renders localized heading (ES)', async ({ page }) => {
  await page.goto('/es/service-area');
  await expect(page.getByRole('heading', { level: 1, name: /Servimos a todo el Valle del Río Grande/i })).toBeVisible();
});
