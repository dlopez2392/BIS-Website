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
