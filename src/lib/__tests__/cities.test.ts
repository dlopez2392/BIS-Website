import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { cityPages, cityIds, getCity, cityTextKeys } from '../cities';
import { business } from '../seo/business';

const read = (f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));
const locales = { en: read('en.json'), es: read('es.json') } as const;

describe('city pages', () => {
  it('only claims cities the business actually serves', () => {
    for (const c of cityPages) {
      expect(business.areaServed, `${c.name} is not in areaServed`).toContain(c.name);
    }
  });

  it('has unique, url-safe ids', () => {
    expect(new Set(cityIds).size).toBe(cityIds.length);
    for (const id of cityIds) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it('resolves a known id and rejects an unknown one', () => {
    expect(getCity('brownsville')?.name).toBe('Brownsville');
    expect(getCity('not-a-city')).toBeUndefined();
  });

  it('has every text key in both locales', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      for (const c of cityPages) {
        for (const key of cityTextKeys) {
          const value = messages.cities[c.id]?.[key];
          expect(typeof value, `${locale} ${c.id}.${key}`).toBe('string');
          expect(value.trim(), `${locale} ${c.id}.${key}`).not.toBe('');
        }
      }
    }
  });

  it('has the same number of sectors per city in both locales', () => {
    for (const c of cityPages) {
      const en = locales.en.cities[c.id].sectors;
      const es = locales.es.cities[c.id].sectors;
      expect(Array.isArray(en) && en.length >= 2, `${c.id} en sectors`).toBe(true);
      expect(es.length, `${c.id} es sectors`).toBe(en.length);
      for (const list of [en, es]) {
        for (const s of list) {
          expect(typeof s.title).toBe('string');
          expect(typeof s.body).toBe('string');
        }
      }
    }
  });

  it('gives every city genuinely different copy', () => {
    // A location page that is another city with the name swapped is a doorway
    // page. Compare the body text of every pair and fail on near-duplicates.
    const bodies = new Map<string, string>();
    for (const c of cityPages) {
      const entry = locales.en.cities[c.id];
      const text = [entry.intro, entry.howBody, ...entry.sectors.map((s: { body: string }) => s.body)]
        .join(' ')
        .toLowerCase();
      bodies.set(c.id, text);
    }
    for (const [aId, aText] of bodies) {
      for (const [bId, bText] of bodies) {
        if (aId >= bId) continue;
        const aWords = new Set(aText.split(/\W+/).filter((w) => w.length > 4));
        const bWords = new Set(bText.split(/\W+/).filter((w) => w.length > 4));
        const shared = [...aWords].filter((w) => bWords.has(w)).length;
        const overlap = shared / Math.min(aWords.size, bWords.size);
        expect(overlap, `${aId} and ${bId} share ${Math.round(overlap * 100)}% of their vocabulary`).toBeLessThan(0.5);
      }
    }
  });

  it('names each city in its own metadata so the pages do not compete', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      for (const c of cityPages) {
        expect(messages.cities[c.id].metaTitle, `${locale} ${c.id}`).toContain(c.name);
        expect(messages.cities[c.id].heading, `${locale} ${c.id}`).toContain(c.name);
      }
    }
  });

  it('has the shared chrome in both locales', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      for (const key of [
        'eyebrow', 'sectorsHeading', 'howHeading', 'provenHeading', 'provenBody',
        'provenLink', 'servicesLink', 'otherCitiesHeading', 'backToAll', 'ctaTitle', 'ctaBody',
      ]) {
        expect(typeof messages.cities.shared[key], `${locale} shared.${key}`).toBe('string');
      }
      // The {city} placeholder has to survive translation or the heading reads
      // "What we see in" with nothing after it.
      expect(messages.cities.shared.sectorsHeading).toContain('{city}');
      expect(messages.cities.shared.ctaTitle).toContain('{city}');
    }
  });
});
