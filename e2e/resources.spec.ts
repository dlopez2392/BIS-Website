import { test, expect } from '@playwright/test';

test('resources library lists the checklist (EN)', async ({ page }) => {
  await page.goto('/en/resources');
  await expect(page.getByRole('heading', { level: 1, name: /Free Resources/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /AI Readiness Checklist/i })).toBeVisible();
});

test('resource detail shows the capture form (EN)', async ({ page }) => {
  await page.goto('/en/resources/ai-readiness-checklist');
  await expect(page.getByRole('heading', { level: 1, name: /AI Readiness Checklist/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Send it to me/i })).toBeVisible();
});

test('resource detail renders localized (ES)', async ({ page }) => {
  await page.goto('/es/resources/ai-readiness-checklist');
  await expect(page.getByRole('heading', { level: 1, name: /Lista de Preparación para IA/i })).toBeVisible();
});

test('library lists the cybersecurity guide and its detail page works (EN)', async ({ page }) => {
  await page.goto('/en/resources');
  await expect(page.getByRole('link', { name: /Cybersecurity Guide/i })).toBeVisible();
  await page.goto('/en/resources/cybersecurity-guide');
  await expect(page.getByRole('heading', { level: 1, name: /Cybersecurity Guide/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Send it to me/i })).toBeVisible();
});

test('cybersecurity guide detail renders localized (ES)', async ({ page }) => {
  await page.goto('/es/resources/cybersecurity-guide');
  await expect(page.getByRole('heading', { level: 1, name: /Guía de Ciberseguridad/i })).toBeVisible();
});
