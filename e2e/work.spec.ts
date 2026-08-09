import { test, expect } from '@playwright/test';

const TEL = 'tel:+19567055146';

test('work page renders the Sofía case study (EN)', async ({ page }) => {
  await page.goto('/en/work');
  await expect(page.getByRole('heading', { level: 1, name: /Our Work/i })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /Sof[ií]a, our AI receptionist/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /What she does/i })).toBeVisible();
  await expect(page.getByText(/transcript, a summary, and a lead/i)).toBeVisible();
});

test('work page renders localized copy (ES)', async ({ page }) => {
  await page.goto('/es/work');
  await expect(page.getByRole('heading', { level: 1, name: /Nuestro Trabajo/i })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /Sof[ií]a, nuestra recepcionista de IA/i })).toBeVisible();
  await expect(page.getByText(/Pru[eé]balo t[uú] mismo/i)).toBeVisible();
});

test('the try-it CTA dials the real published number in both locales', async ({ page }) => {
  for (const locale of ['en', 'es']) {
    await page.goto(`/${locale}/work`);
    const cta = page.locator('main').locator(`a[href="${TEL}"]`);
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('(956) 705-5146');
  }
});

test('the page discloses that calls are transcribed and links to the privacy policy', async ({ page }) => {
  await page.goto('/en/work');
  await expect(page.getByText(/Calls are transcribed and summarized/i)).toBeVisible();
  await expect(page.locator('main').getByRole('link', { name: /How we handle your information/i })).toHaveAttribute(
    'href',
    '/en/privacy'
  );
});

test('footer links to the work page', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('footer').getByRole('link', { name: /Our Work/i })).toHaveAttribute('href', '/en/work');
});
