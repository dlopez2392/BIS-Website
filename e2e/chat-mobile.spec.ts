import { test, expect } from '@playwright/test';

/**
 * The chat widget on a phone, measured rather than assumed.
 *
 * The launcher is a fixed circle in the bottom-right corner. The two things
 * that can go wrong with that on a 360px screen are (1) page content with a
 * tap target scrolling underneath it — the hero's tab pills did — and (2) the
 * open panel being a floating box that does not fit. Both are geometry, so
 * both are asserted from bounding boxes on the smallest phone the site
 * supports, in Spanish, whose labels are the widest.
 */
test.use({ viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true });

const enabled = process.env.NEXT_PUBLIC_AI_ENABLED === 'true';

test('no tab pill in the hero ever sits under the launcher, at any scroll position', async ({ page }) => {
  test.skip(!enabled, 'assistant disabled');
  await page.goto('/es');
  await expect(page.locator('.stage-tab').first()).toBeVisible();
  const launcher = await page.getByTestId('chat-launcher').boundingBox();
  expect(launcher).not.toBeNull();
  const heroBottom = await page.locator('.hero').evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
  const overlaps: string[] = [];
  for (let y = 0; y < heroBottom; y += 24) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    const hits = await page.locator('.stage-tab').evaluateAll((els, l) => els
      .map((e) => ({ label: e.textContent ?? '', r: e.getBoundingClientRect() }))
      .filter(({ r }) => r.right > l!.x && r.left < l!.x + l!.width && r.bottom > l!.y && r.top < l!.y + l!.height)
      .map(({ label }) => label), launcher);
    if (hits.length) overlaps.push(`scrollY=${y}: ${hits.join(', ')}`);
  }
  expect(overlaps, overlaps.join('\n')).toEqual([]);
});

test('the open panel is a full-screen sheet that locks the page behind it, and Esc puts focus back on the launcher', async ({ page }) => {
  test.skip(!enabled, 'assistant disabled');
  await page.goto('/es');
  await page.getByTestId('chat-launcher').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box).toEqual({ x: 0, y: 0, width: 360, height: 640 });
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await expect(page.getByTestId('chat-input')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  await expect(page.getByTestId('chat-launcher')).toBeFocused();
});
