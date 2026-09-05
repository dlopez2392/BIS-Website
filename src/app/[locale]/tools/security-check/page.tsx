import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo/metadata';
import { SecurityCheckForm } from '@/components/scan/SecurityCheckForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'securityCheck' });
  return pageMetadata({ locale, path: '/tools/security-check', title: t('title'), description: t('metaDescription') });
}

export default async function SecurityCheckPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'securityCheck' });

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
      <p className="mt-3 text-lg text-ink-muted">{t('intro')}</p>
      <SecurityCheckForm />
    </main>
  );
}
