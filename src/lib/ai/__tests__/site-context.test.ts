import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { buildSiteContext, PACK_MAX_CHARS } from '../site-context';
import { business } from '@/lib/seo/business';
import { faqItemIds } from '@/lib/faq';
import { capabilityGroups, expertiseIds } from '@/lib/tech/capabilities';
import { resources } from '@/lib/resources';
import type { PostMeta } from '@/lib/insights';

const readMessages = (file: string) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', file), 'utf8')) as Record<string, unknown>;

const en = readMessages('en.json');
const es = readMessages('es.json');

const posts: PostMeta[] = [
  {
    slug: 'find-your-first-hour-back',
    title: 'Find your first hour back',
    description: 'Where to look for the first hour automation can return to you.',
    category: 'AI',
    date: '2026-07-10',
    readingMinutes: 4,
  },
  {
    slug: 'bilingual-by-design',
    title: 'Bilingual by design',
    description: 'Why serving the Valley means building in both languages from day one.',
    category: 'Culture',
    date: '2026-07-11',
    readingMinutes: 5,
  },
];

const enPack = buildSiteContext({ locale: 'en', messages: en, posts });
const esPack = buildSiteContext({ locale: 'es', messages: es, posts });

describe('buildSiteContext', () => {
  it('includes core business facts and every service area', () => {
    expect(enPack).toContain(business.name);
    expect(enPack).toContain(business.founder);
    expect(enPack).toContain(business.email);
    for (const area of business.areaServed) expect(enPack, `area ${area}`).toContain(area);
  });

  it('includes every FAQ question and answer', () => {
    const items = (en.faq as { items: Record<string, { q: string; a: string }> }).items;
    for (const id of faqItemIds) {
      expect(enPack, `q ${id}`).toContain(items[id].q);
      expect(enPack, `a ${id}`).toContain(items[id].a);
    }
  });

  it('includes every capability group label and every product name', () => {
    const groups = (en.capabilities as { groups: Record<string, string> }).groups;
    for (const g of capabilityGroups) {
      expect(enPack, `group ${g.id}`).toContain(groups[g.id]);
      for (const item of g.items) expect(enPack, `product ${item}`).toContain(item);
    }
  });

  it('includes every expertise label', () => {
    const expertise = (en.capabilities as { expertise: Record<string, string> }).expertise;
    for (const id of expertiseIds) expect(enPack, `expertise ${id}`).toContain(expertise[id]);
  });

  it('includes the process steps, pricing model, and what-to-expect', () => {
    const hww = en.howWeWork as Record<string, string>;
    for (const n of [1, 2, 3, 4]) {
      expect(enPack, `step ${n}`).toContain(hww[`step${n}Title`]);
      expect(enPack, `step ${n} body`).toContain(hww[`step${n}Body`]);
    }
    expect(enPack).toContain(hww.pricingBody);
    expect(enPack).toContain(hww.expectBody);
  });

  it('includes the founder bio, all 8 credentials, and all 4 method blocks', () => {
    const about = en.about as Record<string, string>;
    expect(enPack).toContain(about.founderBio);
    for (let n = 1; n <= 8; n++) expect(enPack, `cred ${n}`).toContain(about[`cred${n}Title`]);
    for (let n = 1; n <= 4; n++) expect(enPack, `method ${n}`).toContain(about[`m${n}Title`]);
  });

  it('includes each resource with its locale-prefixed detail URL', () => {
    for (const r of resources) {
      expect(enPack, `resource ${r.slug}`).toContain(`${business.url}/en/resources/${r.slug}`);
    }
  });

  it('includes each post with title, description, and locale-prefixed URL', () => {
    for (const p of posts) {
      expect(enPack).toContain(p.title);
      expect(enPack).toContain(p.description);
      expect(enPack).toContain(`${business.url}/en/insights/${p.slug}`);
    }
  });

  it('lists posts newest first', () => {
    expect(enPack.indexOf('Bilingual by design')).toBeLessThan(enPack.indexOf('Find your first hour back'));
  });

  it('handles an empty post list without throwing', () => {
    expect(() => buildSiteContext({ locale: 'en', messages: en, posts: [] })).not.toThrow();
  });

  it('emits a page map whose every URL carries the locale prefix', () => {
    for (const p of ['/services', '/industries', '/about', '/how-we-work', '/capabilities', '/faq', '/service-area', '/insights', '/resources', '/contact', '/privacy']) {
      expect(enPack, `en ${p}`).toContain(`${business.url}/en${p}`);
      expect(esPack, `es ${p}`).toContain(`${business.url}/es${p}`);
    }
  });

  it('never emits an unprefixed site URL', () => {
    const bad = new RegExp(`${business.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(?!en/|es/|en\\b|es\\b)`, 'g');
    expect(enPack.match(bad)).toBeNull();
    expect(esPack.match(bad)).toBeNull();
  });

  it('builds Spanish from Spanish copy', () => {
    const esFaq = (es.faq as { items: Record<string, { q: string }> }).items;
    expect(esPack).toContain(esFaq.whatIsBis.q);
    expect(esPack).not.toContain((en.faq as { items: Record<string, { q: string }> }).items.whatIsBis.q);
  });

  it('leaks no raw keys, undefined, or stringified objects', () => {
    for (const pack of [enPack, esPack]) {
      expect(pack).not.toContain('undefined');
      expect(pack).not.toContain('[object Object]');
      expect(pack).not.toMatch(/faq\.items\./);
      expect(pack).not.toMatch(/capabilities\.groups\./);
    }
  });

  it('stays within the per-locale budget', () => {
    expect(enPack.length).toBeLessThanOrEqual(PACK_MAX_CHARS);
    expect(esPack.length).toBeLessThanOrEqual(PACK_MAX_CHARS);
  });

  it('keeps EN and ES within 25% of each other', () => {
    const ratio = Math.abs(enPack.length - esPack.length) / Math.max(enPack.length, esPack.length);
    expect(ratio).toBeLessThan(0.25);
  });

  it('throws a named error when a required key is missing', () => {
    const broken = JSON.parse(JSON.stringify(en)) as Record<string, unknown>;
    delete (broken.howWeWork as Record<string, unknown>).pricingBody;
    expect(() => buildSiteContext({ locale: 'en', messages: broken, posts })).toThrow(/howWeWork\.pricingBody/);
  });

  it('throws when a required list key is not an array of strings', () => {
    const broken = JSON.parse(JSON.stringify(en)) as Record<string, unknown>;
    (broken.services as Record<string, unknown>).g1Bullets = 'not a list';
    expect(() => buildSiteContext({ locale: 'en', messages: broken, posts })).toThrow(/services\.g1Bullets/);
  });
});
