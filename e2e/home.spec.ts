import { test, expect } from '@playwright/test';

test('home renders hero in EN and ES', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { name: /Let us Be your Intelligent Solution/i })).toBeVisible();
  await page.goto('/es');
  await expect(page.getByRole('heading', { name: /Deja que seamos tu Solución Inteligente/i })).toBeVisible();
});
