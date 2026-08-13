import { test, expect } from '@playwright/test';

test('serves English at /en', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { name: /Let us be your Bespoke Intelligent Solution/i })).toBeVisible();
});

test('serves Spanish at /es', async ({ page }) => {
  await page.goto('/es');
  await expect(page.getByRole('heading', { name: /Deja que seamos tu Solución Inteligente/i })).toBeVisible();
});

test('redirects bare / to default locale', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/en$/);
});
