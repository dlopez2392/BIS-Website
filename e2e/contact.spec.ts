import { test, expect } from '@playwright/test';

test('contact form shows validation errors on empty submit', async ({ page }) => {
  await page.goto('/en/contact');
  await page.getByRole('button', { name: /Book my free assessment/i }).click();
  await expect(page.getByText('This field is required').first()).toBeVisible();
});
