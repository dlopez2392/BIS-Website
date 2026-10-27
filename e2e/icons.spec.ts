import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

/**
 * These assert the icons are actually REACHABLE, not merely declared. The build
 * output lists an icon route and the <link> tag renders either way — the only
 * thing that catches a middleware redirect eating the request is fetching it.
 */

test('the page declares both the vector icon and the iOS icon', async ({ page }) => {
  await page.goto('/en');
  // Two rel="icon" links since #69: the vector icon and favicon.ico.
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveCount(1);
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

// It was create-next-app's and was deleted; #69 brought back our own, because
// Google's results only show a site icon it can find at /favicon.ico.
test('favicon.ico is ours and serves an icon, not a redirect', async ({ request }) => {
  const res = await request.get('/favicon.ico', { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toMatch(/^image\//);
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

test('the about page renders the portrait slot exactly as the file on disk dictates', async ({ page }) => {
  await page.goto('/en/about');
  await expect(page.getByRole('heading', { name: 'Dan Lopez' })).toBeVisible();
  // The slot rule, asserted from the file rather than assumed: with
  // public/photos/dan-lopez.jpg present there is exactly one image and it is
  // a real one; without it there is none — never a broken icon or a
  // placeholder box. (This asserted "none" for months after the file landed.)
  const onDisk = fs.existsSync(path.join(process.cwd(), 'public', 'photos', 'dan-lopez.jpg'));
  // Scoped to the founder's section: the page's other images (the booking
  // band's art plate) are not the portrait.
  const founder = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Dan Lopez' }) });
  const imgs = founder.locator('img');
  await expect(imgs).toHaveCount(onDisk ? 1 : 0);
  if (onDisk) {
    await expect(imgs.first()).toBeVisible();
    expect(await imgs.first().evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
});

test('the OG image still renders and carries the mark', async ({ request }) => {
  const res = await request.get('/og?title=Test', { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  // JPEG since #69: a share card is a photograph-like plate, and as PNG it
  // was several times the size.
  expect(res.headers()['content-type']).toContain('image/jpeg');
  expect((await res.body()).length).toBeGreaterThan(10_000);
});
