import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { CapabilityChips } from '@/components/marketing/CapabilityChips';
import { CTASection } from '@/components/ui/CTASection';
import { pageMetadata } from '@/lib/seo/metadata';
import { capabilityGroups, expertiseIds } from '@/lib/tech/capabilities';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'capabilities' });
  return pageMetadata({ locale, path: '/capabilities', title: t('title'), description: t('metaDescription') });
}

export default async function CapabilitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'capabilities' });
  const c = await getTranslations('common');

  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-4xl font-extrabold text-ink">{t('title')}</h1>
      <p className="mt-3 max-w-3xl text-ink-muted">{t('intro')}</p>

      <nav aria-label={t('indexLabel')} className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-y border-hairline py-4 text-sm">
        {capabilityGroups.map((g) => (
          <a key={g.id} href={`#${g.id}`} className="text-ink-muted hover:text-primary">{t(`groups.${g.id}`)}</a>
        ))}
      </nav>

      {capabilityGroups.map((g) => (
        <CapabilityChips key={g.id} id={g.id} heading={t(`groups.${g.id}`)} items={g.items} />
      ))}

      <CapabilityChips
        heading={t('expertiseHeading')}
        items={expertiseIds.map((id) => t(`expertise.${id}`))}
        emphatic
      />

      <div className="mt-16">
        <CTASection title={t('ctaTitle')} body={t('ctaBody')} cta={c('cta')} />
      </div>
    </main>
  );
}
