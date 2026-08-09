import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sitemap, { sitemapPaths } from '@/app/sitemap';
import { routing } from '@/i18n/routing';
import { allSlugs } from '@/lib/insights';
import { resources } from '@/lib/resources';

const APP_DIR = path.join(process.cwd(), 'src', 'app', '[locale]');

/** Route directories that actually exist on disk, ignoring dynamic segments. */
function staticRouteDirs(): string[] {
  return fs
    .readdirSync(APP_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('[') && !d.name.startsWith('_'))
    .map((d) => d.name);
}

describe('sitemap', () => {
  const paths = sitemapPaths();

  it('lists every static page that exists on disk', () => {
    for (const dir of staticRouteDirs()) {
      expect(paths, `/${dir} is a real page but is missing from the sitemap`).toContain(`/${dir}`);
    }
  });

  it('lists the home page', () => {
    expect(paths).toContain('');
  });

  it('lists no path without a page behind it', () => {
    const known = new Set(staticRouteDirs().map((d) => `/${d}`));
    for (const p of paths) {
      if (p === '' || p.split('/').length > 2) continue; // home, or a content route
      expect(known.has(p), `${p} is in the sitemap but has no page directory`).toBe(true);
    }
  });

  it('lists every insights post', () => {
    for (const slug of allSlugs()) expect(paths).toContain(`/insights/${slug}`);
  });

  it('lists every resource', () => {
    for (const r of resources) expect(paths).toContain(`/resources/${r.slug}`);
  });

  it('emits one absolute, locale-prefixed entry per path per locale', () => {
    const entries = sitemap();
    expect(entries).toHaveLength(paths.length * routing.locales.length);
    for (const entry of entries) {
      expect(entry.url).toMatch(/^https?:\/\/[^/]+\/(en|es)(\/|$)/);
      expect(Object.keys(entry.alternates?.languages ?? {}).sort()).toEqual([...routing.locales].sort());
    }
  });

  it('has no duplicate urls', () => {
    const urls = sitemap().map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
