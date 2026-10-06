import { test, expect } from '@playwright/test';

test('contact page frames the platform scheduler and links to it as a fallback', async ({ page }) => {
  await page.goto('/en/contact');
  await expect(page.getByRole('heading', { name: /Or book a call/i })).toBeVisible();
  const frame = page.getByTitle('Book a free assessment');
  await expect(frame).toBeVisible();
  await expect(frame).toHaveAttribute('src', /\/b\/[a-z0-9]+\?locale=en&theme=(light|dark)/);
  await expect(page.getByRole('link', { name: /Open the booking page/i })).toHaveAttribute(
    'href', /\/b\/[a-z0-9]+\?locale=en$/
  );
});

test('the Spanish contact page asks the scheduler for Spanish', async ({ page }) => {
  await page.goto('/es/contact');
  await expect(page.getByTitle('Agenda una evaluación gratuita')).toHaveAttribute('src', /\/b\/[a-z0-9]+\?locale=es&/);
});

/**
 * Phase 2 of the redesign: every page that used to end on a "Book your
 * assessment" button to /contact now ends on the calendar itself. One iframe
 * per page (never two stacked) and no button left pointing at /contact to
 * find it.
 */
for (const path of [
  '/en', '/en/services', '/en/platform', '/en/industries', '/en/industries/trades', '/en/about',
  '/en/capabilities', '/en/how-we-work', '/en/service-area', '/en/service-area/mcallen', '/en/work',
]) {
  test(`${path} lets a visitor book on the page`, async ({ page }) => {
    await page.goto(path);
    const booking = page.locator('[data-cta-booking]');
    await expect(booking).toHaveCount(1);
    await booking.scrollIntoViewIfNeeded();
    await expect(booking.getByTitle('Book a free assessment')).toHaveAttribute('src', /\/b\/[a-z0-9]+\?locale=en&/);
    await expect(page.locator('main a[href="/en/contact"]', { hasText: /Book your assessment/i })).toHaveCount(0);
  });
}
