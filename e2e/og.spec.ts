import { test, expect } from '@playwright/test';

// JPEG, and small: a 730 KB PNG was past the ~300 KB WhatsApp is reported to
// drop link previews at (live audit, 2026-10-09). 300 KB is the line that
// matters; the card with the plate behind it is the heavy case.
test('OG route returns a JPEG small enough for a WhatsApp preview', async ({ request }) => {
  const res = await request.get('/og?title=Test%20Card&locale=es');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/jpeg');
  const body = await res.body();
  expect(body.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
  expect(body.length).toBeLessThan(300 * 1024);
});

test('a page references the OG image in its metadata', async ({ page }) => {
  await page.goto('/en/services');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\?title=/);
});

// Some crawlers and older clients ask for /favicon.ico by name, whatever the
// page's <link rel="icon"> says; it was a 404 until 2026-10-09.
test('serves /favicon.ico', async ({ request }) => {
  const res = await request.get('/favicon.ico');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toMatch(/image\/(x-icon|vnd\.microsoft\.icon)/);
});

// The theme toggle's accessible name was English on every /es page.
test('the theme toggle is named in Spanish on a Spanish page', async ({ page }) => {
  await page.goto('/es');
  await expect(page.getByRole('button', { name: 'Cambiar a modo claro u oscuro' }).first()).toBeVisible();
});
