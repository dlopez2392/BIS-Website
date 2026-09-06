/**
 * The WhatsApp channel is configuration, not code, so this suite asserts both
 * halves: that nothing renders while NEXT_PUBLIC_WHATSAPP_NUMBER is unset, and
 * that the links are correct once it is. Each test skips itself in the run it
 * does not apply to, so CI (no number) proves the absence and a local run with
 * the variable set proves the presence.
 */
import { test, expect } from '@playwright/test';

const configured = !!process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

test('with no number configured, nothing WhatsApp-related renders anywhere', async ({ page }) => {
  test.skip(configured, 'this run has a number configured');
  for (const path of ['/en', '/en/contact', '/es/contact']) {
    await page.goto(path);
    expect(await page.locator('a[href*="wa.me"]').count(), path).toBe(0);
  }
});

test('with a number configured, it links correctly and prefills the page', async ({ page }) => {
  test.skip(!configured, 'this run has no number configured');
  await page.goto('/en/contact');
  const link = page.locator('a[href*="wa.me"]').first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute('href');
  console.log('WA HREF:', href);
  const url = new URL(href!);
  expect(url.origin + url.pathname).toBe('https://wa.me/19565061545');
  expect(url.searchParams.get('text')).toContain('/en/contact');
  await expect(link).toHaveAttribute('rel', /noopener/);
  await expect(link).toHaveAttribute('target', '_blank');

  await page.goto('/es/contact');
  const es = await page.locator('a[href*="wa.me"]').first().getAttribute('href');
  expect(new URL(es!).searchParams.get('text')).toContain('Hola BIS');
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.screenshot({ path: process.env.SHOT_DIR + '/whatsapp-contact.png' });
});
