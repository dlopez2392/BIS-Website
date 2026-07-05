import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ServiceGroup } from '@/components/marketing/ServiceGroup';
import { CTASection } from '@/components/ui/CTASection';

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('services');
  const c = await getTranslations('common');
  const groups = [
    { title: t('g1Title'), body: t('g1Body'), proof: t('g1Proof'), bullets: t.raw('g1Bullets') as string[] },
    { title: t('g2Title'), body: t('g2Body'), proof: t('g2Proof'), bullets: t.raw('g2Bullets') as string[] },
    { title: t('g3Title'), body: t('g3Body'), proof: t('g3Proof'), bullets: t.raw('g3Bullets') as string[] },
  ];
  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-6">
        <h1 className="text-5xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-muted">{t('intro')}</p>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-12">
        {groups.map((g) => <ServiceGroup key={g.title} {...g} />)}
      </section>
      <CTASection title={t('ctaTitle')} body={t('ctaBody')} cta={c('cta')} />
    </main>
  );
}
