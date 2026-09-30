import { test, expect } from '@playwright/test';

/**
 * The work BIS has shipped, shown rather than described: Prism's case on
 * /work, the 30-second films, and the Prism teaser on the home page.
 *
 * What these pin is the policy, not the pixels: a film never plays or
 * downloads on its own (sound that starts by itself makes people leave, and
 * two films must not cost 5MB before anyone asks), it does play when asked,
 * the live-demo link goes where it says in a new tab, and the screenshots
 * follow the site's own theme rather than flash-banging a dark-mode reader.
 */

test('the Prism case shows its film and screens, and links out to the live demo in a new tab', async ({ page }) => {
  await page.goto('/en/work');
  const prism = page.locator('article#prism');
  await expect(prism.getByRole('heading', { name: 'Prism, your money in full color' })).toBeVisible();

  const demo = prism.getByRole('link', { name: /See the live demo/ });
  await expect(demo).toHaveAttribute('href', 'https://prism.bis-rgv.com');
  await expect(demo).toHaveAttribute('target', '_blank');
  await expect(demo).toHaveAttribute('rel', /noopener/);

  // One screen large and three phone screens, each with real alt text.
  await expect(prism.locator('[data-themed-shot]')).toHaveCount(4);
  for (const img of await prism.locator('[data-themed-shot] img:visible').all()) {
    expect((await img.getAttribute('alt'))?.length ?? 0).toBeGreaterThan(20);
  }
});

test('a film never plays or downloads by itself, and plays when asked', async ({ page }) => {
  const videoRequests: string[] = [];
  page.on('request', (r) => { if (/\/video\/.*\.(mp4|webm)$/.test(r.url())) videoRequests.push(r.url()); });

  await page.goto('/en/work');
  const film = page.locator('article#prism video');
  await expect(film).toHaveAttribute('preload', 'none');
  await expect(film).not.toHaveAttribute('autoplay', /.*/);
  await film.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  expect(await film.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  expect(videoRequests, 'no video bytes before play').toEqual([]);

  await film.evaluate((v: HTMLVideoElement) => { v.muted = true; return v.play(); });
  await expect.poll(() => film.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 15_000 }).toBeGreaterThan(0.5);
  expect(videoRequests.length).toBeGreaterThan(0);
});

test('the Prism screenshots follow the site theme', async ({ page }) => {
  await page.goto('/en/work');
  const shot = page.locator('article#prism [data-themed-shot="overview"]');
  await expect(shot.locator('img[src*="overview-desktop-light"]')).toBeVisible();
  await expect(shot.locator('img[src*="overview-desktop-dark"]')).toBeHidden();
  await page.getByRole('button', { name: 'Toggle theme' }).first().click();
  await expect(shot.locator('img[src*="overview-desktop-dark"]')).toBeVisible();
  await expect(shot.locator('img[src*="overview-desktop-light"]')).toBeHidden();
});

test('the Spanish case says plainly that Prism is in English for now', async ({ page }) => {
  await page.goto('/es/work');
  await expect(page.locator('article#prism')).toContainText('solo en inglés');
});

test('the platform page carries the 30-second film, click to play', async ({ page }) => {
  await page.goto('/en/platform');
  const film = page.locator('[data-platform-film] video');
  await expect(film).toBeVisible();
  await expect(film).toHaveAttribute('preload', 'none');
  await expect(film).toHaveAttribute('poster', '/video/bis-ad-poster.1.webp');
  await expect(film).toHaveAttribute('aria-label', 'Play the 30-second BIS video');
});

test('the home page points at Prism, both to the live demo and to how it was built', async ({ page }) => {
  await page.goto('/en');
  const teaser = page.locator('[data-prism-teaser]');
  await expect(teaser).toBeVisible();
  await expect(teaser.getByRole('link', { name: /See the live demo/ })).toHaveAttribute('href', 'https://prism.bis-rgv.com');
  await teaser.getByRole('link', { name: 'How we built it' }).click();
  await expect(page).toHaveURL(/\/en\/work#prism$/);
  await expect(page.locator('article#prism')).toBeInViewport();
});
