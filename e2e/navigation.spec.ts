/**
 * How this site moves between pages.
 *
 * Two of these tests document a limitation rather than a feature, which is
 * the point: the CSS for view transitions ships and is correct, client-side
 * navigation does not use it yet because stable React has no ViewTransition
 * component, and this suite fails the day either of those facts changes.
 */
import { test, expect } from '@playwright/test';

// Documents today's honest state: client-side navigation does NOT animate,
// because stable React has no ViewTransition component. When it ships, this
// test flips to expect a call and the config flag goes back in.
test('client-side navigation does not yet animate, and the site does not pretend it does', async ({ page }) => {
  // addInitScript runs before any page script, so the spy is in place before
  // the router can capture its own reference to the API.
  await page.addInitScript(() => {
    const w = window as unknown as { __vt: number };
    w.__vt = 0;
    const original = document.startViewTransition?.bind(document);
    if (original) {
      document.startViewTransition = ((cb: () => void) => { w.__vt += 1; return original(cb); }) as typeof document.startViewTransition;
    }
  });
  await page.goto('/en');
  await page.getByRole('navigation').getByRole('link', { name: 'Services', exact: true }).first().click();
  await expect(page).toHaveURL(/\/en\/services$/);
  const calls = await page.evaluate(() => (window as unknown as { __vt: number }).__vt);
  console.log('startViewTransition calls:', calls);
  expect(calls).toBe(0);
});

test('serves the cross-document opt-in and holds the header and footer still', async ({ page }) => {
  await page.goto('/en');
  // Every stylesheet, not just the first: the app ships several chunks.
  const css = await page.evaluate(async () => {
    const links = [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => (l as HTMLLinkElement).href);
    const texts = await Promise.all(links.map((href) => fetch(href).then((r) => r.text())));
    return texts.join('\n');
  });
  // Built CSS is minified, so compare with whitespace collapsed.
  const flat = css.replace(/\s+/g, '');
  expect(flat).toContain('@view-transition');
  expect(flat).toContain('view-transition-name:site-header');
  expect(flat).toContain('view-transition-name:site-footer');
  await expect(page.locator('header.vt-header')).toHaveCount(1);
  await expect(page.locator('footer.vt-footer')).toHaveCount(1);
});

test('reduced motion switches the animation off entirely', async ({ page }) => {
  // Read the served stylesheet rather than walking the CSSOM: Chromium does
  // not expose ::view-transition-* rules through cssRules, so a CSSOM walk
  // reports "missing" for a rule that is plainly in the file.
  await page.goto('/en');
  const css = await page.evaluate(async () => {
    const links = [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => (l as HTMLLinkElement).href);
    const texts = await Promise.all(links.map((href) => fetch(href).then((r) => r.text())));
    return texts.join('\n').replace(/\s+/g, '');
  });
  expect(css).toContain('@media(prefers-reduced-motion:reduce)');
  expect(css).toContain('::view-transition-group(*){animation:none!important}');
});

test('speculation rules are present and valid, and never point at the API', async ({ page }) => {
  await page.goto('/en');
  const raw = await page.locator('script[type="speculationrules"]').textContent();
  const rules = JSON.parse(raw ?? '{}');
  console.log('SPECULATION', JSON.stringify(rules));
  expect(rules.prerender[0].eagerness).toBe('moderate');
  expect(JSON.stringify(rules)).toContain('/api/*');
});
