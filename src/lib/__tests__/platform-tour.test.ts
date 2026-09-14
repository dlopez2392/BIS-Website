import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { tourSections, heroShot, allShots, shotSrc } from '../platform-tour';

const read = (f: string) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));
const locales = { en: read('en.json'), es: read('es.json') } as const;

describe('the /platform tour', () => {
  it('gives every section copy in both languages', () => {
    for (const [locale, m] of Object.entries(locales)) {
      for (const s of tourSections) {
        const sec = m.platform?.sections?.[s.id];
        expect(sec, `${locale}: platform.sections.${s.id} is missing`).toBeTruthy();
        for (const key of ['kicker', 'title', 'body']) {
          expect(sec[key], `${locale}: platform.sections.${s.id}.${key}`).toBeTruthy();
        }
        // A quoted section carries the line AND where it came from — a quote
        // with no attribution reads as marketing copy in quote marks.
        if ('quoted' in s && s.quoted) {
          expect(sec.quote, `${locale}: ${s.id}.quote`).toBeTruthy();
          expect(sec.quoteSource, `${locale}: ${s.id}.quoteSource`).toBeTruthy();
        }
      }
    }
  });

  /**
   * Alt text is the only description a screen reader gets of a screenshot, and
   * these screenshots ARE the evidence the page rests on. A missing key here
   * renders the raw key string into the alt attribute, which is worse than no
   * image at all.
   */
  it('gives every capture alt text in both languages, including the hero', () => {
    for (const [locale, m] of Object.entries(locales)) {
      for (const id of ['hero', ...tourSections.map((s) => s.id)]) {
        expect(m.platform?.alt?.[id], `${locale}: platform.alt.${id}`).toBeTruthy();
      }
    }
  });

  /**
   * The page shows invented customers of an invented company. Losing the
   * caption would turn every screenshot into an unlabelled claim about a real
   * client, so both halves of the disclosure are asserted rather than trusted
   * to survive a copy edit.
   */
  it('keeps the sample-data disclosure in both languages', () => {
    for (const [locale, m] of Object.entries(locales)) {
      expect(m.platform?.sampleNote, `${locale}: sampleNote`).toBeTruthy();
      expect(m.platform?.sampleCaption, `${locale}: sampleCaption`).toBeTruthy();
      expect(m.platform.sampleNote.length, `${locale}: sampleNote is too short to say anything`)
        .toBeGreaterThan(80);
    }
  });

  it('is reachable from the nav in both languages', () => {
    for (const [locale, m] of Object.entries(locales)) {
      expect(m.nav?.platform, `${locale}: nav.platform`).toBeTruthy();
    }
  });

  it('names every capture once, so two sections cannot share one file', () => {
    const files = allShots().map((s) => s.file);
    expect(new Set(files).size).toBe(files.length);
  });

  it('gives every capture real dimensions, since next/image reserves layout from them', () => {
    for (const s of allShots()) {
      expect(s.width, s.file).toBeGreaterThan(0);
      expect(s.height, s.file).toBeGreaterThan(0);
      expect(s.file, 'captures are PNG').toMatch(/\.png$/);
    }
  });

  it('serves captures from /screenshots, not /photos', () => {
    expect(shotSrc(heroShot)).toBe('/screenshots/dashboard-dark.png');
  });

  /**
   * The page is written to stand up with NO captures on disk — that is the
   * whole point of the render-only-if-present rule. This asserts the state we
   * are actually shipping in, and will need updating the day the pipeline
   * lands its files, which is the moment to re-read the page with images in it.
   */
  it('ships before any capture exists, and says so here when that changes', () => {
    const present = allShots().filter((s) =>
      fs.existsSync(path.join(process.cwd(), 'public', 'screenshots', s.file)));
    expect(
      present.map((s) => s.file),
      'captures have landed — drop this assertion and review the page with images in it',
    ).toEqual([]);
  });
});
