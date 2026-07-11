import { describe, it, expect } from 'vitest';
import { allSlugs, missingTranslations, sortByDateDesc } from '../index';

describe('insights content library', () => {
  it('has both language files for every post (parity)', () => {
    expect(missingTranslations()).toEqual([]);
  });

  it('lists the seeded slug', () => {
    expect(allSlugs()).toContain('find-your-first-hour-back');
  });

  it('sorts posts by date descending', () => {
    const sorted = sortByDateDesc([
      { date: '2026-01-01', slug: 'a' },
      { date: '2026-03-01', slug: 'b' },
      { date: '2026-02-01', slug: 'c' },
    ]);
    expect(sorted.map((p) => p.slug)).toEqual(['b', 'c', 'a']);
  });
});
