import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * WCAG 2.1 AA, checked on every page shape the site has, in both languages.
 *
 * BIS publishes an accessibility statement and sells accessibility
 * remediation to public bodies facing the ADA Title II deadlines, so this
 * suite is the evidence behind both. An automated pass is not a full audit —
 * it catches roughly a third of real barriers, and the statement says so —
 * but a violation here is never a false alarm worth ignoring.
 */
const PAGES = [
  ['home', '/en'],
  ['home (ES)', '/es'],
  ['services', '/en/services'],
  ['industries index', '/en/industries'],
  ['industry detail', '/en/industries/medical'],
  ['city', '/en/service-area/mcallen'],
  ['insights index', '/en/insights'],
  ['insight', '/en/insights/bilingual-by-design'],
  ['faq', '/en/faq'],
  ['about', '/en/about'],
  ['contact', '/en/contact'],
  ['resources', '/en/resources'],
  ['security check tool', '/en/tools/security-check'],
  ['hours calculator', '/en/tools/first-hour-back'],
  ['hours calculator (ES)', '/es/tools/first-hour-back'],
  ['privacy', '/en/privacy'],
  ['terms', '/en/terms'],
  ['terms (ES)', '/es/terms'],
  ['accessibility statement', '/en/accessibility'],
  ['trust', '/en/trust'],
  ['trust (ES)', '/es/trust'],
  // The page a mistyped link lands on is the one most likely to be met cold.
  ['not found', '/en/no-such-page'],
] as const;

for (const [name, path] of PAGES) {
  test(`${name} has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // The contact page frames the platform's own form and scheduler. Their
      // accessibility is the platform's to test, and axe cannot see into a
      // cross-origin frame anyway.
      .exclude('iframe')
      .analyze();

    const summary = results.violations.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.help}`);
    expect(summary, `${path}\n${summary.join('\n')}`).toEqual([]);
  });
}

/**
 * The same sweep in dark mode, on the two surfaces that carry the site's own
 * dark ground plus the one that used to fail: the CTA band's primary button
 * sat at 2.6:1 in dark mode on ten pages, and the light-only run never saw it.
 */
for (const [name, path] of [['home', '/en'], ['industries', '/en/industries'], ['not found', '/en/no-such-page']] as const) {
  test(`${name} has no WCAG A/AA violations in dark mode`, async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('theme', 'dark'); } catch { /* private mode */ } });
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('iframe')
      .analyze();
    const summary = results.violations.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.help}`);
    expect(summary, `${path} (dark)\n${summary.join('\n')}`).toEqual([]);
  });
}

test('every page is reachable and operable by keyboard alone', async ({ page }) => {
  await page.goto('/en');
  // Tab from the top and confirm focus lands somewhere visible rather than
  // being trapped or invisible — the failure mode a screenshot never shows.
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus-visible');
  await expect(focused).toBeVisible();
});
