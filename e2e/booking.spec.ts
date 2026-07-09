import { test, expect } from '@playwright/test';

test('contact page shows the booking section and fallback link', async ({ page }) => {
  await page.goto('/en/contact');
  await expect(page.getByRole('heading', { name: /Prefer to talk\? Book a call/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open the booking page/i })).toHaveAttribute(
    'href', /cal\.com\//
  );
});
