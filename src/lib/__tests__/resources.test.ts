import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { resources } from '../resources';

const read = (f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));
const en = read('en.json');
const es = read('es.json');

describe('resources', () => {
  it('every resource has EN+ES title/blurb and existing PDF files', () => {
    for (const r of resources) {
      expect(en.resources.items[r.slug]?.title, `en title ${r.slug}`).toBeTruthy();
      expect(en.resources.items[r.slug]?.blurb, `en blurb ${r.slug}`).toBeTruthy();
      expect(es.resources.items[r.slug]?.title, `es title ${r.slug}`).toBeTruthy();
      expect(es.resources.items[r.slug]?.blurb, `es blurb ${r.slug}`).toBeTruthy();
      for (const loc of ['en', 'es'] as const) {
        const p = path.join(process.cwd(), 'public', r.files[loc]);
        expect(fs.existsSync(p), `${loc} pdf ${r.files[loc]}`).toBe(true);
      }
    }
  });
});
