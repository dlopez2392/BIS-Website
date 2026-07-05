import { setRequestLocale, getTranslations } from 'next-intl/server';

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nav');
  return <main data-testid="services"><h1>{t('services')}</h1></main>;
}
