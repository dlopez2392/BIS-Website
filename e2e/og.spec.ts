import { test, expect } from '@playwright/test';

test('OG route returns a PNG image', async ({ request }) => {
  const res = await request.get('/og?title=Test%20Card');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
});

test('a page references the OG image in its metadata', async ({ page }) => {
  await page.goto('/en/services');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\?title=/);
});
