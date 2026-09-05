import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sitemap, { sitemapPaths } from '@/app/sitemap';
import { routing } from '@/i18n/routing';
import { allSlugs } from '@/lib/insights';
import { resources } from '@/lib/resources';
import { cityPages } from '@/lib/cities';
import { industryPages } from '@/lib/industries';

const APP_DIR = path.join(process.cwd(), 'src', 'app', '[locale]');

/**
 * Static page routes that actually exist on disk, ignoring dynamic segments.
 *
 * Walks nested directories rather than assuming every folder under [locale] is
 * itself a page: /tools holds /tools/security-check and has no page of its
 * own, and the old one-level version both demanded a sitemap entry for the
 * empty folder and would have missed the real page inside it.
 */
function staticRouteDirs(dir = APP_DIR, prefix = ''): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('[') || entry.name.startsWith('_')) continue;
    const route = `${prefix}${entry.name}`;
    if (fs.existsSync(path.join(dir, entry.name, 'page.tsx'))) out.push(route);
    out.push(...staticRouteDirs(path.join(dir, entry.name), `${route}/`));
  }
  return out;
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
    const dynamic = new Set([
      ...allSlugs().map((s) => `/insights/${s}`),
      ...resources.map((r) => `/resources/${r.slug}`),
      ...cityPages.map((c) => `/service-area/${c.id}`),
      ...industryPages.map((i) => `/industries/${i.id}`),
    ]);
    for (const p of paths) {
      if (p === '' || dynamic.has(p)) continue; // home, or a content route
      expect(known.has(p), `${p} is in the sitemap but has no page directory`).toBe(true);
    }
  });

  it('lists every insights post', () => {
    for (const slug of allSlugs()) expect(paths).toContain(`/insights/${slug}`);
  });

  it('lists every resource', () => {
    for (const r of resources) expect(paths).toContain(`/resources/${r.slug}`);
  });

  it('lists every city that has its own page', () => {
    for (const c of cityPages) expect(paths).toContain(`/service-area/${c.id}`);
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
