import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo/metadata';
import { getPost, allSlugs, formatDate } from '@/lib/insights';

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; slug: string }> },
): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(locale as 'en' | 'es', slug);
  if (!post) return {};
  return pageMetadata({ locale, path: `/insights/${slug}`, title: post.meta.title, description: post.meta.description });
}

export default async function InsightPostPage(
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as 'en' | 'es';
  const post = await getPost(loc, slug);
  if (!post) notFound();
  const { Content, meta } = post;
  const t = await getTranslations({ locale, namespace: 'insights' });

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <Link href="/insights" className="text-sm text-primary hover:underline">{t('backToInsights')}</Link>
      <p className="mt-8 text-xs font-bold uppercase tracking-widest text-gold">{t(`categories.${meta.category}`)}</p>
      <h1 className="mt-3 text-4xl font-extrabold leading-tight text-ink">{meta.title}</h1>
      <p className="mt-3 text-sm text-ink-muted">
        {formatDate(loc, meta.date)} · {t('minRead', { minutes: meta.readingMinutes })}
      </p>
      <article className="mt-8">
        <Content />
      </article>
    </main>
  );
}
