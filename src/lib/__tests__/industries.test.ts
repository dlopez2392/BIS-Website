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
