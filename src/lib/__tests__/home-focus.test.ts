import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  FOCUS_IDS, STILL_FOCUS_IDS, FOCUS_LINKS, FOCUS_PANEL_LINES, focusTextKeys, focusPanelTextKeys,
} from '../home/focus';
import { workExamples, exampleTextKeys } from '../home/examples';

const read = (f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));
const locales = { en: read('en.json'), es: read('es.json') } as const;
const pub = (p: string) => path.join(process.cwd(), 'public', p);

describe('the home page’s five areas', () => {
  it('has every area’s copy in both languages', () => {
    for (const [locale, m] of Object.entries(locales)) {
      for (const id of FOCUS_IDS) {
        for (const key of focusTextKeys) {
          expect(m.home.focus[id]?.[key], `${locale} focus.${id}.${key}`).toBeTruthy();
        }
        expect(FOCUS_LINKS[id].startsWith('/'), id).toBe(true);
      }
    }
  });

  it('gives each still panel its three layers in both languages: one exchange, a record, a strip', () => {
    for (const [locale, m] of Object.entries(locales)) {
      for (const id of STILL_FOCUS_IDS) {
        const p = m.home.focus[id];
        for (const key of focusPanelTextKeys) expect(p[key], `${locale} focus.${id}.${key}`).toBeTruthy();
        expect(p.lines, `${locale} focus.${id}.lines`).toHaveLength(FOCUS_PANEL_LINES);
        expect(p.record.length, `${locale} focus.${id}.record`).toBe(locales.en.home.focus[id].record.length);
        for (const row of p.record) expect(row.k && row.v, `${locale} focus.${id}.record`).toBeTruthy();
      }
    }
  });

  it('says in both languages that a still panel is an example, not a client’s words', () => {
    expect(locales.en.home.focus.note).toMatch(/not a client/);
    expect(locales.es.home.focus.note).toMatch(/no las palabras de un cliente/);
    for (const id of STILL_FOCUS_IDS) {
      expect(locales.en.home.focus[id].status).toBe('Example');
      expect(locales.es.home.focus[id].status).toBe('Ejemplo');
    }
  });
});

describe('the home page’s work examples', () => {
  const examples = workExamples('en');

  it('has unique ids and copy for every example in both languages', () => {
    expect(new Set(examples.map((x) => x.id)).size).toBe(examples.length);
    for (const [locale, m] of Object.entries(locales)) {
      for (const x of examples) {
        for (const key of exampleTextKeys) {
          expect(m.home.examples.items[x.id]?.[key], `${locale} examples.${x.id}.${key}`).toBeTruthy();
        }
      }
      for (const status of ['live', 'demo', 'concept']) expect(m.home.examples.status[status], `${locale} ${status}`).toBeTruthy();
    }
  });

  it('shows at least one example for each of the five areas', () => {
    for (const id of FOCUS_IDS) expect(examples.some((x) => x.area === id), id).toBe(true);
  });

  it('never words a concept or a demo as delivered work', () => {
    for (const x of examples) {
      const en = locales.en.home.examples.items[x.id].body as string;
      const es = locales.es.home.examples.items[x.id].body as string;
      if (x.status === 'concept') {
        expect(en, x.id).toMatch(/concept|Sample data/i);
        expect(es, x.id).toMatch(/concepto|Datos de muestra/i);
        // A concept leads to a conversation, not to a site that does not exist.
        expect(x.href, x.id).toBe('/contact');
      }
      if (x.status === 'demo') {
        expect(en, x.id).toMatch(/fictional/);
        expect(es, x.id).toMatch(/ficticio/);
      }
    }
  });

  it('links out only over https, and only for examples that live elsewhere', () => {
    for (const x of examples) {
      if (x.external) expect(x.href.startsWith('https://'), x.href).toBe(true);
      else expect(x.href.startsWith('/'), x.href).toBe(true);
    }
  });

  it('has every image on disk at the declared size, in both languages', async () => {
    for (const locale of ['en', 'es']) {
      for (const x of workExamples(locale)) {
        expect(fs.existsSync(pub(x.src)), x.src).toBe(true);
        const meta = await sharp(pub(x.src)).metadata();
        expect([meta.width, meta.height], x.src).toEqual([x.width, x.height]);
      }
    }
  });
});
