import { describe, it, expect, beforeEach, vi } from 'vitest';

const { listPostsMock } = vi.hoisted(() => ({ listPostsMock: vi.fn() }));

vi.mock('@/lib/insights', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/insights')>();
  return { ...actual, listPosts: listPostsMock };
});

import { getSiteContext, __resetSiteContextCache } from '../site-context';

describe('getSiteContext', () => {
  beforeEach(() => {
    listPostsMock.mockReset();
    __resetSiteContextCache();
  });

  it('warns once when a locale has no posts, and does not warn again on a cached hit', async () => {
    listPostsMock.mockResolvedValue([]);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const first = await getSiteContext('en');
    const second = await getSiteContext('en'); // served from cache — must not rebuild or re-warn

    expect(first).toContain('No articles published yet.');
    expect(second).toBe(first);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/no posts found for locale "en"/);

    warnSpy.mockRestore();
  });

  it('does not warn when posts are present', async () => {
    listPostsMock.mockResolvedValue([
      {
        slug: 'find-your-first-hour-back',
        title: 'Find your first hour back',
        description: 'desc',
        category: 'AI',
        date: '2026-07-10',
        readingMinutes: 4,
      },
    ]);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await getSiteContext('es');

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('caches a build failure so the next call re-throws without rebuilding', async () => {
    listPostsMock.mockRejectedValue(new Error('boom: listPosts unavailable'));

    await expect(getSiteContext('en')).rejects.toThrow('boom: listPosts unavailable');
    await expect(getSiteContext('en')).rejects.toThrow('boom: listPosts unavailable');

    // Only the first call should have actually invoked listPosts — the second
    // call must be served from the cached failure sentinel, not a rebuild.
    expect(listPostsMock).toHaveBeenCalledTimes(1);
  });
});
