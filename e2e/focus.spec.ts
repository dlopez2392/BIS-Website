import { test, expect } from '@playwright/test';

/**
 * The home page leads with the five things BIS does. These pin the promises
 * that make that honest rather than the layout: each area can be opened from
 * the hero, the examples say what they are, and a concept is never presented
 * as delivered work.
 */

test('the hero names the five areas in one line, and each has its own row below', async ({ page }) => {
  await page.goto('/en');
  // One sentence, not a list of links: the tabs beside it are the five areas.
  await expect(page.locator('#hero .hm-lede')).toHaveText(
    'AI, IT, apps, websites and security, from one bilingual team in the Valley.');
  await expect(page.locator('.hm-rows > article h3')).toHaveText(
    ['AI Solutions', 'IT Consulting', 'Application Development', 'Websites', 'Cybersecurity']);
  for (const id of ['ai', 'it', 'apps', 'web', 'security']) {
    await expect(page.locator(`article#focus-${id}`)).toHaveCount(1);
  }
});

test('the hero panel opens on the live call and switches to a still example per area', async ({ page }) => {
  await page.goto('/en');
  const tabs = page.getByRole('tablist', { name: 'See an example of each' });
  await expect(tabs.getByRole('tab')).toHaveCount(5);
  await expect(tabs.getByRole('tab', { name: 'AI' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#hero [data-live-call]')).toBeVisible();

  await tabs.getByRole('tab', { name: 'Security' }).click();
  const panel = page.getByRole('tabpanel');
  await expect(page.locator('#hero [data-live-call]')).toHaveCount(0);
  await expect(panel).toContainText('Security review');
  // A still panel is an example, and says so twice.
  await expect(panel).toContainText('Example');
  await expect(panel).toContainText('not a client’s words');
  await expect(panel.getByRole('link', { name: 'Check your site' })).toHaveAttribute('href', '/en/tools/security-check');

  // Arrow keys move between tabs, as a tablist should.
  await tabs.getByRole('tab', { name: 'Security' }).press('ArrowLeft');
  await expect(tabs.getByRole('tab', { name: 'Web' })).toHaveAttribute('aria-selected', 'true');
  await expect(panel).toContainText('Website build');
});

test('every example says whether it is live, a demo or a concept, and the filter narrows them', async ({ page }) => {
  await page.goto('/en');
  const cards = page.locator('[data-work-examples] > li');
  await expect(cards).toHaveCount(11);
  for (const card of await cards.all()) {
    await expect(card.locator('.hm-stat')).toHaveText(/^(Live|Demo|Concept)$/);
    expect((await card.locator('img').getAttribute('alt'))?.length ?? 0).toBeGreaterThan(20);
  }
  // A concept is drawn, not delivered: its card says so and leads to a conversation.
  const concept = page.locator('[data-example="conceptIt"]');
  await expect(concept).toHaveAttribute('data-status', 'concept');
  await expect(concept.getByRole('link')).toHaveAttribute('href', '/en/contact');
  // A site we built opens in a new tab.
  const live = page.locator('[data-example="woodworks"]').getByRole('link');
  await expect(live).toHaveAttribute('href', 'https://956woodworks.com');
  await expect(live).toHaveAttribute('target', '_blank');

  await page.getByRole('group', { name: 'Show work by area' }).getByRole('button', { name: 'Cybersecurity' }).click();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Free security check');
});

test('the Spanish page carries the same five areas, in usted', async ({ page }) => {
  await page.goto('/es');
  await expect(page.locator('.hm-rows > article h3')).toHaveText(
    ['Soluciones de IA', 'Consultoría de TI', 'Desarrollo de aplicaciones', 'Sitios web', 'Ciberseguridad']);
  await page.getByRole('tab', { name: 'TI', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Pasan a su nombre');
  await expect(page.locator('[data-work-examples] > li')).toHaveCount(11);
});
