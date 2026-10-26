import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { SERVICES_FAQ, faqItemIds } from '../faq';

const read = (f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));
const en = read('en.json');
const es = read('es.json');

// The /services sections read these through t.raw, which returns whatever is
// there: a missing or mismatched list renders a short or empty column in one
// language instead of failing the build.
const LISTS = ['needIf', 'get'] as const;

describe('services page copy', () => {
  it('has the same lists, item for item, in EN and ES for every service', () => {
    const sections = [
      ...(['g1', 'g2', 'g3'] as const).map((g) => [g, en.services.detail[g], es.services.detail[g]] as const),
      ['platform', en.services.platform, es.services.platform] as const,
    ];
    for (const [name, e, s] of sections) {
      for (const list of LISTS) {
        expect(Array.isArray(e?.[list]) && e[list].length > 0, `en ${name}.${list}`).toBe(true);
        expect(s?.[list]?.length, `es ${name}.${list}`).toBe(e[list].length);
      }
      for (const key of ['outcome', 'firstStep', 'cta']) {
        expect(e?.[key], `en ${name}.${key}`).toBeTruthy();
        expect(s?.[key], `es ${name}.${key}`).toBeTruthy();
      }
    }
  });

  it('asks only questions the FAQ page answers', () => {
    for (const id of SERVICES_FAQ) expect(faqItemIds).toContain(id);
  });
});
