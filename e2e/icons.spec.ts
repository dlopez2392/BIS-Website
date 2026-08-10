import { test, expect } from '@playwright/test';

/**
 * These assert the icons are actually REACHABLE, not merely declared. The build
 * output lists an icon route and the <link> tag renders either way — the only
 * thing that catches a middleware redirect eating the request is fetching it.
 */

test('the page declares both the vector icon and the iOS icon', async ({ page }) => {
  await page.goto('/en');
  const icon = page.locator('link[rel="icon"]');
  await expect(icon).toHaveAttribute('type', 'image/svg+xml');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('sizes', '180x180');
});

test('every declared icon serves an image without a redirect', async ({ page, request }) => {
  await page.goto('/en');
  const hrefs = await page.locator('link[rel="icon"], link[rel="apple-touch-icon"]').evaluateAll(
    (nodes) => nodes.map((n) => n.getAttribute('href')!)
  );
  expect(hrefs.length).toBeGreaterThanOrEqual(2);

  for (const href of hrefs) {
    // maxRedirects: 0 is the point — /apple-icon used to 307 into /en/apple-icon
    // and 404 there, which no build check or rendered tag would have revealed.
    const res = await request.get(href, { maxRedirects: 0 });
    expect(res.status(), `${href} status`).toBe(200);
    expect(res.headers()['content-type'], `${href} type`).toMatch(/^image\//);
  }
});

test('the create-next-app favicon is gone', async ({ request }) => {
  const res = await request.get('/favicon.ico', { maxRedirects: 0 });
  expect(res.status()).toBe(404);
});

test('the downloadable brand assets are reachable', async ({ request }) => {
  // Handed out for LinkedIn, Google Business Profile and print, so a redirect
  // or a 404 here is something Dan finds out about in front of someone else.
  const png = await request.get('/brand/mark.png', { maxRedirects: 0 });
  expect(png.status()).toBe(200);
  expect(png.headers()['content-type']).toContain('image/png');

  const svg = await request.get('/brand/bis-mark.svg', { maxRedirects: 0 });
  expect(svg.status()).toBe(200);
  expect(await svg.text()).toContain('#7c3aed');
});

test('the about page holds its shape while the portrait slot is empty', async ({ page }) => {
  await page.goto('/en/about');
  await expect(page.getByRole('heading', { name: 'Dan Lopez' })).toBeVisible();
  // No photo file yet, so no image element — never a broken icon or a
  // placeholder box. This flips when public/photos/dan-lopez.jpg lands.
  await expect(page.locator('main img')).toHaveCount(0);
});

test('the OG image still renders and carries the mark', async ({ request }) => {
  const res = await request.get('/og?title=Test', { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
  expect((await res.body()).length).toBeGreaterThan(10_000);
});
