import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo/metadata';
import { faqCategories } from '@/lib/faq';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'faq' });
  return pageMetadata({ locale, path: '/faq', title: t('title'), description: t('metaDescription') });
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'faq' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqCategories.flatMap((c) =>
      c.items.map((id) => ({
        '@type': 'Question',
        name: t(`items.${id}.q`),
        acceptedAnswer: { '@type': 'Answer', text: t(`items.${id}.a`) },
      })),
    ),
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
      <p className="mt-3 text-lg text-ink-muted">{t('intro')}</p>

      {faqCategories.map((c) => (
        <section key={c.id} className="mt-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-accent">{t(`categories.${c.id}`)}</h2>
          <div className="mt-4 divide-y divide-hairline border-y border-hairline">
            {c.items.map((id) => (
              <details key={id} className="group py-4">
                <summary className="cursor-pointer list-none text-lg font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
                  {t(`items.${id}.q`)}
                </summary>
                <p className="mt-3 text-ink-muted">{t(`items.${id}.a`)}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
