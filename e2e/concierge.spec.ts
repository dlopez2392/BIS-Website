import { test, expect, type Page } from '@playwright/test';

/**
 * The website assistant: the site's own "Ask BIS" launcher around the BIS
 * Platform's concierge chat page. These specs drive the live platform frame,
 * so they are skipped when the assistant is switched off.
 *
 * What they pin is the part this site owns: one launcher, the page language
 * and theme handed to the frame, that a language switch or a theme toggle
 * swaps the frame rather than stacking a second one, that the CSP lets the
 * frame load, and the phone geometry. The conversation itself is the
 * platform's, and is tested there.
 */
const enabled = process.env.NEXT_PUBLIC_AI_ENABLED === 'true';
const PLATFORM = (process.env.NEXT_PUBLIC_BIS_PLATFORM_ORIGIN ?? 'https://app.bis-rgv.com').replace(/\/+$/, '');
const ASK = { en: 'Ask BIS', es: 'Pregúntale a BIS' } as const;

function cspViolations(page: Page): string[] {
  const seen: string[] = [];
  page.on('console', (m) => { if (/Content Security Policy/i.test(m.text())) seen.push(m.text()); });
  return seen;
}

const frames = (page: Page) => page.locator(`iframe[src^="${PLATFORM}/c/"]`);
const frameSrc = (page: Page) => frames(page).getAttribute('src');
const launcher = (page: Page, locale: 'en' | 'es' = 'en') =>
  page.locator('.ask-launch').filter({ hasText: ASK[locale] });

test.describe('desktop', () => {
  test.skip(!enabled, 'assistant disabled');

  test('mounts one launcher, preloads the chat in the page language and theme, under the CSP', async ({ page }) => {
    const violations = cspViolations(page);
    await page.goto('/en');
    await expect(launcher(page)).toBeVisible();
    await expect(page.locator('.ask-launch')).toHaveCount(1);
    await expect(frames(page)).toHaveCount(1);
    const src = new URL((await frameSrc(page))!);
    expect(src.searchParams.get('locale')).toBe('en');
    expect(src.searchParams.get('theme')).toBe('dark');
    expect(src.searchParams.get('page')).toContain('/en');
    expect(violations).toEqual([]);
  });

  test('opens on the chat, Talk holds Sofía, and Esc closes', async ({ page }) => {
    await page.goto('/en');
    await launcher(page).click();
    await expect(page.locator('.ask-launch')).toHaveAttribute('aria-expanded', 'true');
    const panel = page.getByRole('dialog', { name: 'Ask BIS' });
    await expect(panel).toBeVisible();
    await expect(page.frameLocator(`iframe[src^="${PLATFORM}/c/"]`).locator('#bis-concierge-input')).toBeVisible();
    await panel.getByRole('tab', { name: 'Talk' }).click();
    await expect(panel.getByRole('button', { name: 'Start talking' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(page.locator('.ask-launch')).toHaveAttribute('aria-expanded', 'false');
  });

  test('the chat page\'s own × closes the panel', async ({ page }) => {
    await page.goto('/en');
    await launcher(page).click();
    const chat = page.frameLocator(`iframe[src^="${PLATFORM}/c/"]`);
    await chat.locator('.bis-concierge-close').click();
    await expect(page.getByRole('dialog', { name: 'Ask BIS' })).toBeHidden();
  });

  test('a language switch swaps the chat for a Spanish one instead of stacking a second', async ({ page }) => {
    await page.goto('/en');
    await expect(launcher(page)).toBeVisible();
    await page.getByRole('link', { name: 'ES', exact: true }).first().click();
    await expect(page).toHaveURL(/\/es/);
    await expect(launcher(page, 'es')).toHaveCount(1);
    await expect(frames(page)).toHaveCount(1);
    expect(new URL((await frameSrc(page))!).searchParams.get('locale')).toBe('es');
  });

  test('a theme toggle hands the chat the new theme, still one frame', async ({ page }) => {
    await page.goto('/en');
    await expect(launcher(page)).toBeVisible();
    const toggle = page.getByRole('button', { name: 'Toggle theme' }).first();
    await expect(toggle.locator('svg.lucide-sun')).toBeVisible(); // hydrated
    await toggle.click();
    await expect.poll(async () => new URL((await frameSrc(page))!).searchParams.get('theme')).toBe('light');
    await expect(frames(page)).toHaveCount(1);
  });
});

test.describe('phone', () => {
  test.skip(!enabled, 'assistant disabled');
  test.use({ viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true });

  test('over the hero the launcher shrinks to its orb, clear of both hero buttons', async ({ page }) => {
    await page.goto('/es');
    const button = page.locator('.ask-launch');
    await expect(button).toHaveAttribute('data-compact', 'true');
    const l = (await button.boundingBox())!;
    for (const name of ['Reserva una evaluación gratuita', 'Habla con Sofía']) {
      const b = (await page.locator('#hero').getByRole('link', { name }).boundingBox())!;
      const overlaps = b.x < l.x + l.width && b.x + b.width > l.x && b.y < l.y + l.height && b.y + b.height > l.y;
      expect(overlaps, name).toBe(false);
    }
  });

  test('the open panel is a full-screen sheet', async ({ page }) => {
    await page.goto('/es');
    await page.locator('.ask-launch').click();
    const panel = page.getByRole('dialog', { name: 'Pregúntale a BIS' });
    await expect(panel).toBeVisible();
    // Polled: the panel eases in, and a box read mid-animation is scaled.
    await expect.poll(() => panel.boundingBox()).toEqual({ x: 0, y: 0, width: 360, height: 640 });
  });
});
