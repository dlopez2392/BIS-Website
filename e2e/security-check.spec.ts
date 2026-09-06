/**
 * The checker end to end against a real domain, which is the only way to know
 * the probe layer works: everything below the page is unit-tested against
 * fixtures, and a network is not a fixture.
 */
import { test, expect } from '@playwright/test';

test('runs a live scan with the new checks and offers the report', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 1400 });
  await page.goto('/en/tools/security-check');
  await page.getByLabel(/your web address/i).fill('bis-rgv.com');
  await page.getByRole('button', { name: /check my site/i }).click();
  await expect(page.getByRole('heading', { name: /Results for bis-rgv\.com/i })).toBeVisible({ timeout: 40_000 });

  // The three new checks appear in the full list.
  for (const title of [/certificate is not about to expire/i, /secure pages load only secure files/i, /Your email is signed/i]) {
    await expect(page.getByText(title).first()).toBeVisible();
  }
  // And the capture form is there.
  await expect(page.getByRole('heading', { name: /full report by email/i })).toBeVisible();
  await page.screenshot({ path: process.env.SHOT_DIR + '/report-form.png', fullPage: true });
});

test('a bad address is refused without sending anything', async ({ page }) => {
  await page.goto('/en/tools/security-check');
  await page.getByLabel(/your web address/i).fill('bis-rgv.com');
  await page.getByRole('button', { name: /check my site/i }).click();
  await expect(page.getByRole('heading', { name: /Results for/i })).toBeVisible({ timeout: 40_000 });
  await page.getByLabel(/Where to send it/i).fill('not-an-email');
  await page.getByRole('button', { name: /Email me the report/i }).click();
  // Next renders its own empty role="alert" announcer, so target the form's.
  await expect(page.getByTestId('report-error')).toContainText(/Check the email address/i, { timeout: 15_000 });
});
