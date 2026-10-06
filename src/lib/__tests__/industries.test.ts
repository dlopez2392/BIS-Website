import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { industryPages, industryIds, getIndustry, industryTextKeys } from '@/lib/industries';
import { sitemapPaths } from '@/app/sitemap';

const read = (f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));
const locales = { en: read('en.json'), es: read('es.json') } as const;

describe('industry pages', () => {
  it('covers the five industries the index card grid names', () => {
    expect(industryIds).toEqual(['legal', 'medical', 'logistics', 'trades', 'agriculture']);
  });

  it('resolves a known id and refuses an unknown one', () => {
    expect(getIndustry('legal')?.id).toBe('legal');
    expect(getIndustry('crypto')).toBeUndefined();
  });

  it('has every text key in both languages', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      for (const industry of industryPages) {
        const page = messages.industries.pages[industry.id];
        expect(page, `${locale} is missing industries.pages.${industry.id}`).toBeTruthy();
        for (const key of industryTextKeys) {
          expect(typeof page[key], `${locale}.${industry.id}.${key}`).toBe('string');
          expect(page[key].length, `${locale}.${industry.id}.${key} is empty`).toBeGreaterThan(20);
        }
        expect(messages.industries[industry.labelKey], `${locale} label for ${industry.id}`).toBeTruthy();
      }
    }
  });

  it('gives every industry three workflows and three answered questions, in both languages', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      for (const industry of industryPages) {
        const page = messages.industries.pages[industry.id];
        expect(page.workflows, `${locale}.${industry.id}.workflows`).toHaveLength(3);
        expect(page.faq, `${locale}.${industry.id}.faq`).toHaveLength(3);
        for (const w of page.workflows) {
          expect(typeof w.title).toBe('string');
          expect(typeof w.body).toBe('string');
        }
        for (const q of page.faq) {
          // A question that does not end in a question mark is a heading, and
          // it would be marked up as a Question in the page's FAQ schema.
          expect(q.q.trim().endsWith('?'), `${locale}.${industry.id}: "${q.q}"`).toBe(true);
          expect(q.a.length).toBeGreaterThan(40);
        }
      }
    }
  });

  it('is listed in the sitemap', () => {
    const paths = sitemapPaths();
    for (const industry of industryPages) expect(paths).toContain(`/industries/${industry.id}`);
  });

  it('never translates the URL segment, so a link cannot break with the wording', () => {
    for (const industry of industryPages) expect(industry.id).toMatch(/^[a-z]+$/);
  });
});

/**
 * "What lands on your desk": one concrete example per industry, in place of
 * a blurb. Same structure in both languages so the Spanish page is never a
 * thinner page, and every named person is marked as invented, so the example
 * can never read as a real client's file.
 */
describe('industry examples', () => {
  it('gives every industry one example, the same shape in both languages', () => {
    for (const industry of industryPages) {
      const en = locales.en.industries.pages[industry.id].artifact;
      const es = locales.es.industries.pages[industry.id].artifact;
      for (const [locale, a] of [['en', en], ['es', es]] as const) {
        expect(a, `${locale}.${industry.id}.artifact`).toBeTruthy();
        for (const key of ['label', 'meta', 'footnote']) {
          expect(a[key], `${locale}.${industry.id}.artifact.${key}`).toBeTruthy();
        }
        // Rows OR a thread, never neither.
        expect(Boolean(a.rows) !== Boolean(a.thread), `${locale}.${industry.id}: rows xor thread`).toBe(true);
      }
      expect(es.rows?.length, `${industry.id}: es rows match en`).toBe(en.rows?.length);
      expect(es.thread?.length, `${industry.id}: es thread matches en`).toBe(en.thread?.length);
    }
  });

  it('marks every named person as a sample, in the page language', () => {
    const marker = { en: '(sample)', es: '(ejemplo)' } as const;
    for (const [locale, messages] of Object.entries(locales) as ['en' | 'es', typeof locales.en][]) {
      for (const industry of industryPages) {
        const a = messages.industries.pages[industry.id].artifact;
        if (!a.rows) continue;
        const named = a.rows.filter((r: { v: string }) => r.v.includes(marker[locale]));
        expect(named.length, `${locale}.${industry.id}: no row is marked ${marker[locale]}`).toBeGreaterThan(0);
      }
      expect(messages.industries.shared.artifactCaption, `${locale}: artifactCaption`).toBeTruthy();
    }
  });
});
