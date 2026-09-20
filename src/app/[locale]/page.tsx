import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Brain, ShieldCheck, Code2 } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { CTASection } from '@/components/ui/CTASection';
import { Hero } from '@/components/marketing/Hero';
import { ServiceCard } from '@/components/marketing/ServiceCard';
import { CapabilityBand } from '@/components/marketing/CapabilityBand';
import { Announcement } from '@/components/marketing/Announcement';
import { InsightCard } from '@/components/marketing/InsightCard';
import { ResourceCTA } from '@/components/marketing/ResourceCTA';
import { PlatformProof } from '@/components/marketing/PlatformProof';
import { heroShot } from '@/lib/platform-tour';
import { TalkToSofia } from '@/components/sofia/TalkToSofia';
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
  // Alt text and the sample-data caption live in the `platform` namespace
  // beside the capture they describe, not duplicated per page that shows one.
  const p = await getTranslations({ locale, namespace: 'platform' });
  const r = await getTranslations({ locale, namespace: 'resources' });
  const latest = (await listPosts(locale as 'en' | 'es')).slice(0, 3);

  return (
    <main>
      <Hero
        kicker={t('heroKicker')}
        title={t('heroTitle')}
        titleAccent={t('heroTitleAccent')}
        body={t('heroBody')}
        cta={t('heroCta')}
        cta2={t('heroCta2')}
        stats={[t('capOnePoint'), t('capBilingual'), t('capShip')]}
        /* The alt text and the sample-data caption come from the `platform`
           namespace beside the captures they describe, exactly as
           `PlatformProof` below takes them — one place to change when a
           capture is re-shot, not one per page that shows it. The dashboard
           gets its OWN alt, though: PlatformProof further down shows the
           uncropped capture with `alt.hero`, and two different images with
           one sentence is one sentence read twice. */
        stage={{
          copy: {
            dashboard: { label: p('stage.dashboard'), alt: p('alt.heroStage') },
            calls: { label: p('stage.calls'), alt: p('alt.calls') },
            pipeline: { label: p('stage.pipeline'), alt: p('alt.pipeline') },
            spanish: { label: p('stage.spanish'), alt: p('alt.spanish') },
          },
          note: p('sampleCaption'),
          tabsLabel: p('stage.tabsLabel'),
          pauseLabel: p('stage.pause'),
          resumeLabel: p('stage.resume'),
          first: locale === 'es' ? 'spanish' : 'dashboard',
        }}
      />

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

      {/* The product, once, on the way past. Placed AFTER the three service
          cards and before Sofía on purpose: the cards say what we do, this
          says the thing exists and is ours, and Sofía lets them try a piece
          of it. Moving it above the cards would have the page make a claim
          about software before saying what the company does. */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <PlatformProof
          shot={heroShot}
          alt={p('alt.hero')}
          caption={p('sampleCaption')}
          kicker={t('platformKicker')}
          title={t('platformTitle')}
          body={t('platformBody')}
          linkLabel={t('platformLink')}
        />
      </section>
      {/* Then Sofía — still on the far side of the services, not before them,
          with the band above her a beat of the same argument rather than a
          new subject. A visitor who has just read that we build AI that
          answers phones is the one for whom "here is ours, talk to her" is an
          argument rather than a novelty; the same panel above the services
          was a gadget meeting a stranger who did not yet know what we sell.
          Still early enough that nobody has to hunt for it. */}
      <section id="talk-to-sofia" className="mx-auto max-w-4xl px-6 pb-4">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">{t('sofiaKicker')}</p>
        <div className="mt-4">
          <TalkToSofia placement="home" title={t('sofiaTitle')} blurb={t('sofiaBlurb')} />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <blockquote className="text-2xl font-medium text-ink">“{t('quote')}”</blockquote>
        <p className="mt-4 font-bold text-ink">{t('quoteName')}</p>
        <p className="text-sm text-ink-muted">{t('quoteRole')}</p>
      </section>

      <ResourceCTA
        kicker={r('home.ctaKicker')}
        title={r('home.ctaTitle')}
        body={r('home.ctaBody')}
        button={r('home.ctaButton')}
        href="/resources/ai-readiness-checklist"
      />

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
