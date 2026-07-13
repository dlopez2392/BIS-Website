import { test, expect } from '@playwright/test';

test('privacy page renders heading + a known section (EN)', async ({ page }) => {
  await page.goto('/en/privacy');
  await expect(page.getByRole('heading', { level: 1, name: /Privacy Policy/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Who processes your data/i })).toBeVisible();
});

test('privacy page renders localized heading (ES)', async ({ page }) => {
  await page.goto('/es/privacy');
  await expect(page.getByRole('heading', { level: 1, name: /Política de Privacidad/i })).toBeVisible();
});

test('footer links to the privacy policy', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('link', { name: /Privacy Policy/i })).toBeVisible();
});
