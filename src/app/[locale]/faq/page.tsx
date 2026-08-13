import type { Metadata } from 'next';
import { ChevronDown } from 'lucide-react';
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
              // The native marker is hidden, so the chevron IS the only signal a
              // question opens. It rotates on open and is aria-hidden — <details>
              // already announces expanded/collapsed to assistive tech.
              <details key={id} className="group/faq py-4">
                <summary className="group/q flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-ink marker:content-none hover:text-link focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link motion-safe:transition [&::-webkit-details-marker]:hidden">
                  <span>{t(`items.${id}.q`)}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className="size-5 shrink-0 text-ink-muted group-hover/q:text-link group-open/faq:rotate-180 motion-safe:transition motion-safe:duration-200"
                  />
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
