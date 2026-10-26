import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Globe, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ServiceSection } from '@/components/marketing/ServiceSection';
import { ServiceScene } from '@/components/marketing/ServiceScene';
import { TourShot } from '@/components/marketing/TourShot';
import { CTASection } from '@/components/ui/CTASection';
import { PageHeader } from '@/components/ui/PageHeader';
import { TalkToSofia } from '@/components/sofia/TalkToSofia';
import { pageMetadata } from '@/lib/seo/metadata';
import { SERVICE_ANCHORS } from '@/lib/service-groups';
import { SERVICES_FAQ } from '@/lib/faq';
import { tourSections } from '@/lib/platform-tour';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/services', title: t('servicesTitle'), description: t('servicesDescription') });
}

/** Where the BIS Platform section lives. Not a SERVICE_ANCHORS entry: the
 *  three groups there are what the home page, the footer and the business
 *  schema list; the platform has its own nav item and page, and is shown
 *  here as the fourth thing a client can buy. */
const PLATFORM_ANCHOR = 'platform';

/**
 * /services, rebuilt 2026-10 as a page a business owner can decide on: an
 * index of the four services, then one section each (who it is for, what
 * they get, the proof, a free first step and a way to talk about it), then
 * how an engagement runs, the questions owners ask first, and the booking
 * band. No prices and no client names yet, by the owner's choice; the
 * pricing paragraph is the How We Work page's own.
 */
export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('services');
  const tHome = await getTranslations('home');
  const tHow = await getTranslations('howWeWork');
  const tFaq = await getTranslations('faq');
  const tPlatform = await getTranslations('platform');

  const groups = [
    { key: 'g1', anchor: SERVICE_ANCHORS.g1, icon: <Sparkles size={16} />, scene: 'ai',
      proofLabel: tHome('kDelivered'), firstStepHref: '/tools/first-hour-back' },
    { key: 'g2', anchor: SERVICE_ANCHORS.g2, icon: <ShieldCheck size={16} />, scene: 'infra',
      proofLabel: tHome('kDelivered'), firstStepHref: '/tools/security-check' },
    { key: 'g3', anchor: SERVICE_ANCHORS.g3, icon: <Globe size={16} />, scene: 'web',
      proofLabel: tHome('kEveryBuild'), firstStepHref: '/#missed-calls' },
  ] as const;

  const index: { href: string; icon: ReactNode; title: string; outcome: string }[] = [
    ...groups.map((g) => ({ href: `#${g.anchor}`, icon: g.icon, title: t(`${g.key}Title`), outcome: t(`detail.${g.key}.outcome`) })),
    { href: `#${PLATFORM_ANCHOR}`, icon: <PhoneCall size={16} />, title: t('platform.title'), outcome: t('platform.outcome') },
  ];

  const booking = tourSections.find((s) => s.id === 'booking');
  const steps = [1, 2, 3, 4].map((n) => ({ title: tHow(`step${n}Title`), body: tHow(`step${n}Body`) }));

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SERVICES_FAQ.map((id) => ({
      '@type': 'Question',
      name: tFaq(`items.${id}.q`),
      acceptedAnswer: { '@type': 'Answer', text: tFaq(`items.${id}.a`) },
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <PageHeader kicker={t('pageKicker')} title={t('pageTitle')} intro={t('pageIntro')}>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/contact" className="ground-btn inline-flex items-center rounded-lg px-6 py-3 font-bold">
            {t('heroCta')}
          </Link>
          <Link href="/how-we-work" className="ground-link font-semibold">{t('heroSecondary')}</Link>
        </div>
      </PageHeader>

      {/* The index: four cards that answer "which of these is me?" before
          the reader has scrolled, each jumping to its section. */}
      <nav aria-label={t('indexLabel')} className="mx-auto max-w-6xl px-6 pt-12">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">{t('indexLabel')}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {index.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="flex h-full flex-col rounded-xl border border-hairline bg-surface-alt p-5 hover:border-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link motion-safe:transition"
              >
                <span aria-hidden="true" className="text-link">{item.icon}</span>
                <span className="mt-3 font-bold text-ink">{item.title}</span>
                <span className="mt-1 text-sm text-ink-muted">{item.outcome}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-auto max-w-6xl px-6 pt-12">
        {groups.map((g, i) => (
          <ServiceSection
            key={g.key}
            id={g.anchor}
            index={i + 1}
            icon={g.icon}
            title={t(`${g.key}Title`)}
            outcome={t(`detail.${g.key}.outcome`)}
            body={t(`${g.key}Body`)}
            needIfLabel={t('needIfLabel')}
            needIf={t.raw(`detail.${g.key}.needIf`) as string[]}
            getLabel={t('getLabel')}
            get={t.raw(`detail.${g.key}.get`) as string[]}
            toolsLabel={t('toolsLabel')}
            tools={t.raw(`detail.${g.key}.tools`) as string[]}
            proofLabel={g.proofLabel}
            proof={t(`${g.key}Proof`)}
            firstStepLabel={t('firstStepLabel')}
            firstStep={{ href: g.firstStepHref, label: t(`detail.${g.key}.firstStep`) }}
            cta={{ href: '/contact', label: t(`detail.${g.key}.cta`) }}
            visual={<ServiceScene kind={g.scene} />}
          />
        ))}

        <ServiceSection
          id={PLATFORM_ANCHOR}
          index={4}
          icon={<PhoneCall size={16} />}
          title={t('platform.title')}
          outcome={t('platform.outcome')}
          body={t('platform.body')}
          needIfLabel={t('needIfLabel')}
          needIf={t.raw('platform.needIf') as string[]}
          getLabel={t('getLabel')}
          get={t.raw('platform.get') as string[]}
          proofLabel={t('proofLive')}
          proof={t('platform.proof')}
          firstStepLabel={t('firstStepLabel')}
          firstStep={{ href: '/platform', label: t('platform.firstStep') }}
          cta={{ href: '/contact', label: t('platform.cta') }}
          visual={booking && 'phone' in booking ? (
            <TourShot
              slot={booking.shot}
              phone={booking.phone}
              label={t('platform.phoneLabel')}
              alt={tPlatform('alt.booking')}
              caption={tPlatform('sampleCaption')}
            />
          ) : undefined}
        >
          {/* The proof the section names, one press away. */}
          <div className="mt-10 max-w-4xl">
            <TalkToSofia placement="services" title={t('sofiaTitle')} blurb={t('platform.proof')} />
          </div>
        </ServiceSection>
      </div>

      <section aria-labelledby="process-h" className="border-t border-hairline">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 id="process-h" className="text-3xl font-extrabold tracking-tight text-ink">{t('processHeading')}</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-xl border border-hairline p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-accent tabular-nums">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="mt-2 font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 max-w-3xl rounded-xl bg-surface-alt p-5">
            <h3 className="font-bold text-ink">{tHow('pricingHeading')}</h3>
            <p className="mt-2 text-sm text-ink-muted">{tHow('pricingBody')}</p>
          </div>
          <p className="mt-6">
            <Link href="/how-we-work" className="font-semibold text-link hover:underline">{t('processMore')} <span aria-hidden="true">→</span></Link>
          </p>
        </div>
      </section>

      <section aria-labelledby="faq-h" className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 id="faq-h" className="text-3xl font-extrabold tracking-tight text-ink">{t('faqHeading')}</h2>
          <div className="mt-6 divide-y divide-hairline border-y border-hairline">
            {SERVICES_FAQ.map((id) => (
              <details key={id} className="group/faq py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink marker:content-none hover:text-link focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link [&::-webkit-details-marker]:hidden">
                  <span>{tFaq(`items.${id}.q`)}</span>
                  <span aria-hidden="true" className="text-ink-muted group-open/faq:rotate-45 motion-safe:transition">+</span>
                </summary>
                <p className="mt-3 text-ink-muted">{tFaq(`items.${id}.a`)}</p>
              </details>
            ))}
          </div>
          <p className="mt-6">
            <Link href="/faq" className="font-semibold text-link hover:underline">{t('faqMore')} <span aria-hidden="true">→</span></Link>
          </p>
        </div>
      </section>

      <CTASection title={t('ctaTitle')} body={t('ctaBody')} />
    </main>
  );
}
