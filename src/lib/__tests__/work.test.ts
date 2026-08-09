import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { workCases, workCaseTextKeys, workCaseListKeys, workCallCtaKeys } from '../work';

const read = (f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));
const locales = { en: read('en.json'), es: read('es.json') } as const;

describe('work case studies', () => {
  it('has at least one case', () => {
    expect(workCases.length).toBeGreaterThan(0);
  });

  it('has unique case ids', () => {
    const ids = workCases.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has every text key in both locales for every case', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      for (const c of workCases) {
        const entry = messages.work.cases[c.id];
        expect(entry, `${locale} case ${c.id}`).toBeTruthy();
        for (const key of workCaseTextKeys) {
          expect(typeof entry[key], `${locale} ${c.id}.${key}`).toBe('string');
          expect(entry[key].trim(), `${locale} ${c.id}.${key}`).not.toBe('');
        }
      }
    }
  });

  it('has non-empty lists in both locales for every case', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      for (const c of workCases) {
        for (const key of workCaseListKeys) {
          const list = messages.work.cases[c.id][key];
          expect(Array.isArray(list), `${locale} ${c.id}.${key}`).toBe(true);
          expect(list.length, `${locale} ${c.id}.${key}`).toBeGreaterThan(0);
          expect(list.every((v: unknown) => typeof v === 'string' && v.trim() !== '')).toBe(true);
        }
      }
    }
  });

  it('has the call-to-action copy for every case that renders one', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      for (const c of workCases.filter((x) => x.cta === 'call')) {
        for (const key of workCallCtaKeys) {
          expect(typeof messages.work.cases[c.id][key], `${locale} ${c.id}.${key}`).toBe('string');
        }
      }
    }
  });

  it('keeps EN and ES fact lists the same length so neither locale silently drops a claim', () => {
    for (const c of workCases) {
      for (const key of workCaseListKeys) {
        expect(locales.es.work.cases[c.id][key].length, `${c.id}.${key}`).toBe(
          locales.en.work.cases[c.id][key].length
        );
      }
    }
  });

  it('page chrome exists in both locales', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      for (const key of ['title', 'metaDescription', 'intro', 'nextHeading', 'nextBody', 'ctaTitle', 'ctaBody']) {
        expect(typeof messages.work[key], `${locale} work.${key}`).toBe('string');
      }
      expect(typeof messages.footer.work, `${locale} footer.work`).toBe('string');
    }
  });
});
