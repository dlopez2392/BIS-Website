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
   * The captures have landed (2026-09-15), so this replaces the assertion that
   * guarded the empty state. The render-only-if-present rule still holds — the
   * page stands up with no files on disk — but now that files DO exist, the
   * thing worth guarding is that they are the right files at the right size.
   *
   * That is not a hypothetical. The capture pipeline shipped half-resolution
   * images TWICE: once because `shoot()` passed `scale: "css"`, and again
   * because the weekly-report had its own screenshot call carrying a second
   * copy of the same option that the first fix never touched. Both times the
   * aspect ratio was right, so nothing looked broken — the images were simply
   * soft on every retina screen, which is invisible in review and permanent
   * on the page.
   *
   * `next/image` is handed these width/height values; if the file disagrees,
   * it reserves the wrong box. So the declared numbers and the bytes on disk
   * are asserted against each other, read straight out of the PNG's IHDR
   * chunk (bytes 16-24, two big-endian uint32s) rather than by adding an
   * image library for six files.
   */
  it('has every declared capture on disk, at exactly the declared size', () => {
    const missing: string[] = [];
    const wrongSize: string[] = [];

    for (const slot of allShots()) {
      const file = path.join(process.cwd(), 'public', 'screenshots', slot.file);
      if (!fs.existsSync(file)) {
        missing.push(slot.file);
        continue;
      }
      const header = fs.readFileSync(file).subarray(16, 24);
      const width = header.readUInt32BE(0);
      const height = header.readUInt32BE(4);
      if (width !== slot.width || height !== slot.height) {
        wrongSize.push(`${slot.file}: ${width}x${height}, declared ${slot.width}x${slot.height}`);
      }
    }

    expect(missing, 'declared captures with no file in public/screenshots').toEqual([]);
    expect(
      wrongSize,
      'a capture does not match the size lib/platform-tour.ts declares — next/image will reserve the wrong box',
    ).toEqual([]);
  });
});
