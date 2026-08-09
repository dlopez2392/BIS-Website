import { test, expect } from '@playwright/test';

test('a city page renders its own copy and schema (EN)', async ({ page }) => {
  await page.goto('/en/service-area/brownsville');
  await expect(page.getByRole('heading', { level: 1, name: /IT and AI for Brownsville businesses/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Customs brokers and freight forwarders/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /What we see in Brownsville/i })).toBeVisible();

  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const service = blocks.map((b) => JSON.parse(b)).find((s) => s['@type'] === 'Service');
  expect(service.areaServed).toEqual({
    '@type': 'City',
    name: 'Brownsville',
    containedInPlace: { '@type': 'Place', name: 'Rio Grande Valley' },
  });
  expect(service.provider['@id']).toBe('https://bis-rgv.com/#business');
});

test('a city page renders localized (ES)', async ({ page }) => {
  await page.goto('/es/service-area/weslaco');
  await expect(page.getByRole('heading', { level: 1, name: /IT e IA para negocios de Weslaco/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Lo que vemos en Weslaco/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Productores y empacadoras/i })).toBeVisible();
});

test('city pages carry the canonical and hreflang for their own url', async ({ page }) => {
  await page.goto('/es/service-area/mcallen');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://bis-rgv.com/es/service-area/mcallen'
  );
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
    'href',
    'https://bis-rgv.com/en/service-area/mcallen'
  );
});

test('the service-area page links to every city that has a page', async ({ page }) => {
  await page.goto('/en/service-area');
  for (const [id, name] of [
    ['harlingen', 'Harlingen'],
    ['mcallen', 'McAllen'],
    ['brownsville', 'Brownsville'],
    ['edinburg', 'Edinburg'],
    ['weslaco', 'Weslaco'],
  ]) {
    await expect(page.getByRole('link', { name, exact: true })).toHaveAttribute('href', `/en/service-area/${id}`);
  }
  // A city without its own page stays plain text rather than a dead link.
  await expect(page.getByRole('link', { name: 'Raymondville', exact: true })).toHaveCount(0);
});

test('city pages cross-link to each other and offer the phone test', async ({ page }) => {
  await page.goto('/en/service-area/harlingen');
  await expect(page.getByRole('link', { name: 'McAllen', exact: true })).toHaveAttribute(
    'href',
    '/en/service-area/mcallen'
  );
  await expect(page.locator('main').locator('a[href="tel:+19567055146"]')).toBeVisible();
});

test('an unknown city 404s instead of rendering an empty page', async ({ page }) => {
  const res = await page.goto('/en/service-area/nowhere');
  expect(res?.status()).toBe(404);
});
