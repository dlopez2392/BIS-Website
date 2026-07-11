import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { InsightCard } from '@/components/marketing/InsightCard';
import { pageMetadata } from '@/lib/seo/metadata';
import { listPosts, formatDate } from '@/lib/insights';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'insights' });
  return pageMetadata({ locale, path: '/insights', title: t('heading'), description: t('subheading') });
}

export default async function InsightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'insights' });
  const loc = locale as 'en' | 'es';
  const posts = await listPosts(loc);

  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-4xl font-extrabold text-ink">{t('heading')}</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">{t('subheading')}</p>
      {posts.length === 0 ? (
        <p className="mt-10 text-ink-muted">{t('emptyState')}</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {posts.map((p) => (
            <InsightCard
              key={p.slug}
              href={`/insights/${p.slug}`}
              category={t(`categories.${p.category}`)}
              title={p.title}
              date={formatDate(loc, p.date)}
              minReadLabel={t('minRead', { minutes: p.readingMinutes })}
            />
          ))}
        </div>
      )}
    </main>
  );
}
