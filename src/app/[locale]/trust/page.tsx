import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ShieldCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo/metadata';
import { business } from '@/lib/seo/business';
import { TalkToSofia } from '@/components/sofia/TalkToSofia';

/**
 * The date this page's claims were last checked against how BIS actually
 * works. A constant that is bumped deliberately, not a build timestamp: a
 * trust page that quietly re-dates itself on every deploy is claiming a review
 * that never happened, which is the exact failure it exists to argue against.
 */
const REVIEWED = '2026-09-06';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'trust' });
  return pageMetadata({ locale, path: '/trust', title: t('title'), description: t('metaDescription') });
}

/** A plain prose section. Most of this page is a question answered. */
function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 border-t border-hairline pt-8">
      <h2 className="text-2xl font-bold text-ink">{heading}</h2>
      <div className="mt-3 space-y-3 text-ink-muted">{children}</div>
    </section>
  );
}

export default async function TrustPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'trust' });
  const vendors = t.raw('vendorsItems') as string[];
  const controls = t.raw('siteItems') as string[];
  const reviewed = new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(`${REVIEWED}T00:00:00`));

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
      <p className="mt-4 text-lg text-ink-muted">{t('intro')}</p>

      {/* Deliberately the first thing after the intro. A trust page that opens
          by listing what it cannot claim is the only kind worth reading. */}
      <div className="mt-8 rounded-md bg-surface-alt p-6">
        <h2 className="font-bold text-ink">{t('notHeading')}</h2>
        <p className="mt-2 text-ink-muted">{t('notBody')}</p>
      </div>

      <Section heading={t('accessHeading')}><p>{t('accessBody')}</p></Section>
      <Section heading={t('ownershipHeading')}><p>{t('ownershipBody')}</p></Section>

      <Section heading={t('vendorsHeading')}>
        <p>{t('vendorsIntro')}</p>
        <ul className="space-y-2 border-y border-hairline py-4">
          {vendors.map((item) => (
            <li key={item} className="grid grid-cols-[6px_minmax(0,1fr)] gap-3">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p>{t('vendorsOutro')}</p>
      </Section>

      <Section heading={t('sofiaHeading')}>
        <p>{t('sofiaBody')}</p>
        {/* Directly under the claim it proves. This page tells a visitor that
            an AI answers our real line; the button lets them check that
            sentence in the same breath, without dialling or trusting us. */}
        <div className="mt-6 not-prose"><TalkToSofia /></div>
      </Section>
      <Section heading={t('regulatedHeading')}><p>{t('regulatedBody')}</p></Section>

      <Section heading={t('siteHeading')}>
        <p>{t('siteIntro')}</p>
        <ul className="space-y-3 border-y border-hairline py-4">
          {controls.map((item) => (
            <li key={item} className="flex gap-3">
              <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none text-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {/* The claim and the way to check it, side by side. */}
        <p>
          <Link href="/tools/security-check" className="font-semibold text-link underline">
            {t('siteCta')}
          </Link>
        </p>
      </Section>

      <Section heading={t('incidentHeading')}>
        <p>{t('incidentBody')}</p>
        <p>
          <a href={`mailto:${business.email}`} className="font-semibold text-link underline">
            {t('incidentCta')}
          </a>
        </p>
      </Section>

      <Section heading={t('exitHeading')}><p>{t('exitBody')}</p></Section>

      <section className="mt-12 border-t border-hairline pt-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-accent">{t('updatedHeading')}</h2>
        <p className="mt-2 text-sm text-ink-muted">{t('updatedBody', { date: reviewed })}</p>
      </section>
    </main>
  );
}
