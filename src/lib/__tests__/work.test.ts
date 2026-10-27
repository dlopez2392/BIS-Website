import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  workCases, workCaseTextKeys, workCaseListKeys, workCallCtaKeys, workVisitCtaKeys, workMediaKeys,
  workVideoKeys, workTourCtaKeys, RESACA_MEDIA,
  BIS_AD, PRISM_AD, PRISM_MEDIA, PRISM_URL, type ThemedShot,
} from '../work';

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

  it('has the tour copy for every case that links to the platform tour', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      for (const c of workCases.filter((x) => x.cta === 'tour')) {
        for (const key of workTourCtaKeys) {
          expect(typeof messages.work.cases[c.id][key], `${locale} ${c.id}.${key}`).toBe('string');
        }
      }
    }
  });

  it('says in both languages, in the label and the caption, that the demo company is not a client', () => {
    expect(locales.en.work.cases.resaca.label).toMatch(/demo account, not a client/);
    expect(locales.en.work.cases.resaca.galleryCaption).toMatch(/invented/);
    expect(locales.es.work.cases.resaca.label).toMatch(/demostración, no un cliente/);
    expect(locales.es.work.cases.resaca.galleryCaption).toMatch(/inventados/);
  });

  it('has the visit copy for every case that links out, and links only to https', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      for (const c of workCases) {
        if (c.cta !== 'visit') continue;
        expect(c.href.startsWith('https://'), c.href).toBe(true);
        for (const key of workVisitCtaKeys) {
          expect(typeof messages.work.cases[c.id][key], `${locale} ${c.id}.${key}`).toBe('string');
        }
      }
    }
  });

  it('has a label for every film, a caption for every gallery, and alt text for every screen', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      for (const c of workCases) {
        if (!c.media) continue;
        const entry = messages.work.cases[c.id];
        const keys = c.media.video ? [...workMediaKeys, ...workVideoKeys] : workMediaKeys;
        for (const key of keys) {
          expect(typeof entry[key], `${locale} ${c.id}.${key}`).toBe('string');
        }
        const shots = [c.media.desktop, ...(c.media.phones ?? [])].filter(Boolean) as ThemedShot[];
        for (const shot of shots) {
          const alt = entry.galleryAlt?.[shot.id];
          expect(typeof alt === 'string' && alt.trim() !== '', `${locale} ${c.id}.galleryAlt.${shot.id}`).toBe(true);
        }
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

/**
 * Every file the page names exists on disk, at the size the code claims.
 * `next/image` reserves layout from the declared width and height, so a
 * mismatch is a squashed or stretched screenshot in production, not an error.
 */
describe('work media files', () => {
  const pub = (p: string) => path.join(process.cwd(), 'public', p);

  it('ships both encodes and the poster of each film', () => {
    for (const film of [BIS_AD, PRISM_AD]) {
      for (const f of [film.webm, film.mp4, film.poster]) {
        expect(fs.existsSync(pub(f)), f).toBe(true);
      }
    }
  });

  it('declares each poster and screenshot at its real size, in both themes', async () => {
    for (const film of [BIS_AD, PRISM_AD]) {
      const meta = await sharp(pub(film.poster)).metadata();
      expect([meta.width, meta.height], film.poster).toEqual([film.width, film.height]);
    }
    const shots = [PRISM_MEDIA.desktop!, ...PRISM_MEDIA.phones!];
    for (const shot of shots) {
      for (const f of [shot.light, shot.dark]) {
        const meta = await sharp(pub(f)).metadata();
        expect([meta.width, meta.height], f).toEqual([shot.width, shot.height]);
      }
    }
  });

  it('shows the demo account from the same captures the platform tour uses', () => {
    const shots = [RESACA_MEDIA.desktop!, ...RESACA_MEDIA.phones!];
    for (const shot of shots) {
      expect(shot.light).toBe(shot.dark);
      expect(shot.light.startsWith('/screenshots/'), shot.light).toBe(true);
      expect(fs.existsSync(pub(shot.light)), shot.light).toBe(true);
    }
  });

  it('points at the live demo', () => {
    expect(PRISM_URL).toBe('https://prism.bis-rgv.com');
  });
});
