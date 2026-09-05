import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { IndustryCard } from '@/components/marketing/IndustryCard';
import { industryPages } from '@/lib/industries';
import { CTASection } from '@/components/ui/CTASection';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/industries', title: t('industriesTitle'), description: t('industriesDescription') });
}

export default async function IndustriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('industries');
  const c = await getTranslations('common');
  // Card copy is keyed off the same list the detail pages are generated from,
  // so a sixth industry cannot appear here without a page behind it.
  const CARD_KEYS = {
    legal: { title: 'legalTitle', body: 'legalBody' },
    medical: { title: 'medTitle', body: 'medBody' },
    logistics: { title: 'logTitle', body: 'logBody' },
    trades: { title: 'tradesTitle', body: 'tradesBody' },
    agriculture: { title: 'agTitle', body: 'agBody' },
  } as const;
  const cards = industryPages.map((i) => ({
    label: t(i.labelKey),
    title: t(CARD_KEYS[i.id].title),
    body: t(CARD_KEYS[i.id].body),
    href: `/industries/${i.id}`,
  }));
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
