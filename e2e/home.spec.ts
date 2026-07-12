import { test, expect } from '@playwright/test';

test('home renders hero in EN and ES', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { name: /Let us Be your Intelligent Solution/i })).toBeVisible();
  await page.goto('/es');
  await expect(page.getByRole('heading', { name: /Deja que seamos tu Solución Inteligente/i })).toBeVisible();
});

test('home renders NOW OPEN announcement and Insights teasers in EN', async ({ page }) => {
  await page.goto('/en');
  await expect(
    page.getByRole('heading', { name: /BIS is open in the Rio Grande Valley to help local businesses harness AI/i })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: /What we think/i })).toBeVisible();
  await expect(page.getByText('Bilingual by design, not by translation')).toBeVisible();
});
