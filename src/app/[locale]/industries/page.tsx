import { setRequestLocale, getTranslations } from 'next-intl/server';

export default async function IndustriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nav');
  return <main data-testid="industries"><h1>{t('industries')}</h1></main>;
}
