import { describe, it, expect } from 'vitest';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { llmsTxt } from '../llms';
import { sitemapPaths } from '@/app/sitemap';
import { business } from '@/lib/seo/business';

const SITE = 'https://bis-rgv.com';
const txt = await llmsTxt({ siteUrl: SITE });
const linked = [...txt.matchAll(/\]\((https:\/\/bis-rgv\.com[^)]+)\)/g)].map((m) => m[1]);

describe('llms.txt', () => {
  it('opens with the company and a summary a model can quote', () => {
    expect(txt.startsWith(`# ${business.name} (BIS)`)).toBe(true);
    expect(txt).toContain('> An IT and AI consultancy in Harlingen, Texas');
    expect(txt).toContain(business.phone);
    expect(txt).toContain('English under /en and Spanish under /es');
  });

  it('links only to pages this site actually serves', () => {
    const known = new Set(sitemapPaths().map((p) => `${SITE}/en${p}`));
    const unknown = linked.filter((url) => !known.has(url));
    expect(unknown).toEqual([]);
  });

  it('lists every top-level page, so a model reading only this file is not missing one', () => {
    // Guards the same drift sitemap.test.ts guards: a new route under
    // src/app/[locale] that nobody remembered to announce.
    const dir = join(process.cwd(), 'src/app/[locale]');
    const routes = readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('[') && !e.name.startsWith('_'))
      .filter((e) => existsSync(join(dir, e.name, 'page.tsx')))
      .map((e) => `${SITE}/en/${e.name}`);
    const missing = routes.filter((url) => !linked.includes(url));
    expect(missing).toEqual([]);
  });

  it('names the sections a reader needs and the facts that are easy to get wrong', () => {
    expect(txt).toContain('## Start here');
    expect(txt).toContain('## Cities served');
    expect(txt).toContain('## Insights');
    expect(txt).toContain('does not publish fixed prices');
    expect(txt).toContain('Sofía');
  });

  it('names articles and guides by their real titles, not by their slugs', () => {
    // A slug-derived title ("Bilingual by design") is close enough to look
    // right and wrong enough to be quoted wrongly.
    expect(txt).toContain('[Small-Business Cybersecurity Guide]');
    expect(txt).not.toMatch(/\[[a-z0-9]+(-[a-z0-9]+)+\]/);
  });
});
