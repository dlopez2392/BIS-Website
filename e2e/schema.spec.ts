import { test, expect } from '@playwright/test';

/** Every JSON-LD block on the page, parsed. */
async function schemas(page: import('@playwright/test').Page) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((b) => JSON.parse(b));
}

test('the business entity is emitted sitewide under one @id', async ({ page }) => {
  await page.goto('/en/work');
  const business = (await schemas(page)).find((s) => s['@type'] === 'ProfessionalService');
  expect(business).toBeTruthy();
  expect(business['@id']).toBe('https://bis-rgv.com/#business');
  expect(business.telephone).toBe('+1-956-705-5146');
  expect(business.hasOfferCatalog.itemListElement.length).toBeGreaterThan(0);
  expect(business.areaServed[0]['@type']).toBe('Place');
});

test('the business entity is described in the language of the page', async ({ page }) => {
  await page.goto('/es');
  const es = (await schemas(page)).find((s) => s['@type'] === 'ProfessionalService');
  expect(es.inLanguage).toBe('es');
  // The ES page carried an English description until the schema took props.
  expect(es.description).not.toContain('Enterprise-grade');
});

test('an insights post emits BlogPosting and BreadcrumbList', async ({ page }) => {
  await page.goto('/en/insights/we-answer-our-own-phone');
  const found = await schemas(page);
  const article = found.find((s) => s['@type'] === 'BlogPosting');
  expect(article).toBeTruthy();
  expect(article.mainEntityOfPage).toBe('https://bis-rgv.com/en/insights/we-answer-our-own-phone');
  expect(article.publisher['@id']).toBe('https://bis-rgv.com/#business');
  expect(article.datePublished).toBe('2026-08-09');

  const crumbs = found.find((s) => s['@type'] === 'BreadcrumbList');
  expect(crumbs.itemListElement.map((i: { position: number }) => i.position)).toEqual([1, 2, 3]);
  expect(crumbs.itemListElement[2].item).toBe('https://bis-rgv.com/en/insights/we-answer-our-own-phone');
});

test('a resource detail page emits a breadcrumb trail', async ({ page }) => {
  await page.goto('/es/resources/ai-readiness-checklist');
  const crumbs = (await schemas(page)).find((s) => s['@type'] === 'BreadcrumbList');
  expect(crumbs.itemListElement).toHaveLength(3);
  expect(crumbs.itemListElement[1].item).toBe('https://bis-rgv.com/es/resources');
});

test('the proof page is reachable from the main nav in both locales', async ({ page }) => {
  for (const [locale, label] of [['en', 'Our Work'], ['es', 'Nuestro Trabajo']]) {
    await page.goto(`/${locale}`);
    await expect(page.locator('header').getByRole('link', { name: label })).toHaveAttribute(
      'href',
      `/${locale}/work`
    );
  }
});
