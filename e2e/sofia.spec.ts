import { test, expect } from '@playwright/test';

/**
 * Sofía is the one thing on this site a stranger can verify in thirty seconds,
 * so every page that argues for her offers her. These specs exist because that
 * is easy to lose silently: the panel is a client component dropped into six
 * server-rendered pages, and nothing else fails if one of them stops rendering
 * it.
 *
 * Deliberately NOT tested here: starting a session. That spends OpenAI
 * Realtime minutes and needs a microphone, so the button's presence is the
 * contract these specs hold. `src/lib/sofia/session.test.ts` covers the state
 * machine behind it.
 */
const PLACEMENTS = [
  { path: '/services', label: 'services' },
  { path: '/work', label: 'work' },
  { path: '/contact', label: 'contact' },
  { path: '/industries/trades', label: 'industry' },
  { path: '/trust', label: 'trust' },
  { path: '', label: 'home' },
] as const;

const START = { en: 'Start talking', es: 'Empezar a hablar' } as const;

for (const locale of ['en', 'es'] as const) {
  for (const { path, label } of PLACEMENTS) {
    test(`offers Sofía on ${label} (${locale})`, async ({ page }) => {
      await page.goto(`/${locale}${path}`);
      await expect(page.getByRole('button', { name: START[locale] })).toBeVisible();
    });
  }
}

test('every panel states the limits before anyone presses the button', async ({ page }) => {
  await page.goto('/en/services');
  // The standing promise — no recording, no booking, ~3 minutes — has to be
  // readable without starting a session, not disclosed afterwards.
  await expect(page.getByText(/Nothing is recorded/i).first()).toBeVisible();
});

test('the limits line names no page-specific destination', async ({ page }) => {
  // It is shared copy on six different pages. "the scheduler on this page" was
  // true on /contact and false on the other five.
  await page.goto('/en/industries/trades');
  const limits = page.getByText(/Nothing is recorded/i).first();
  await expect(limits).toBeVisible();
  await expect(limits).not.toContainText(/on this page/i);
});

test('each page gives the panel its own argument, not one borrowed copy', async ({ page }) => {
  await page.goto('/en/contact');
  await expect(page.getByRole('heading', { name: /Ask Sofía instead of filling anything in/i })).toBeVisible();
  await page.goto('/en/industries/legal');
  await expect(page.getByRole('heading', { name: /Hear her do it/i })).toBeVisible();
});
