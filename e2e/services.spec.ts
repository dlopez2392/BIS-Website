import { test, expect } from '@playwright/test';

test('services lists three groups in ES', async ({ page }) => {
  await page.goto('/es/services');
  await expect(page.getByRole('heading', { name: 'IA y Automatización' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Consultoría IT y Seguridad' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Diseño Web' })).toBeVisible();
});
