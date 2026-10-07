import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo/metadata';
import { business, serviceAreaCities } from '@/lib/seo/business';
import { cityPages } from '@/lib/cities';
import { InlineBooking } from '@/components/platform/InlineBooking';
import { PageHeader } from '@/components/ui/PageHeader';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'serviceArea' });
  return pageMetadata({ locale, path: '/service-area', title: t('title'), description: t('metaDescription') });
}

export default async function ServiceAreaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'serviceArea' });
  const cities = serviceAreaCities;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'IT & AI consulting',
    provider: { '@type': 'ProfessionalService', name: business.name, url: business.url },
    areaServed: business.areaServed.map((name) => ({ '@type': 'City', name })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader art="headerPlace" kicker={t('title')} title={t('heading')} intro={t('intro')} width="4xl" />
      <div className="mx-auto max-w-4xl px-6 pb-20">
        <section className="mt-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted">{t('citiesHeading')}</h2>
          {/* Cities with their own page become links; the rest stay as plain
              chips rather than pointing at a page that does not exist. */}
          <div className="mt-4 flex flex-wrap gap-2">
            {cities.map((city) => {
              const page = cityPages.find((c) => c.name === city);
              const className = 'inline-block rounded-full border border-hairline bg-surface-alt px-4 py-1.5 text-sm font-medium';
              return page ? (
                <Link key={city} href={`/service-area/${page.id}`} className={`${className} text-ink hover:border-primary hover:text-link`}>
                  {city}
                </Link>
              ) : (
                <span key={city} className={`${className} text-ink`}>{city}</span>
              );
            })}
          </div>
        </section>

        <section className="mt-12 rounded-xl border border-hairline bg-surface-alt p-8">
          <h2 className="text-2xl font-bold text-ink">{t('whyLocalHeading')}</h2>
          <p className="mt-3 text-ink-muted">{t('whyLocalBody')}</p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-extrabold text-ink">{t('ctaTitle')}</h2>
          <p className="mt-2 text-ink-muted">{t('ctaBody')}</p>
          <InlineBooking className="mt-6 max-w-3xl" />
        </section>
      </div>
    </main>
  );
}
