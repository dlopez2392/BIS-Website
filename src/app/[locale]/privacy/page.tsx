import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacy' });
  return pageMetadata({ locale, path: '/privacy', title: t('title'), description: t('metaDescription') });
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'privacy' });
  const collectItems = t.raw('collectItems') as string[];
  const processorsItems = t.raw('processorsItems') as string[];
  const smsItems = t.raw('smsItems') as string[];

  // heading/body-only sections rendered (in order) after the processors list.
  const proseSections = ['cookies', 'retention', 'rights', 'children', 'changes', 'contact'] as const;

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
      <p className="mt-2 text-sm text-ink-muted">{t('lastUpdated')}</p>
      <p className="mt-6 text-ink-muted">{t('intro')}</p>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-ink">{t('collectHeading')}</h2>
        <p className="mt-2 text-ink-muted">{t('collectIntro')}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-muted">
          {collectItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-ink">{t('useHeading')}</h2>
        <p className="mt-2 text-ink-muted">{t('useBody')}</p>
      </section>

      {/* Its own section, ahead of the processor list, because this is the one
          part of this policy that is read by someone other than a customer.
          A2P 10DLC campaign vetting scans the privacy policy for a specific
          CTIA clause about mobile information and opt-in data, and a policy
          that only says "we do not sell your information" does not satisfy it
          — that sentence is about selling, and the carriers are asking about
          sharing. `smsSharingBody` carries their wording deliberately; do not
          paraphrase it into the house voice. The rest of the section is in
          plain language for the person who actually ticked the box. */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-ink">{t('smsHeading')}</h2>
        <p className="mt-2 text-ink-muted">{t('smsIntro')}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-muted">
          {smsItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p className="mt-3 text-ink-muted">{t('smsSharingBody')}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-ink">{t('processorsHeading')}</h2>
        <p className="mt-2 text-ink-muted">{t('processorsIntro')}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-muted">
          {processorsItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      {proseSections.map((id) => (
        <section key={id} className="mt-8">
          <h2 className="text-xl font-bold text-ink">{t(`${id}Heading`)}</h2>
          <p className="mt-2 text-ink-muted">{t(`${id}Body`)}</p>
        </section>
      ))}
    </main>
  );
}
