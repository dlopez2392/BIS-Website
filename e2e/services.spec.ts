import { test, expect } from '@playwright/test';

test('services lists three groups in ES', async ({ page }) => {
  await page.goto('/es/services');
  await expect(page.getByRole('heading', { name: 'IA y Automatización' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Consultoría IT y Seguridad' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Diseño Web' })).toBeVisible();
});

test('services index jumps to each of the four sections', async ({ page }) => {
  await page.goto('/services');
  const index = page.getByRole('navigation', { name: 'Four ways we help' });
  for (const anchor of ['ai', 'infrastructure', 'web', 'platform']) {
    await expect(index.locator(`a[href="#${anchor}"]`)).toHaveCount(1);
    await expect(page.locator(`section#${anchor}[data-service]`)).toHaveCount(1);
  }
  await index.locator('a[href="#platform"]').click();
  await expect(page.getByRole('heading', { level: 2, name: 'BIS Platform' })).toBeInViewport();
});

test('services FAQ is marked up for search', async ({ page }) => {
  await page.goto('/services');
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  const faq = schemas.map((s) => JSON.parse(s)).find((s) => s['@type'] === 'FAQPage');
  expect(faq?.mainEntity.length).toBe(await page.locator('section[aria-labelledby="faq-h"] details').count());
});
