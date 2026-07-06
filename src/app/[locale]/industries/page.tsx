import { setRequestLocale, getTranslations } from 'next-intl/server';
import { IndustryCard } from '@/components/marketing/IndustryCard';
import { CTASection } from '@/components/ui/CTASection';

export default async function IndustriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('industries');
  const c = await getTranslations('common');
  const cards = [
    { label: t('legalLabel'), title: t('legalTitle'), body: t('legalBody') },
    { label: t('medLabel'), title: t('medTitle'), body: t('medBody') },
    { label: t('logLabel'), title: t('logTitle'), body: t('logBody') },
    { label: t('tradesLabel'), title: t('tradesTitle'), body: t('tradesBody') },
    { label: t('agLabel'), title: t('agTitle'), body: t('agBody') },
  ];
  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-10">
        <h1 className="text-5xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-muted">{t('intro')}</p>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((c2) => <IndustryCard key={c2.label} {...c2} />)}
        </div>
      </section>
      <CTASection title={t('ctaTitle')} body={t('ctaBody')} cta={c('cta')} />
    </main>
  );
}
