import { test, expect } from '@playwright/test';

test('contact form validates then shows success', async ({ page }) => {
  await page.goto('/en/contact');
  await page.getByRole('button', { name: /Book my free assessment/i }).click();
  await expect(page.getByText('This field is required').first()).toBeVisible();

  await page.getByLabel('Full Name').fill('Ana Reyes');
  await page.getByLabel('Business Name').fill('Reyes Law');
  await page.getByLabel('Email Address').fill('ana@reyeslaw.com');
  await page.getByLabel('Phone Number').fill('956-555-0100');
  await page.getByRole('button', { name: /Book my free assessment/i }).click();
  await expect(page.getByRole('status')).toBeVisible();
});
