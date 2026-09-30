import { test, expect } from '@playwright/test';

test('industries shows five sectors in EN', async ({ page }) => {
  await page.goto('/en/industries');
  for (const label of ['Legal', 'Medical & Dental', 'Logistics & Freight', 'Skilled Trades', 'Agriculture']) {
    // In the page body: the footer has a "Legal" heading of its own.
    await expect(page.getByRole('main').getByText(label, { exact: true })).toBeVisible();
  }
});
