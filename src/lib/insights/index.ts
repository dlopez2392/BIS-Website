import fs from 'node:fs';
import path from 'node:path';
import type { ComponentType } from 'react';

export type Locale = 'en' | 'es';
export const CATEGORIES = ['Insights', 'Security', 'Culture', 'AI'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface PostMeta {
  slug: string;
  title: string;
  /** The title a results page shows, when `title` (the H1) runs past what
   *  Google displays: 60 characters INCLUDING the layout's " · BIS". */
  seoTitle?: string;
  description: string;
  category: Category;
  date: string; // 'YYYY-MM-DD'
  readingMinutes: number;
}

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'insights');

function slugsFor(locale: Locale): string[] {
  const dir = path.join(CONTENT_DIR, locale);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, ''));
}

export function allSlugs(): string[] {
  return [...new Set([...slugsFor('en'), ...slugsFor('es')])].sort();
}

/**
 * A post's `date`, read straight from its source without importing the MDX,
 * for callers that must stay synchronous (the sitemap). `null` when the file
 * or the field is missing, so a caller omits the date rather than invent one.
 */
export function postDate(locale: Locale, slug: string): string | null {
  const file = path.join(CONTENT_DIR, locale, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const match = fs.readFileSync(file, 'utf8').match(/^\s*date:\s*['"](\d{4}-\d{2}-\d{2})['"]/m);
  return match ? match[1] : null;
}

export function missingTranslations(): { slug: string; missing: Locale }[] {
  const en = new Set(slugsFor('en'));
  const es = new Set(slugsFor('es'));
  const out: { slug: string; missing: Locale }[] = [];
  for (const s of allSlugs()) {
    if (!en.has(s)) out.push({ slug: s, missing: 'en' });
    if (!es.has(s)) out.push({ slug: s, missing: 'es' });
  }
  return out;
}

export function sortByDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function formatDate(locale: Locale, iso: string): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' })
    .format(new Date(`${iso}T00:00:00`));
}

interface MdxModule {
  default: ComponentType;
  metadata: Omit<PostMeta, 'slug'>;
}

async function importPost(locale: Locale, slug: string): Promise<MdxModule | null> {
  try {
    return (await import(`@/content/insights/${locale}/${slug}.mdx`)) as MdxModule;
  } catch {
    return null;
  }
}

export async function listPosts(locale: Locale): Promise<PostMeta[]> {
  const metas = await Promise.all(
    slugsFor(locale).map(async (slug) => {
      const mod = await importPost(locale, slug);
      return mod ? { slug, ...mod.metadata } : null;
    }),
  );
  return sortByDateDesc(metas.filter((m): m is PostMeta => m !== null));
}

export async function getPost(
  locale: Locale,
  slug: string,
): Promise<{ Content: ComponentType; meta: PostMeta } | null> {
  const mod = await importPost(locale, slug);
  if (!mod) return null;
  return { Content: mod.default, meta: { slug, ...mod.metadata } };
}
