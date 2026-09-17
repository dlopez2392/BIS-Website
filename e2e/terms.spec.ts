import { test, expect } from '@playwright/test';

/**
 * The terms page exists because A2P 10DLC campaign vetting requires one
 * alongside the privacy policy, and reads its text-message section for a
 * fixed set of disclosures. A page that renders but has quietly lost one of
 * them is worth catching here: a rejected campaign costs the vetting fee
 * again and days of carrier turnaround, and the failure is invisible from
 * our side until the rejection arrives.
 *
 * Asserted by DISCLOSURE, not by counting list items — a count passes while
 * the wrong eight are on the page.
 */
test('terms page renders and carries every SMS disclosure vetting looks for (EN)', async ({ page }) => {
  await page.goto('/en/terms');
  await expect(page.getByRole('heading', { level: 1, name: /Terms & Conditions/i })).toBeVisible();

  const sms = page.getByRole('heading', { name: /^Text messages$/i });
  await expect(sms).toBeVisible();

  const main = page.getByRole('main');
  // The sending number identifies the brand behind the campaign.
  await expect(main).toContainText('(956) 506-1545');
  // Opt-in is explicit and optional — the two things TCR rejects campaigns for
  // getting wrong (implied consent, or a required checkbox).
  await expect(main).toContainText(/optional and off by default/i);
  await expect(main).toContainText(/never buy, rent or import a phone number/i);
  await expect(main).toContainText(/message frequency varies/i);
  await expect(main).toContainText(/Message and data rates/i);
  await expect(main).toContainText(/reply STOP to any message/i);
  await expect(main).toContainText(/reply HELP/i);
  await expect(main).toContainText(/carriers are not liable/i);
});

test('terms page renders in Spanish', async ({ page }) => {
  await page.goto('/es/terms');
  await expect(page.getByRole('heading', { level: 1, name: /Términos y Condiciones/i })).toBeVisible();
  await expect(page.getByRole('main')).toContainText(/responde STOP/i);
});

test('the terms page links to the privacy policy, and the footer links to both', async ({ page }) => {
  // Vetting wants both documents reachable as real links from the site, not
  // pop-ups — and reachable from each other, since the SMS terms and the SMS
  // privacy clause are two halves of one answer.
  await page.goto('/en/terms');
  await expect(page.getByRole('main').getByRole('link', { name: /privacy policy/i }))
    .toHaveAttribute('href', /\/en\/privacy$/);

  await page.goto('/en');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: /Terms & Conditions/i })).toBeVisible();
  await expect(footer.getByRole('link', { name: /Privacy Policy/i })).toBeVisible();
});
