import fs from 'node:fs';
import path from 'node:path';
import type { ComponentType } from 'react';

export type Locale = 'en' | 'es';
export const CATEGORIES = ['Insights', 'Security', 'Culture', 'AI'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface PostMeta {
  slug: string;
  title: string;
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
