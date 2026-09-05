import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo/metadata';
import { FirstHourBack } from '@/components/estimate/FirstHourBack';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'firstHourBack' });
  return pageMetadata({ locale, path: '/tools/first-hour-back', title: t('title'), description: t('metaDescription') });
}

export default async function FirstHourBackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'firstHourBack' });

  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-muted">{t('intro')}</p>
      <FirstHourBack />
    </main>
  );
}
