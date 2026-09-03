import { test, expect } from '@playwright/test';

// The form is the BIS Platform's, framed here — see src/lib/platform.ts. What
// this page owns is the frame's address (the right form for the language, the
// language and theme hints) and the way out if the frame cannot load.
test('contact page frames the platform form for the page language, with a fallback link', async ({ page }) => {
  await page.goto('/en/contact');
  const frame = page.getByTitle('Contact form');
  await expect(frame).toBeVisible();
  await expect(frame).toHaveAttribute('src', /\/f\/[a-z0-9]+\?locale=en&theme=(light|dark)/);
  await expect(page.getByRole('link', { name: /Open the form in a new tab/i })).toHaveAttribute(
    'href', /\/f\/[a-z0-9]+\?locale=en$/
  );
});

test('the Spanish contact page frames the Spanish form, not the English one', async ({ page }) => {
  await page.goto('/es/contact');
  const es = await page.getByTitle('Formulario de contacto').getAttribute('src');
  await page.goto('/en/contact');
  const en = await page.getByTitle('Contact form').getAttribute('src');
  expect(es).toMatch(/\?locale=es&/);
  // Two forms, one per language: the Spanish page must not frame the English one.
  expect(new URL(es!).pathname).not.toBe(new URL(en!).pathname);
});

test('the frame carries the host page url so the lead records where it came from', async ({ page }) => {
  await page.goto('/en/contact?utm_source=e2e&utm_campaign=frame');
  const src = await page.getByTitle('Contact form').getAttribute('src');
  const url = new URL(src!);
  expect(url.searchParams.get('utm_source')).toBe('e2e');
  expect(url.searchParams.get('utm_campaign')).toBe('frame');
  expect(url.searchParams.get('page')).toContain('/en/contact?utm_source=e2e');
});
