import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo/metadata';
import { business } from '@/lib/seo/business';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'serviceArea' });
  return pageMetadata({ locale, path: '/service-area', title: t('title'), description: t('metaDescription') });
}

export default async function ServiceAreaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'serviceArea' });
  const c = await getTranslations('common');
  const cities = business.areaServed.filter((a) => a !== 'Rio Grande Valley');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'IT & AI consulting',
    provider: { '@type': 'ProfessionalService', name: business.name, url: business.url },
    areaServed: business.areaServed.map((name) => ({ '@type': 'City', name })),
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-xs font-bold uppercase tracking-widest text-accent">{t('title')}</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">{t('heading')}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-muted">{t('intro')}</p>

      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted">{t('citiesHeading')}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {cities.map((city) => (
            <span key={city} className="rounded-full border border-hairline bg-surface-alt px-4 py-1.5 text-sm font-medium text-ink">{city}</span>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-hairline bg-surface-alt p-8">
        <h2 className="text-2xl font-bold text-ink">{t('whyLocalHeading')}</h2>
        <p className="mt-3 text-ink-muted">{t('whyLocalBody')}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-ink">{t('ctaTitle')}</h2>
        <p className="mt-2 text-ink-muted">{t('ctaBody')}</p>
        <a href={`/${locale}/contact`} className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-bold text-on-primary">{c('cta')}</a>
      </section>
    </main>
  );
}
