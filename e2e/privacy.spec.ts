import { test, expect } from '@playwright/test';

test('privacy page renders heading + a known section (EN)', async ({ page }) => {
  await page.goto('/en/privacy');
  await expect(page.getByRole('heading', { level: 1, name: /Privacy Policy/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Who processes your data/i })).toBeVisible();
});

test('privacy page renders localized heading (ES)', async ({ page }) => {
  await page.goto('/es/privacy');
  await expect(page.getByRole('heading', { level: 1, name: /Política de Privacidad/i })).toBeVisible();
});

test('footer links to the privacy policy', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('link', { name: /Privacy Policy/i })).toBeVisible();
});

/**
 * The CTIA clause, asserted close to verbatim.
 *
 * This is the sentence A2P 10DLC vetting scans a privacy policy for, and the
 * policy's own "we do not sell your information" does NOT satisfy it — that
 * one is about selling, and the carriers are asking about sharing. It is
 * pinned here rather than left to review because losing it is silent: the
 * page still renders, still reads well, and the campaign is rejected weeks
 * later with the fee already spent.
 */
test('privacy page carries the CTIA mobile-information clause (EN)', async ({ page }) => {
  await page.goto('/en/privacy');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: /^Text messages$/i })).toBeVisible();
  await expect(main).toContainText(
    /Mobile information will not be shared with third parties or affiliates for marketing or promotional purposes/i,
  );
  await expect(main).toContainText(
    /opt-in data and consent will not be shared with any third parties/i,
  );
  // The opt-in has to read as optional here too, not just on the form.
  await expect(main).toContainText(/The box is optional/i);
});

test('the Spanish privacy policy carries the clause in both languages', async ({ page }) => {
  // The Spanish page keeps the English sentence in parentheses on purpose: a
  // reviewer reading the ES URL is scanning for the CTIA wording, and a
  // faithful translation of it is not the string they match on.
  await page.goto('/es/privacy');
  const main = page.getByRole('main');
  await expect(main).toContainText(/No compartiremos tu información móvil con terceros/i);
  await expect(main).toContainText(/Mobile information will not be shared with third parties/i);
});
