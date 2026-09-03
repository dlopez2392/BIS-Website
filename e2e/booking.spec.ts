import { test, expect } from '@playwright/test';

test('contact page frames the platform scheduler and links to it as a fallback', async ({ page }) => {
  await page.goto('/en/contact');
  await expect(page.getByRole('heading', { name: /Prefer to talk\? Book a call/i })).toBeVisible();
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
