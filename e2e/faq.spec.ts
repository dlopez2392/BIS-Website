import { test, expect } from '@playwright/test';

test('FAQ page renders heading + a known question (EN)', async ({ page }) => {
  await page.goto('/en/faq');
  await expect(page.getByRole('heading', { level: 1, name: /Frequently Asked Questions/i })).toBeVisible();
  await expect(page.getByText(/What does Bespoke Intelligent Solutions do\?/i)).toBeVisible();
});

test('FAQ page renders localized heading (ES)', async ({ page }) => {
  await page.goto('/es/faq');
  await expect(page.getByRole('heading', { level: 1, name: /Preguntas Frecuentes/i })).toBeVisible();
});

// The native disclosure marker is hidden, so without the chevron a question is
// indistinguishable from a plain heading. Counting against the summaries rather
// than a literal keeps this honest when questions are added.
test('every FAQ question carries a visible expand affordance', async ({ page }) => {
  await page.goto('/en/faq');
  const summaries = page.locator('details summary');
  const markers = page.locator('details summary svg');
  const count = await summaries.count();
  expect(count).toBeGreaterThan(0);
  expect(await markers.count()).toBe(count);
  await expect(markers.first()).toBeVisible();
});

test('a FAQ question opens its answer when clicked', async ({ page }) => {
  await page.goto('/en/faq');
  const first = page.locator('details').first();
  const answer = first.locator('p');
  await expect(answer).toBeHidden();
  await first.locator('summary').click();
  await expect(answer).toBeVisible();
});
