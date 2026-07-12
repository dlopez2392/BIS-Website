import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { faqCategories, faqItemIds } from '../faq';

const read = (f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));
const en = read('en.json');
const es = read('es.json');

describe('faq data', () => {
  it('has an EN and ES heading for every category id', () => {
    for (const c of faqCategories) {
      expect(en.faq.categories[c.id], `en cat ${c.id}`).toBeTruthy();
      expect(es.faq.categories[c.id], `es cat ${c.id}`).toBeTruthy();
    }
  });
  it('has an EN and ES q + a for every item id', () => {
    for (const id of faqItemIds) {
      expect(en.faq.items[id]?.q, `en q ${id}`).toBeTruthy();
      expect(en.faq.items[id]?.a, `en a ${id}`).toBeTruthy();
      expect(es.faq.items[id]?.q, `es q ${id}`).toBeTruthy();
      expect(es.faq.items[id]?.a, `es a ${id}`).toBeTruthy();
    }
  });
});
