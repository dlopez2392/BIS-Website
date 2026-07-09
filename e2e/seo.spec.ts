import { test, expect } from '@playwright/test';

test('pages have unique titles and hreflang + canonical', async ({ page }) => {
  await page.goto('/en/services');
  await expect(page).toHaveTitle(/Services/);
  const servicesTitle = await page.title();

  await page.goto('/en/about');
  const aboutTitle = await page.title();
  expect(aboutTitle).not.toBe(servicesTitle);
  await expect(page).toHaveTitle(/About/);

  // hreflang + canonical on a page
  await page.goto('/es/services');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://bis-rgv.com/es/services');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://bis-rgv.com/en/services');
  await expect(page.locator('link[hreflang="es"]')).toHaveAttribute('href', 'https://bis-rgv.com/es/services');
  await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute('href', 'https://bis-rgv.com/en/services');
});
