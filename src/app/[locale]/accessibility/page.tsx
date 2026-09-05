import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo/metadata';
import { CallLink } from '@/components/layout/CallLink';
import { business } from '@/lib/seo/business';

/**
 * The date the statement describes. A statement that carries "last reviewed"
 * and then ages silently is worse than none, so this is the date the claims
 * on the page were last verified against the automated suite, and it is bumped
 * deliberately rather than generated from the build clock.
 */
const STATEMENT_DATE = '2026-09-05';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'accessibility' });
  return pageMetadata({ locale, path: '/accessibility', title: t('title'), description: t('metaDescription') });
}

export default async function AccessibilityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'accessibility' });
  const formattedDate = new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(`${STATEMENT_DATE}T00:00:00`));

  const practices = ['practice1', 'practice2', 'practice3', 'practice4', 'practice5'] as const;

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
      <p className="mt-4 text-lg text-ink-muted">{t('intro')}</p>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-ink">{t('statusHeading')}</h2>
        <p className="mt-3 text-ink-muted">{t('statusBody')}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-ink">{t('honestHeading')}</h2>
        <p className="mt-3 text-ink-muted">{t('honestBody')}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-ink">{t('practicesHeading')}</h2>
        <ul className="mt-4 divide-y divide-hairline border-y border-hairline">
          {practices.map((key) => (
            <li key={key} className="py-4 text-ink-muted">{t(key)}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-md bg-surface-alt p-6">
        <h2 className="text-2xl font-bold text-ink">{t('problemHeading')}</h2>
        <p className="mt-3 text-ink-muted">{t('problemBody')}</p>
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          <a href={`mailto:${business.email}`} className="text-link underline">{business.email}</a>
          <CallLink className="text-link underline" />
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-ink">{t('helpHeading')}</h2>
        <p className="mt-3 text-ink-muted">{t('helpBody')}</p>
        <Link
          href="/contact"
          className="mt-4 inline-block rounded-md bg-primary px-6 py-3 font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        >
          {t('helpCta')}
        </Link>
      </section>

      <section className="mt-12 border-t border-hairline pt-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-accent">{t('updatedHeading')}</h2>
        <p className="mt-2 text-sm text-ink-muted">
          {t('updatedBody', { date: formattedDate })}
        </p>
      </section>
    </main>
  );
}
