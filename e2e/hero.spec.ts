import { test, expect } from '@playwright/test';

test('home hero renders headline + both CTAs (EN)', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { level: 1, name: /Let us Be your Intelligent Solution\./i })).toBeVisible();
  await expect(page.getByRole('link', { name: /See how we do it/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Book a free assessment/i })).toBeVisible();
});

test('home hero renders localized headline (ES)', async ({ page }) => {
  await page.goto('/es');
  await expect(page.getByRole('heading', { level: 1, name: /Deja que seamos tu Solución Inteligente\./i })).toBeVisible();
});
