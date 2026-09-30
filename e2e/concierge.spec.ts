import { test, expect, type Page } from '@playwright/test';

/**
 * The website assistant is the BIS Platform's concierge, mounted by the
 * platform's own loader (embed.js). These specs drive the real loader against
 * the live platform, so they are skipped when the assistant is switched off.
 *
 * What they pin is the part this site owns: the one tag it adds, the page
 * language and theme it hands over, that a language switch or a theme toggle
 * swaps the bubble rather than stacking a second one, that the CSP lets the
 * loader run, and that the launcher never sits on a tap target in the hero.
 * The conversation itself is the platform's, and is tested there.
 */
const enabled = process.env.NEXT_PUBLIC_AI_ENABLED === 'true';
const PLATFORM = (process.env.NEXT_PUBLIC_BIS_PLATFORM_ORIGIN ?? 'https://app.bis-rgv.com').replace(/\/+$/, '');

function cspViolations(page: Page): string[] {
  const seen: string[] = [];
  page.on('console', (m) => { if (/Content Security Policy/i.test(m.text())) seen.push(m.text()); });
  return seen;
}

const frameSrc = (page: Page) => page.locator(`iframe[src^="${PLATFORM}/c/"]`).getAttribute('src');

test.describe('desktop', () => {
  test.skip(!enabled, 'assistant disabled');

  test('mounts one launcher in the page language, and the loader runs under the CSP', async ({ page }) => {
    const violations = cspViolations(page);
    await page.goto('/en');
    const launcher = page.getByRole('button', { name: 'Chat with us' });
    await expect(launcher).toBeVisible();
    await expect(launcher).toHaveCount(1);
    const src = new URL((await frameSrc(page))!);
    expect(src.searchParams.get('locale')).toBe('en');
    expect(src.searchParams.get('theme')).toBe('light');
    expect(src.searchParams.get('page')).toContain('/en');
    expect(violations).toEqual([]);
  });

  test('opens a panel holding the platform chat and Esc closes it', async ({ page }) => {
    await page.goto('/en');
    const launcher = page.getByRole('button', { name: 'Chat with us' });
    await launcher.click();
    await expect(launcher).toHaveAttribute('aria-expanded', 'true');
    const frame = page.frameLocator(`iframe[src^="${PLATFORM}/c/"]`);
    await expect(frame.locator('#bis-concierge-input')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(launcher).toHaveAttribute('aria-expanded', 'false');
  });

  test('a language switch swaps the bubble for a Spanish one instead of stacking a second', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('button', { name: 'Chat with us' })).toBeVisible();
    await page.getByRole('link', { name: 'ES', exact: true }).first().click();
    await expect(page).toHaveURL(/\/es/);
    await expect(page.getByRole('button', { name: 'Chatea con nosotros' })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Chat with us' })).toHaveCount(0);
    await expect(page.locator(`iframe[src^="${PLATFORM}/c/"]`)).toHaveCount(1);
    expect(new URL((await frameSrc(page))!).searchParams.get('locale')).toBe('es');
  });

  test('a theme toggle hands the chat the new theme, still with one bubble', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('button', { name: 'Chat with us' })).toBeVisible();
    await page.getByRole('button', { name: 'Toggle theme' }).first().click();
    await expect.poll(async () => new URL((await frameSrc(page))!).searchParams.get('theme')).toBe('dark');
    await expect(page.locator(`iframe[src^="${PLATFORM}/c/"]`)).toHaveCount(1);
  });
});

test.describe('phone', () => {
  test.skip(!enabled, 'assistant disabled');
  test.use({ viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true });

  test('no tab pill in the hero ever sits under the launcher, at any scroll position', async ({ page }) => {
    await page.goto('/es');
    await expect(page.locator('.stage-tab').first()).toBeVisible();
    const launcherEl = page.getByRole('button', { name: 'Chatea con nosotros' });
    await expect(launcherEl).toBeVisible();
    const launcher = await launcherEl.boundingBox();
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

  test('the open chat is a full-screen sheet', async ({ page }) => {
    await page.goto('/es');
    await page.getByRole('button', { name: 'Chatea con nosotros' }).click();
    const panel = page.locator(`iframe[src^="${PLATFORM}/c/"]`).locator('xpath=..');
    await expect(panel).toBeVisible();
    expect(await panel.boundingBox()).toEqual({ x: 0, y: 0, width: 360, height: 640 });
  });
});
