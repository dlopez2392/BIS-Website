import { test, expect } from '@playwright/test';

test('tech marquee renders on the home page with logos', async ({ page }) => {
  await page.goto('/en');
  const strip = page.getByRole('region', { name: /Platforms we work with/i });
  await expect(strip).toBeVisible();
  await expect(strip.getByRole('img').first()).toBeVisible();
});

test('spanish home renders the localized marquee label', async ({ page }) => {
  await page.goto('/es');
  await expect(
    page.getByRole('region', { name: /Plataformas y herramientas con las que trabajamos/i }),
  ).toBeVisible();
});
