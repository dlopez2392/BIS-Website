import { test, expect } from '@playwright/test';

/**
 * The home page: the headline and its twin, the live call, the annotated
 * product capture, and the close. The unit suite covers the call's data and
 * its finished render; these prove what only a browser can.
 */
test('home renders its headline in EN and ES, each with the other language\'s twin linking across', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { level: 1, name: 'The system your business runs on.' })).toBeVisible();
  const twin = page.locator('#hero a[data-twin]');
  await expect(twin).toHaveText('El sistema que mueve tu negocio.');
  await expect(twin).toHaveAttribute('lang', 'es');
  await twin.click();
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.getByRole('heading', { level: 1, name: 'El sistema que mueve tu negocio.' })).toBeVisible();
  await expect(page.locator('#hero a[data-twin]')).toHaveText('The system your business runs on.');
});

test('the hero offers one booking button and a way to Sofía, and says who answers the phone', async ({ page }) => {
  await page.goto('/en');
  const hero = page.locator('#hero');
  await expect(hero.getByRole('link', { name: 'Book a free assessment' })).toHaveAttribute('href', '/en/contact');
  await expect(hero.getByRole('link', { name: 'Talk to Sofía' })).toHaveAttribute('href', '#talk-to-sofia');
  await expect(hero).toContainText('Sofía is answering (956) 506-1545 right now');
});

test('the dark ground is the default, and a visitor\'s light choice sticks', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  const toggle = page.getByRole('button', { name: 'Toggle theme' }).first();
  await expect(toggle.locator('svg.lucide-sun')).toBeVisible(); // hydrated
  await toggle.click();
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  await page.reload();
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
});

test.describe('the live call', () => {
  test('under reduced motion it is simply finished: record filled, Monday moved', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/en');
    const call = page.locator('[data-live-call]');
    await expect(call).toContainText('Ended');
    await expect(call).toContainText('Booked · Thu 10–12');
    await expect(call).toContainText('4 more than the week before');
    await expect(call.locator('.hm-msg')).toHaveCount(4);
  });

  test('it plays when on screen, and EN replays the same call in English', async ({ page }) => {
    await page.goto('/en');
    const call = page.locator('[data-live-call]');
    await expect(call).toContainText('Live');
    await call.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(call.getByRole('button', { name: 'EN', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(call.locator('ol')).toHaveAttribute('lang', 'en');
    await expect(call).toContainText('this is Sofía', { timeout: 10_000 });
    await expect(call).toContainText('Ended', { timeout: 20_000 });
  });
});

test('each marker on the product capture explains itself, and Esc puts it away', async ({ page }) => {
  await page.goto('/en');
  const shot = page.locator('[data-hotspot-shot]');
  await shot.scrollIntoViewIfNeeded();
  const marker = shot.getByRole('button', { name: 'Explain point 2' });
  await marker.click();
  await expect(marker).toHaveAttribute('aria-expanded', 'true');
  const note = shot.locator('#hm-spot-note');
  await expect(note).toBeVisible();
  await expect(note).toContainText('After hours, still answered');
  await page.keyboard.press('Escape');
  await expect(note).toBeHidden();
  await expect(marker).toBeFocused();
});

test('the close lists the three newest insights, each resolving', async ({ page }) => {
  await page.goto('/en');
  // The list is the three NEWEST posts, so naming one pins the test to
  // publishing order. Assert the behaviour instead.
  const reads = page.locator('#close a[href^="/en/insights/"]');
  await expect(reads).toHaveCount(3);
  for (const href of await reads.evaluateAll((links) => links.map((l) => l.getAttribute('href')!))) {
    const res = await page.request.get(href, { maxRedirects: 0 });
    expect(res.status(), `${href} status`).toBe(200);
  }
  await expect(page.locator('#close').getByRole('link', { name: 'Get the free checklist' }))
    .toHaveAttribute('href', '/en/resources/ai-readiness-checklist');
});
