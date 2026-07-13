import { test, expect } from '@playwright/test';

test('resources library lists the checklist (EN)', async ({ page }) => {
  await page.goto('/en/resources');
  await expect(page.getByRole('heading', { level: 1, name: /Free Resources/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /AI Readiness Checklist/i })).toBeVisible();
});

test('resource detail shows the capture form (EN)', async ({ page }) => {
  await page.goto('/en/resources/ai-readiness-checklist');
  await expect(page.getByRole('heading', { level: 1, name: /AI Readiness Checklist/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Send me the checklist/i })).toBeVisible();
});

test('resource detail renders localized (ES)', async ({ page }) => {
  await page.goto('/es/resources/ai-readiness-checklist');
  await expect(page.getByRole('heading', { level: 1, name: /Lista de Preparación para IA/i })).toBeVisible();
});
