import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 720 } });

test('mobile nav reveals all links behind a hamburger toggle', async ({ page }) => {
  await page.goto('/en');

  await expect(page.getByRole('link', { name: 'Industries', exact: true })).toBeHidden();

  const toggle = page.getByRole('button', { name: 'Open menu', exact: true });
  await expect(toggle).toBeVisible();

  await toggle.click();

  const industriesLink = page.getByRole('link', { name: 'Industries', exact: true });
  const aboutLink = page.getByRole('link', { name: 'About', exact: true });
  await expect(industriesLink).toBeVisible();
  await expect(aboutLink).toBeVisible();

  await industriesLink.click();
  await expect(page).toHaveURL(/\/en\/industries$/);
});
