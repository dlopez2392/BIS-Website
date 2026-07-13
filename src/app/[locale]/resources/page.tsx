import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo/metadata';
import { resources } from '@/lib/resources';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'resources' });
  return pageMetadata({ locale, path: '/resources', title: t('libraryTitle'), description: t('libraryMetaDescription') });
}

export default async function ResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'resources' });

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t('libraryTitle')}</h1>
      <p className="mt-3 text-lg text-ink-muted">{t('libraryIntro')}</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {resources.map((r) => (
          <Link key={r.slug} href={`/resources/${r.slug}`} className="group block rounded-xl border border-hairline bg-surface-alt p-6 transition hover:border-primary">
            <h2 className="text-xl font-bold text-ink group-hover:text-primary">{t(`items.${r.slug}.title`)}</h2>
            <p className="mt-2 text-sm text-ink-muted">{t(`items.${r.slug}.blurb`)}</p>
            <p className="mt-4 text-sm font-semibold text-accent">{t('getLabel')} →</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
