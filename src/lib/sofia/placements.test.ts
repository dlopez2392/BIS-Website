import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { sofiaPlacements } from './placements';

const read = (f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', f), 'utf8'));
const locales = { en: read('en.json'), es: read('es.json') } as const;

/** Walk a dotted path like `work.cases.sofia.tryBrowserTitle`. */
function at(messages: unknown, dotted: string): unknown {
  return dotted.split('.').reduce<unknown>(
    (node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined),
    messages,
  );
}

describe('Sofía placements', () => {
  it('has unique ids, so an analytics property cannot mean two pages', () => {
    const ids = sofiaPlacements.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves every placement’s copy to real text in both locales', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      for (const p of sofiaPlacements) {
        for (const key of [p.titleKey, p.blurbKey]) {
          const value = at(messages, key);
          expect(typeof value, `${locale} ${p.id} → ${key}`).toBe('string');
          expect((value as string).trim(), `${locale} ${p.id} → ${key}`).not.toBe('');
        }
      }
    }
  });

  it('never points two placements at the same copy', () => {
    // Two surfaces sharing a heading means one of them is making an argument
    // that was written for somewhere else, which is the failure this whole
    // table exists to prevent.
    const keys = sofiaPlacements.map((p) => p.titleKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps the standing promise out of the per-page copy', () => {
    // `sofia.limits` is the one line that must be true on every page, so it is
    // shared and must not name a scheduler, form or section that only exists
    // on one of them.
    for (const [locale, messages] of Object.entries(locales)) {
      const limits = at(messages, 'sofia.limits') as string;
      expect(typeof limits, locale).toBe('string');
      expect(limits, locale).not.toMatch(/on this page|de esta página/i);
    }
  });
});
