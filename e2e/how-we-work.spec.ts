import { test, expect } from '@playwright/test';

test('how-we-work page renders heading + a step + pricing (EN)', async ({ page }) => {
  await page.goto('/en/how-we-work');
  await expect(page.getByRole('heading', { level: 1, name: /How We Work/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Fixed proposal/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /How pricing works/i })).toBeVisible();
});

test('how-we-work page renders localized heading (ES)', async ({ page }) => {
  await page.goto('/es/how-we-work');
  await expect(page.getByRole('heading', { level: 1, name: /Cómo Trabajamos/i })).toBeVisible();
});

test('footer links to how-we-work', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('link', { name: /How We Work/i })).toBeVisible();
});
