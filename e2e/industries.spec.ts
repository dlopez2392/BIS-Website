import { test, expect } from '@playwright/test';

test('industries shows five sectors in EN', async ({ page }) => {
  await page.goto('/en/industries');
  for (const label of ['Legal', 'Medical & Dental', 'Logistics & Freight', 'Skilled Trades', 'Agriculture']) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
});
