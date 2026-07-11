import { test, expect } from '@playwright/test';

test('EN insights lists posts and opens one', async ({ page }) => {
  await page.goto('/en/insights');
  const card = page.getByRole('link', { name: /first hour back/i }).first();
  await expect(card).toBeVisible();
  await card.click();
  await expect(page.getByRole('heading', { level: 1, name: /first hour back/i })).toBeVisible();
});

test('ES insights renders a localized post', async ({ page }) => {
  await page.goto('/es/insights');
  await expect(page.getByRole('heading', { level: 1, name: /Perspectivas/i })).toBeVisible();
  await page.getByRole('link', { name: /primera hora/i }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: /primera hora/i })).toBeVisible();
});
