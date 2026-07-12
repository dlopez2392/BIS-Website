import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Brain, ShieldCheck, Code2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { CTASection } from '@/components/ui/CTASection';
import { ServiceCard } from '@/components/marketing/ServiceCard';
import { CapabilityBand } from '@/components/marketing/CapabilityBand';
import { Announcement } from '@/components/marketing/Announcement';
import { InsightCard } from '@/components/marketing/InsightCard';
import { TechMarquee } from '@/components/marketing/TechMarquee';
import { pageMetadata } from '@/lib/seo/metadata';
import { listPosts, formatDate } from '@/lib/insights';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/', title: t('homeTitle'), description: t('homeDescription') });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const c = await getTranslations('common');
  const it = await getTranslations({ locale, namespace: 'insights' });
  const latest = (await listPosts(locale as 'en' | 'es')).slice(0, 3);

  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight text-ink">{t('heroTitle')}</h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-muted">{t('heroBody')}</p>
        <Link href="/services" className="mt-8 inline-block rounded-md bg-primary px-6 py-3 font-bold text-on-primary">
          {t('heroCta')} &gt;
        </Link>
      </section>

      <TechMarquee locale={locale} />

      <Announcement kicker={t('announceKicker')} title={t('announceTitle')} body={t('announceBody')} />

      <CapabilityBand items={[t('capOnePoint'), t('capBilingual'), t('capSecurity'), t('capShip')]} />

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading title={t('servicesHeading')} />
        <div className="grid gap-6 md:grid-cols-3">
          <ServiceCard icon={Brain} title={t('svc1Title')} body={t('svc1Body')} href="/services" learnMore={c('learnMore')} />
          <ServiceCard icon={ShieldCheck} title={t('svc2Title')} body={t('svc2Body')} href="/services" learnMore={c('learnMore')} />
          <ServiceCard icon={Code2} title={t('svc3Title')} body={t('svc3Body')} href="/services" learnMore={c('learnMore')} />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <blockquote className="text-2xl font-medium text-ink">“{t('quote')}”</blockquote>
        <p className="mt-4 font-bold text-ink">{t('quoteName')}</p>
        <p className="text-sm text-ink-muted">{t('quoteRole')}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading title={t('insightsHeading')} />
        {latest.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {latest.map((p) => (
              <InsightCard
                key={p.slug}
                href={`/insights/${p.slug}`}
                category={it(`categories.${p.category}`)}
                title={p.title}
                date={formatDate(locale as 'en' | 'es', p.date)}
                minReadLabel={it('minRead', { minutes: p.readingMinutes })}
              />
            ))}
          </div>
        )}
      </section>

      <CTASection title={t('ctaTitle')} body={t('ctaBody')} cta={c('cta')} />
    </main>
  );
}
