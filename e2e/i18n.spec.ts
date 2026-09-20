import { test, expect } from '@playwright/test';

test('serves English at /en', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { name: /The system your business runs on/i })).toBeVisible();
});

test('serves Spanish at /es', async ({ page }) => {
  await page.goto('/es');
  await expect(page.getByRole('heading', { name: /El sistema que mueve tu negocio/i })).toBeVisible();
});

test('redirects bare / to default locale', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/en$/);
});
