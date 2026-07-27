import { test, expect } from '@playwright/test';

const TEL = 'tel:+19567055146';

test('header exposes a tap-to-call link in both locales', async ({ page }) => {
  for (const locale of ['en', 'es']) {
    await page.goto(`/${locale}`);
    // Desktop link and the mobile icon button are both in the header; at the
    // default viewport the desktop one is the visible one.
    const header = page.locator('header');
    await expect(header.locator(`a[href="${TEL}"]`).first()).toBeVisible();
    await expect(header.getByText('(956) 705-5146').first()).toBeVisible();
  }
});

test('contact page offers calling alongside the form and the scheduler', async ({ page }) => {
  await page.goto('/en/contact');
  await expect(page.getByText('Want to talk now?')).toBeVisible();
  await expect(page.locator('main').locator(`a[href="${TEL}"]`)).toBeVisible();
  // The three paths coexist: call, write, book.
  await expect(page.getByRole('heading', { name: /Prefer to talk\? Book a call\./ })).toBeVisible();
});

test('contact page call block is localized', async ({ page }) => {
  await page.goto('/es/contact');
  await expect(page.getByText('¿Quieres hablar ahora?')).toBeVisible();
  await expect(page.locator('main').locator(`a[href="${TEL}"]`)).toBeVisible();
});

test('the placeholder number is gone from structured data', async ({ page }) => {
  await page.goto('/en');
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(ld).toContain('+1-956-705-5146');
  expect(ld).not.toContain('000-0000');
});
