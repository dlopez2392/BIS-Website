import { test, expect } from '@playwright/test';

test('home hero renders headline + both CTAs (EN)', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { level: 1, name: /The system your business runs on\. Built here, for here\./i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Explore the platform/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Book a free assessment/i })).toBeVisible();
});

test('home hero renders localized headline (ES)', async ({ page }) => {
  await page.goto('/es');
  await expect(page.getByRole('heading', { level: 1, name: /El sistema que mueve tu negocio\. Hecho aquí, para aquí\./i })).toBeVisible();
});

/**
 * The backdrop video starts from an inline script at HTML-parse time, before
 * React — so the gate that spares phones and reduced-motion visitors a
 * megabyte no longer lives only in the effect. Proved here in a real browser
 * rather than trusted: at phone width, and under reduced motion at desktop
 * width, the <video> must never receive a src.
 */
test.describe('backdrop video gate', () => {
  test('a phone never fetches the backdrop video', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const fetched: string[] = [];
    page.on('request', (r) => { if (/\/hero\/bis-hero\./.test(r.url())) fetched.push(r.url()); });
    await page.goto('/en');
    await page.waitForTimeout(1500);
    expect(await page.locator('.hero-photo video').getAttribute('src')).toBeNull();
    expect(fetched).toEqual([]);
  });

  test('reduced motion never fetches the backdrop video, at any width', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    const fetched: string[] = [];
    page.on('request', (r) => { if (/\/hero\/bis-hero\./.test(r.url())) fetched.push(r.url()); });
    await page.goto('/en');
    await page.waitForTimeout(1500);
    expect(await page.locator('.hero-photo video').getAttribute('src')).toBeNull();
    expect(fetched).toEqual([]);
  });

  test('a wide viewport fetches the v2 footage once and lights it', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const fetched: string[] = [];
    page.on('request', (r) => { if (/\/hero\/bis-hero\./.test(r.url())) fetched.push(r.url()); });
    await page.goto('/en');
    await expect(page.locator('.hero-photo video.is-in')).toHaveCount(1, { timeout: 10_000 });
    expect(fetched.length).toBe(1);
    expect(fetched[0]).toMatch(/bis-hero\.2\.(webm|mp4)$/);
    await expect(page.locator('.hero.has-video')).toHaveCount(1);
  });
});
