import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { CredentialCard } from '@/components/marketing/CredentialCard';
import { MethodStep } from '@/components/marketing/MethodStep';
import { CTASection } from '@/components/ui/CTASection';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/about', title: t('aboutTitle'), description: t('aboutDescription') });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');
  const c = await getTranslations('common');
  const creds = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ title: t(`cred${n}Title`), body: t(`cred${n}Body`) }));
  const steps = [
    { index: '01', title: t('m1Title'), body: t('m1Body') },
    { index: '02', title: t('m2Title'), body: t('m2Body') },
    { index: '03', title: t('m3Title'), body: t('m3Body') },
    { index: '04', title: t('m4Title'), body: t('m4Body') },
  ];
  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">{t('kicker')}</p>
        <h1 className="mt-3 text-5xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-muted">{t('intro')}</p>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">{t('founderKicker')}</p>
        <h2 className="mt-2 text-3xl font-extrabold text-ink">{t('founderName')}</h2>
        <blockquote className="mt-4 text-xl font-medium text-ink">“{t('founderQuote')}”</blockquote>
        <p className="mt-4 text-ink-muted">{t('founderBio')}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="mb-6 text-xs font-bold uppercase tracking-widest text-accent">{t('credKicker')}</p>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {creds.map((cr) => <CredentialCard key={cr.title} {...cr} />)}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">{t('methodKicker')}</p>
        {steps.map((s) => <MethodStep key={s.index} {...s} />)}
      </section>

      <CTASection title={t('ctaTitle')} body={t('ctaBody')} cta={c('cta')} />
    </main>
  );
}
