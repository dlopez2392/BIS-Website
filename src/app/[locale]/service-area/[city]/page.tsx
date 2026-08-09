import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, BUSINESS_ID } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { CallLink } from '@/components/layout/CallLink';
import { cityPages, getCity, type CitySector } from '@/lib/cities';

export function generateStaticParams() {
  return cityPages.map((c) => ({ city: c.id }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; city: string }> },
): Promise<Metadata> {
  const { locale, city } = await params;
  if (!getCity(city)) return {};
  const t = await getTranslations({ locale, namespace: 'cities' });
  return pageMetadata({
    locale,
    path: `/service-area/${city}`,
    title: t(`${city}.metaTitle`),
    description: t(`${city}.metaDescription`),
  });
}

export default async function CityPage({ params }: { params: Promise<{ locale: string; city: string }> }) {
  const { locale, city } = await params;
  setRequestLocale(locale);
  const entry = getCity(city);
  if (!entry) notFound();

  const t = await getTranslations({ locale, namespace: 'cities' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });
  const tArea = await getTranslations({ locale, namespace: 'serviceArea' });
  const c = await getTranslations('common');
  const sectors = t.raw(`${city}.sectors`) as CitySector[];
  const others = cityPages.filter((o) => o.id !== entry.id);

  // Scoped to this city so each page claims its own service area rather than
  // repeating the sitewide list, and points back at the one business entity.
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: t(`${city}.metaTitle`),
    serviceType: 'IT & AI consulting',
    description: t(`${city}.metaDescription`),
    provider: { '@id': BUSINESS_ID },
    areaServed: { '@type': 'City', name: entry.name, containedInPlace: { '@type': 'Place', name: 'Rio Grande Valley' } },
    availableLanguage: ['English', 'Spanish'],
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <JsonLd data={serviceSchema} />
      <JsonLd
        data={breadcrumbSchema({
          locale,
          trail: [
            { name: tNav('home'), path: '/' },
            { name: tArea('title'), path: '/service-area' },
            { name: entry.name, path: `/service-area/${city}` },
          ],
        })}
      />

      <p className="text-xs font-bold uppercase tracking-widest text-accent">{t('shared.eyebrow')}</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">{t(`${city}.heading`)}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-muted">{t(`${city}.intro`)}</p>

      <section className="mt-14">
        <h2 className="text-2xl font-extrabold text-ink">{t('shared.sectorsHeading', { city: entry.name })}</h2>
        <div className="mt-6 space-y-6">
          {sectors.map((sector) => (
            <div key={sector.title} className="rounded-xl border border-hairline bg-surface-alt p-6 sm:p-8">
              <h3 className="text-xl font-bold text-ink">{sector.title}</h3>
              <p className="mt-2 text-ink-muted">{sector.body}</p>
            </div>
          ))}
        </div>
        <Link href="/services" className="mt-6 inline-block text-primary hover:underline">
          {t('shared.servicesLink')} →
        </Link>
      </section>

      <section className="mt-14 rounded-xl border border-hairline bg-surface-alt p-8">
        <h2 className="text-2xl font-bold text-ink">{t('shared.howHeading')}</h2>
        <p className="mt-3 text-ink-muted">{t(`${city}.howBody`)}</p>
      </section>

      <section className="mt-8 rounded-xl border border-hairline bg-primary/5 p-8">
        <h2 className="text-2xl font-bold text-ink">{t('shared.provenHeading')}</h2>
        <p className="mt-3 text-ink-muted">{t('shared.provenBody')}</p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <CallLink className="inline-flex items-center gap-3 rounded-lg bg-primary px-5 py-3 text-lg font-extrabold text-on-primary" />
          <Link href="/work" className="text-primary hover:underline">{t('shared.provenLink')} →</Link>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-extrabold text-ink">{t('shared.ctaTitle', { city: entry.name })}</h2>
        <p className="mt-2 text-ink-muted">{t('shared.ctaBody')}</p>
        <Link href="/contact" className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-bold text-on-primary">
          {c('cta')}
        </Link>
      </section>

      <nav className="mt-16 border-t border-hairline pt-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted">{t('shared.otherCitiesHeading')}</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {others.map((o) => (
            <li key={o.id}>
              <Link
                href={`/service-area/${o.id}`}
                className="inline-block rounded-full border border-hairline bg-surface-alt px-4 py-1.5 text-sm font-medium text-ink hover:border-primary hover:text-primary"
              >
                {o.name}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/service-area" className="mt-4 inline-block text-sm text-primary hover:underline">
          {t('shared.backToAll')} →
        </Link>
      </nav>
    </main>
  );
}
