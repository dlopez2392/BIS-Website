import { test, expect } from '@playwright/test';

test('industries shows five sectors in EN', async ({ page }) => {
  await page.goto('/en/industries');
  for (const label of ['Legal', 'Medical & Dental', 'Logistics & Freight', 'Skilled Trades', 'Agriculture']) {
    // In the page body: the footer has a "Legal" heading of its own.
    await expect(page.getByRole('main').getByText(label, { exact: true })).toBeVisible();
  }
});

// Three namespaces each have a `sofiaHeading` key: industries.shared, contact
// and trust. A copy edit keyed on the bare name once rewrote the industry
// pages' heading with the contact page's "Questions first?", in both
// languages, in production. Each page is pinned to its own words here.
test('the industry and contact pages each keep their own Sofía heading', async ({ page }) => {
  await page.goto('/en/industries/medical');
  await expect(page.getByRole('heading', { name: 'How Sofía handles your calls' })).toBeVisible();
  await page.goto('/es/industries/medical');
  await expect(page.getByRole('heading', { name: 'Cómo atiende Sofía tus llamadas' })).toBeVisible();
  await page.goto('/en/contact');
  await expect(page.getByRole('heading', { name: 'Questions first?' })).toBeVisible();
  await page.goto('/es/contact');
  await expect(page.getByRole('heading', { name: '¿Tienes preguntas primero?' })).toBeVisible();
});

// Each industry shows what lands on the owner's desk, as real text, and says
// it is a sample. Legal and medical pinned by content, both languages.
test('every industry page shows its desk example, marked as a sample', async ({ page }) => {
  for (const id of ['legal', 'medical', 'logistics', 'trades', 'agriculture']) {
    await page.goto(`/en/industries/${id}`);
    const example = page.locator('[data-industry-artifact]');
    await expect(example).toHaveCount(1);
    await expect(example).toContainText('Sample: invented names');
  }
  await page.goto('/en/industries/legal');
  await expect(page.locator('[data-industry-artifact]')).toContainText('No legal advice given');
  await page.goto('/es/industries/medical');
  const thread = page.locator('[data-industry-artifact] ol li');
  await expect(thread).toHaveCount(3);
  await expect(thread.nth(1)).toHaveText('1');
  await expect(thread.nth(0)).toHaveAttribute('lang', 'es');
});
