import { test, expect } from '@playwright/test';

/**
 * The product stage in the hero, in a real browser. The unit suite proves the
 * timer's logic against stubs; this proves the things stubs cannot — that the
 * three deferred frames really arrive after load, that a click from script
 * (what voice control and some assistive tech produce, with no pointer
 * events) stops the rotation, and that the pause control is a control.
 */
test('the stage mounts all four frames after load, lights exactly one, and names them in Spanish on /es', async ({ page }) => {
  await page.goto('/es');
  const frames = page.locator('.stage-screens img');
  await expect(frames).toHaveCount(4);
  await expect(page.locator('.stage-screens img.is-on')).toHaveCount(1);
  // /es opens on the one capture that is in Spanish.
  await expect(page.locator('.stage-screens img.is-on')).toHaveAttribute('alt', /español|Sofía/i);
  for (const label of ['Panel', 'Llamadas', 'Oportunidades', 'Una llamada en español', 'Pausar']) {
    await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
  }
  await expect(page.locator('.stage-note')).toHaveText('Cuenta de ejemplo — empresa y datos inventados.');
});

test('a scripted click holds the chosen screen through two full dwells', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('.stage-screens img')).toHaveCount(4);
  // `evaluate` + `.click()` dispatches a bare click: no pointerenter, no
  // focus. The first version only stopped because those fired first.
  await page.getByRole('button', { name: 'Opportunities', exact: true }).evaluate((el) => (el as HTMLElement).click());
  const lit = page.locator('.stage-screens img.is-on');
  await expect(lit).toHaveAttribute('alt', /opportunit/i);
  await expect(page.getByRole('button', { name: 'Opportunities', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(8000);
  await expect(lit).toHaveAttribute('alt', /opportunit/i);
});

test('pause stops the rotation and play resumes it', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('.stage-screens img')).toHaveCount(4);
  const pause = page.getByRole('button', { name: 'Pause', exact: true });
  await pause.evaluate((el) => (el as HTMLElement).click());
  const play = page.getByRole('button', { name: 'Play', exact: true });
  await expect(play).toHaveAttribute('aria-pressed', 'true');
  const before = await page.locator('.stage-screens img.is-on').getAttribute('alt');
  await page.waitForTimeout(4500);
  expect(await page.locator('.stage-screens img.is-on').getAttribute('alt')).toBe(before);
  await play.evaluate((el) => (el as HTMLElement).click());
  // Resumed: within one dwell plus the fade the lit frame has moved on.
  await expect
    .poll(async () => page.locator('.stage-screens img.is-on').getAttribute('alt'), { timeout: 6000 })
    .not.toBe(before);
});
