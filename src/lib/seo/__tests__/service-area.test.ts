import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { business } from '../business';

const read = (f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));
const en = read('en.json');
const es = read('es.json');
const KEYS = ['title', 'metaDescription', 'heading', 'intro', 'citiesHeading', 'whyLocalHeading', 'whyLocalBody', 'ctaTitle', 'ctaBody'];

describe('service area', () => {
  it('has matching EN/ES keys for the serviceArea namespace', () => {
    for (const k of KEYS) {
      expect(en.serviceArea[k], `en ${k}`).toBeTruthy();
      expect(es.serviceArea[k], `es ${k}`).toBeTruthy();
    }
  });
  it('serves the Rio Grande Valley plus specific cities', () => {
    expect(business.areaServed[0]).toBe('Rio Grande Valley');
    expect(business.areaServed).toContain('McAllen');
    expect(business.areaServed.length).toBeGreaterThan(6);
  });
});
