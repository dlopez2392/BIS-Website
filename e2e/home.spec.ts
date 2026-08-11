import { test, expect } from '@playwright/test';

test('home renders hero in EN and ES', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { name: /Let us Be your Intelligent Solution/i })).toBeVisible();
  await page.goto('/es');
  await expect(page.getByRole('heading', { name: /Deja que seamos tu Solución Inteligente/i })).toBeVisible();
});

test('home renders NOW OPEN announcement and Insights teasers in EN', async ({ page }) => {
  await page.goto('/en');
  await expect(
    page.getByRole('heading', { name: /BIS is open in the Rio Grande Valley to help local businesses harness AI/i })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: /What we think/i })).toBeVisible();

  // The teasers are the three NEWEST posts, so naming one pins the test to
  // publishing order — this asserted "Bilingual by design" and broke the day
  // three newer posts shipped. Assert the behaviour instead: three teasers,
  // each linking to a post that actually resolves.
  const teasers = page.locator('a[href^="/en/insights/"]');
  await expect(teasers).toHaveCount(3);
  for (const href of await teasers.evaluateAll((links) => links.map((l) => l.getAttribute('href')!))) {
    expect(href).not.toBe('/en/insights/');
    const res = await page.request.get(href, { maxRedirects: 0 });
    expect(res.status(), `${href} status`).toBe(200);
  }
});
