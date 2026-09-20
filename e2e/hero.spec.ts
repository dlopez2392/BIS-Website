import { test, expect } from '@playwright/test';

test('home hero renders headline + both CTAs (EN)', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { level: 1, name: /The system your business runs on\. Built here, for here\./i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Explore the platform/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Book a free assessment/i })).toBeVisible();
});

test('home hero renders localized headline (ES)', async ({ page }) => {
  await page.goto('/es');
  await expect(page.getByRole('heading', { level: 1, name: /El sistema que mueve tu negocio\. Hecho aquí, para aquí\./i })).toBeVisible();
});
