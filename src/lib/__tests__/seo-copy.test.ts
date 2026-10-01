import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The words a results page shows, held to the lengths it shows them at.
 *
 * A crawl of the live sitemap on 2026-10-01 found 30 descriptions past 160
 * characters across the two languages (one ran 242 and was cut off at the
 * comma before its point), the insights index describing itself in 58, and
 * one title used by two pages. The checks read the sources rather than the
 * rendered pages because CI runs no browser: every description on the site
 * comes from a message key or an article's front matter, and both are here.
 */

const MIN = 70;
const MAX = 160;

const root = process.cwd();
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(root, 'messages', f), 'utf8'));
const locales = { en: read('en.json'), es: read('es.json') } as const;

type Tree = { [key: string]: unknown };
function flatten(tree: Tree, prefix: string[] = [], out: Record<string, string> = {}) {
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'string') out[[...prefix, key].join('.')] = value;
    else if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value as Tree, [...prefix, key], out);
  }
  return out;
}

// Every key the pages pass to pageMetadata as a description is named one of
// these ways (metaDescription, homeDescription, libraryMetaDescription, …).
const isDescriptionKey = (key: string) => /(^|\.)(metaDescription|description|\w+Description)$/.test(key);

function insightDescriptions(locale: string) {
  const dir = path.join(root, 'src', 'content', 'insights', locale);
  return fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')).map((file) => {
    const source = fs.readFileSync(path.join(dir, file), 'utf8');
    const match = source.match(/^\s*description:\s*(['"])(.*)\1,\s*$/m);
    return { file, description: match ? match[2].replace(/\\(['"])/g, '$1') : '' };
  });
}

describe.each(Object.entries(locales))('search snippets (%s)', (locale, messages) => {
  const flat = flatten(messages);

  it('keeps every page description between 70 and 160 characters', () => {
    const offenders = Object.entries(flat)
      .filter(([key]) => isDescriptionKey(key))
      .filter(([, value]) => value.length < MIN || value.length > MAX)
      .map(([key, value]) => `${key} (${value.length})`);
    expect(offenders).toEqual([]);
  });

  it('keeps every article description between 70 and 160 characters', () => {
    const posts = insightDescriptions(locale);
    expect(posts.length).toBeGreaterThan(0);
    const offenders = posts
      .filter((p) => p.description.length < MIN || p.description.length > MAX)
      .map((p) => `${p.file} (${p.description.length})`);
    expect(offenders).toEqual([]);
  });

  it('keeps every resource description, suffix included, within 160', () => {
    const { items, detailMetaSuffix } = messages.resources as { items: Record<string, { blurb: string }>; detailMetaSuffix: string };
    const offenders = Object.entries(items)
      .map(([slug, item]) => [slug, `${item.blurb} ${detailMetaSuffix}`.length] as const)
      .filter(([, length]) => length > MAX)
      .map(([slug, length]) => `${slug} (${length})`);
    expect(offenders).toEqual([]);
  });

  it('fits the home title, which carries the full brand name, in 60', () => {
    expect((messages.meta as { title: string }).title.length).toBeLessThanOrEqual(60);
  });

  it('gives the hours calculator a title of its own, not the article it shares a name with', () => {
    const { metaTitle } = messages.firstHourBack as { metaTitle: string };
    const article = insightDescriptions(locale).find((p) => p.file === 'find-your-first-hour-back.mdx');
    const articleSource = fs.readFileSync(path.join(root, 'src', 'content', 'insights', locale, article!.file), 'utf8');
    const articleTitle = articleSource.match(/^\s*title:\s*(['"])(.*)\1,\s*$/m)?.[2];
    expect(metaTitle).toBeTruthy();
    expect(articleTitle).toBeTruthy();
    expect(metaTitle).not.toBe(articleTitle);
  });
});
