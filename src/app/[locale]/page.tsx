import { setRequestLocale, getTranslations } from 'next-intl/server';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nav');
  return <main data-testid="home"><h1>{t('home')}</h1></main>;
}
