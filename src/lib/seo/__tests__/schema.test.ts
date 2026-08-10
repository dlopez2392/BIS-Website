import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  businessSchema,
  articleSchema,
  breadcrumbSchema,
  ogImageUrl,
  absoluteUrl,
  BUSINESS_ID,
  MAX_HEADLINE,
} from '../schema';
import { business, SITE_URL } from '../business';

const services = [
  { name: 'AI & Automation', description: 'AI that removes real hours from your week.' },
  { name: 'IT Consulting & Security', description: 'Keep the lights on and the doors locked.' },
];

describe('businessSchema', () => {
  const en = businessSchema({ locale: 'en', description: 'English description', services });
  const es = businessSchema({ locale: 'es', description: 'Descripción en español', services });

  it('is a ProfessionalService under one stable @id across locales', () => {
    expect(en['@type']).toBe('ProfessionalService');
    expect(en['@id']).toBe(BUSINESS_ID);
    expect(es['@id']).toBe(en['@id']);
  });

  it('describes the company in the language of the page', () => {
    // The schema shipped an English description on ES pages until it took props.
    expect(en.description).toBe('English description');
    expect(es.description).toBe('Descripción en español');
    expect(en.inLanguage).toBe('en');
    expect(es.inLanguage).toBe('es');
  });

  it('publishes the real phone number, never the launch placeholder', () => {
    expect(en.telephone).toBe('+1-956-705-5146');
    expect(en.telephone).not.toContain('000-0000');
    expect(en.contactPoint.telephone).toBe(business.phone);
  });

  it('keeps the launch facts: address, languages, founder', () => {
    expect(en.address.addressLocality).toBe('Harlingen');
    expect(en.address.addressRegion).toBe('TX');
    expect(en.availableLanguage).toEqual(['English', 'Spanish']);
    expect(en.founder.name).toBe('Dan Lopez');
  });

  it('models every served city as a Place', () => {
    expect(en.areaServed).toHaveLength(business.areaServed.length);
    expect(en.areaServed[0]).toEqual({ '@type': 'Place', name: 'Rio Grande Valley' });
    expect(en.areaServed.map((p) => p.name)).toContain('Brownsville');
  });

  it('offers each service back to the same business entity', () => {
    expect(en.hasOfferCatalog?.itemListElement).toHaveLength(2);
    const first = en.hasOfferCatalog!.itemListElement[0];
    expect(first.itemOffered.name).toBe('AI & Automation');
    expect(first.itemOffered.provider).toEqual({ '@id': BUSINESS_ID });
  });

  it('omits the offer catalog rather than emitting an empty one', () => {
    const bare = businessSchema({ locale: 'en', description: 'x' });
    expect('hasOfferCatalog' in bare).toBe(false);
  });

  it('points at a real logo asset, not the framework default', () => {
    // app/favicon.ico was the untouched create-next-app icon for a month.
    expect(en.logo).toBe(`${SITE_URL}/icon.svg`);
    expect(en.logo).not.toContain('favicon.ico');
  });

  it('omits sameAs while there are no profiles to point at', () => {
    // Guard against emitting `sameAs: []`, which asserts "no profiles exist".
    expect('sameAs' in en).toBe(business.sameAs.length > 0);
  });
});

describe('articleSchema', () => {
  const post = articleSchema({
    locale: 'es',
    slug: 'we-answer-our-own-phone',
    title: 'Contestamos nuestro propio teléfono',
    description: 'Una descripción.',
    date: '2026-08-09',
    category: 'IA',
  });

  it('is a BlogPosting that points back at its own canonical url', () => {
    expect(post['@type']).toBe('BlogPosting');
    expect(post.mainEntityOfPage).toBe(`${SITE_URL}/es/insights/we-answer-our-own-phone`);
    expect(post.url).toBe(post.mainEntityOfPage);
  });

  it('credits the founder and publishes under the business entity', () => {
    expect(post.author).toEqual({ '@type': 'Person', name: 'Dan Lopez', url: `${SITE_URL}/es/about` });
    expect(post.publisher).toEqual({ '@id': BUSINESS_ID });
  });

  it('carries the dates and language search engines ask for', () => {
    expect(post.datePublished).toBe('2026-08-09');
    expect(post.dateModified).toBe('2026-08-09');
    expect(post.inLanguage).toBe('es');
    expect(post.articleSection).toBe('IA');
  });

  it('every published post has a headline search engines will not truncate', () => {
    const dir = path.join(process.cwd(), 'src', 'content', 'insights');
    for (const locale of ['en', 'es']) {
      for (const file of fs.readdirSync(path.join(dir, locale))) {
        const src = fs.readFileSync(path.join(dir, locale, file), 'utf8');
        const title = /title:\s*'([^']*)'/.exec(src)?.[1] ?? '';
        expect(title.length, `${locale}/${file} headline`).toBeGreaterThan(0);
        expect(title.length, `${locale}/${file} headline is ${title.length} chars`).toBeLessThanOrEqual(MAX_HEADLINE);
      }
    }
  });
});

describe('breadcrumbSchema', () => {
  const crumbs = breadcrumbSchema({
    locale: 'en',
    trail: [
      { name: 'Home', path: '/' },
      { name: 'Insights', path: '/insights' },
      { name: 'A post', path: '/insights/a-post' },
    ],
  });

  it('numbers the trail from one and makes every item absolute', () => {
    expect(crumbs.itemListElement.map((i) => i.position)).toEqual([1, 2, 3]);
    expect(crumbs.itemListElement[0].item).toBe(`${SITE_URL}/en`);
    expect(crumbs.itemListElement[2].item).toBe(`${SITE_URL}/en/insights/a-post`);
  });
});

describe('url helpers', () => {
  it('collapses the root path instead of emitting a trailing slash', () => {
    expect(absoluteUrl('en', '/')).toBe(`${SITE_URL}/en`);
    expect(absoluteUrl('es', '/work')).toBe(`${SITE_URL}/es/work`);
  });

  it('escapes the title into the og url', () => {
    expect(ogImageUrl('AI & Automation')).toBe(`${SITE_URL}/og?title=AI%20%26%20Automation`);
  });
});
