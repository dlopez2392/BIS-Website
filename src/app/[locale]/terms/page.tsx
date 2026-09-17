import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo/metadata';
import { CallLink } from '@/components/layout/CallLink';
import { business } from '@/lib/seo/business';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'terms' });
  return pageMetadata({ locale, path: '/terms', title: t('title'), description: t('metaDescription') });
}

/**
 * Terms & Conditions.
 *
 * This page exists for two readers at once. One is a customer, who gets the
 * site's usual plain voice. The other is a carrier reviewer: A2P 10DLC
 * campaign vetting requires a terms page AND a privacy policy, both reachable
 * as real links, and it reads the text-message section for a specific set of
 * disclosures — who sends, what is sent, how often, that rates may apply,
 * STOP, HELP, and that carriers are not liable for undelivered messages.
 * That is why `smsItems` is a list rather than prose: each item is one
 * disclosure, so a missing one is visible instead of buried in a paragraph.
 *
 * The SMS section is rendered ABOVE the generic ones for the same reason the
 * privacy policy's is — a reviewer scanning for it should not have to.
 */
export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'terms' });
  const smsItems = t.raw('smsItems') as string[];

  // Heading/body-only sections, in render order, after the SMS block.
  const proseSections = ['ai', 'ip', 'liability', 'law', 'changes'] as const;

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
      <p className="mt-2 text-sm text-ink-muted">{t('lastUpdated')}</p>
      <p className="mt-6 text-ink-muted">{t('intro')}</p>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-ink">{t('siteHeading')}</h2>
        <p className="mt-2 text-ink-muted">{t('siteBody')}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-ink">{t('servicesHeading')}</h2>
        <p className="mt-2 text-ink-muted">{t('servicesBody')}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-ink">{t('smsHeading')}</h2>
        <p className="mt-2 text-ink-muted">{t('smsIntro')}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-muted">
          {smsItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p className="mt-3 text-ink-muted">
          <Link href="/privacy" className="text-link underline">{t('privacyLink')}</Link>
        </p>
      </section>

      {proseSections.map((id) => (
        <section key={id} className="mt-8">
          <h2 className="text-xl font-bold text-ink">{t(`${id}Heading`)}</h2>
          <p className="mt-2 text-ink-muted">{t(`${id}Body`)}</p>
        </section>
      ))}

      <section className="mt-10 rounded-md bg-surface-alt p-6">
        <h2 className="text-xl font-bold text-ink">{t('contactHeading')}</h2>
        <p className="mt-2 text-ink-muted">{t('contactBody')}</p>
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          <a href={`mailto:${business.email}`} className="text-link underline">{business.email}</a>
          <CallLink className="text-link underline" />
        </p>
      </section>
    </main>
  );
}
