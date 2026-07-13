import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'howWeWork' });
  return pageMetadata({ locale, path: '/how-we-work', title: t('title'), description: t('metaDescription') });
}

export default async function HowWeWorkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'howWeWork' });
  const c = await getTranslations('common');
  const steps = [1, 2, 3, 4] as const;

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-muted">{t('intro')}</p>

      <section className="mt-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-accent">{t('stepsHeading')}</h2>
        <ol className="mt-6 space-y-8">
          {steps.map((n) => (
            <li key={n} className="flex gap-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-extrabold text-primary">{n}</span>
              <div>
                <h3 className="text-xl font-bold text-ink">{t(`step${n}Title`)}</h3>
                <p className="mt-1 text-ink-muted">{t(`step${n}Body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 rounded-xl border border-hairline bg-surface-alt p-8">
        <h2 className="text-2xl font-bold text-ink">{t('pricingHeading')}</h2>
        <p className="mt-3 text-ink-muted">{t('pricingBody')}</p>
      </section>

      <section className="mt-8 rounded-xl border border-hairline bg-surface-alt p-8">
        <h2 className="text-2xl font-bold text-ink">{t('expectHeading')}</h2>
        <p className="mt-3 text-ink-muted">{t('expectBody')}</p>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-extrabold text-ink">{t('ctaTitle')}</h2>
        <p className="mt-2 text-ink-muted">{t('ctaBody')}</p>
        <Link href="/contact" className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-bold text-on-primary">{c('cta')}</Link>
      </section>
    </main>
  );
}
