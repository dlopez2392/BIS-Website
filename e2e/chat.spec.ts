import { test, expect } from '@playwright/test';

test('chat launcher appears only when enabled', async ({ page }) => {
  await page.goto('/en');
  const launcher = page.getByRole('button', { name: /Chat with us/i });
  if (process.env.NEXT_PUBLIC_AI_ENABLED === 'true') {
    await expect(launcher).toBeVisible();
    await launcher.click();
    // exact: true is required — getByText does case-insensitive substring
    // matching, and the greeting ("Hi! I'm the BIS assistant...") also matches,
    // which trips strict mode with two hits.
    await expect(page.getByText('BIS Assistant', { exact: true })).toBeVisible();
  } else {
    await expect(launcher).toHaveCount(0);
  }
});
