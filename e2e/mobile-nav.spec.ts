import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 720 } });

test('mobile nav reveals all links behind a hamburger toggle', async ({ page }) => {
  await page.goto('/en');
  // The header's links, not the footer's: the footer lists Industries and
  // About too, visible on every width, and is not what the toggle is about.
  const header = page.getByRole('banner');

  await expect(header.getByRole('link', { name: 'Industries', exact: true })).toBeHidden();

  const toggle = page.getByRole('button', { name: 'Open menu', exact: true });
  await expect(toggle).toBeVisible();

  await toggle.click();

  const industriesLink = header.getByRole('link', { name: 'Industries', exact: true });
  const aboutLink = header.getByRole('link', { name: 'About', exact: true });
  await expect(industriesLink).toBeVisible();
  await expect(aboutLink).toBeVisible();

  await industriesLink.click();
  await expect(page).toHaveURL(/\/en\/industries$/);
});
