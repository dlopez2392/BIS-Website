import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, BUSINESS_ID } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { CTASection } from '@/components/ui/CTASection';
import { industryPages, getIndustry, type IndustryWorkflow, type IndustryQuestion } from '@/lib/industries';
import { cityPages } from '@/lib/cities';

export function generateStaticParams() {
  return industryPages.map((i) => ({ industry: i.id }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; industry: string }> },
): Promise<Metadata> {
  const { locale, industry } = await params;
  if (!getIndustry(industry)) return {};
  const t = await getTranslations({ locale, namespace: 'industries' });
  return pageMetadata({
    locale,
    path: `/industries/${industry}`,
    title: t(`pages.${industry}.metaTitle`),
    description: t(`pages.${industry}.metaDescription`),
  });
}

export default async function IndustryPage(
  { params }: { params: Promise<{ locale: string; industry: string }> },
) {
  const { locale, industry } = await params;
  setRequestLocale(locale);
  const entry = getIndustry(industry);
  if (!entry) notFound();

  const t = await getTranslations({ locale, namespace: 'industries' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });
  const c = await getTranslations('common');
  const workflows = t.raw(`pages.${industry}.workflows`) as IndustryWorkflow[];
  const questions = t.raw(`pages.${industry}.faq`) as IndustryQuestion[];
  const others = industryPages.filter((o) => o.id !== entry.id);

  // Scoped to this industry so each page claims the work it actually describes
  // rather than repeating the sitewide service list, and points back at the
  // one business entity — the same shape the city pages use.
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: t(`pages.${industry}.metaTitle`),
    serviceType: 'IT & AI consulting',
    description: t(`pages.${industry}.metaDescription`),
    provider: { '@id': BUSINESS_ID },
    areaServed: { '@type': 'Place', name: 'Rio Grande Valley' },
    availableLanguage: ['English', 'Spanish'],
  };

  // The questions are the page's most quotable part, so they are marked up as
  // questions rather than left as prose an answer engine has to infer.
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <main>
      <JsonLd data={serviceSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd
        data={breadcrumbSchema({
          locale,
          trail: [
            { name: tNav('home'), path: '/' },
            { name: t('shared.eyebrow'), path: '/industries' },
            { name: t(entry.labelKey), path: `/industries/${entry.id}` },
          ],
        })}
      />

      <section className="mx-auto max-w-4xl px-6 pt-20">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">{t(entry.labelKey)}</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">{t(`pages.${industry}.heading`)}</h1>
        <p className="mt-4 text-lg text-ink-muted">{t(`pages.${industry}.intro`)}</p>
      </section>

      <section className="mx-auto max-w-4xl px-6 pt-14">
        <h2 className="text-xs font-bold uppercase tracking-widest text-accent">{t('shared.workHeading')}</h2>
        <div className="mt-4 divide-y divide-hairline border-y border-hairline">
          {workflows.map((w) => (
            <div key={w.title} className="py-6">
              <h3 className="text-xl font-bold text-ink">{w.title}</h3>
              <p className="mt-2 text-ink-muted">{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pt-14">
        <h2 className="text-xs font-bold uppercase tracking-widest text-accent">{t('shared.sofiaHeading')}</h2>
        <p className="mt-4 rounded-md bg-surface-alt p-6 text-ink">{t(`pages.${industry}.sofia`)}</p>
        <p className="mt-3 text-sm">
          <Link href="/work" className="text-link underline">{t('shared.sofiaLink')}</Link>
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-6 pt-14">
        <h2 className="text-xs font-bold uppercase tracking-widest text-accent">{t('shared.faqHeading')}</h2>
        <dl className="mt-4 divide-y divide-hairline border-y border-hairline">
          {questions.map((item) => (
            <div key={item.q} className="py-6">
              <dt className="text-lg font-semibold text-ink">{item.q}</dt>
              <dd className="mt-2 text-ink-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-4xl px-6 pt-14">
        <h2 className="text-xs font-bold uppercase tracking-widest text-accent">{t('shared.othersHeading')}</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {others.map((o) => (
            <li key={o.id}>
              <Link
                href={`/industries/${o.id}`}
                className="inline-block rounded-full border border-hairline px-4 py-2 text-sm text-ink hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
              >
                {t(o.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-4xl px-6 pt-14">
        <h2 className="text-xs font-bold uppercase tracking-widest text-accent">{t('shared.citiesHeading')}</h2>
        <p className="mt-3 text-ink-muted">{t('shared.citiesBody')}</p>
        <ul className="mt-4 flex flex-wrap gap-3">
          {cityPages.map((city) => (
            <li key={city.id}>
              <Link
                href={`/service-area/${city.id}`}
                className="inline-block rounded-full border border-hairline px-4 py-2 text-sm text-ink hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
              >
                {city.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <CTASection title={t('shared.ctaTitle')} body={t('shared.ctaBody')} cta={c('cta')} />
    </main>
  );
}
