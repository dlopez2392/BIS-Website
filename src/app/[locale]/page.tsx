import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { AdFilm } from '@/components/work/AdFilm';
import { FounderPortrait } from '@/components/marketing/FounderPortrait';
import { InlineBooking } from '@/components/platform/InlineBooking';
import { SignalRibbon } from '@/components/home/SignalRibbon';
import { LiveCall } from '@/components/home/LiveCall';
import { HotspotShot } from '@/components/home/HotspotShot';
import { SofiaSection } from '@/components/home/SofiaSection';
import { Twin } from '@/components/home/Twin';
import { heroShot, hasShot, shotSrc } from '@/lib/platform-tour';
import { hasPhoto } from '@/lib/photos';
import { PRISM_AD, PRISM_URL } from '@/lib/work';
import { business } from '@/lib/seo/business';
import { formatUsPhone, telHref } from '@/lib/phone';
import { pageMetadata } from '@/lib/seo/metadata';
import { listPosts, formatDate } from '@/lib/insights';
import { SERVICE_GROUP_IDS } from '@/lib/service-groups';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return pageMetadata({ locale, path: '/', title: t('title'), description: t('homeDescription'), absoluteTitle: true });
}

/**
 * Where the three markers sit on `dashboard-dark.png`, in percent of the
 * capture: the week's calls KPI, the 9:15 PM Spanish call in recent activity,
 * and the bookings column. Re-shooting the capture means re-checking these.
 */
const SPOTS = [
  { left: 36.5, top: 24 },
  { left: 52, top: 94.5 },
  { left: 80, top: 61 },
] as const;

/**
 * The home page: one signal of light down a dark page, and the product shown
 * working rather than described. Sections separate by space, not boxes; the
 * only two surfaces are the live call and the product frame, because they are
 * the only two objects.
 *
 * Each section's headline has a twin in the other language (see `Twin`). The
 * hero's `id="hero"` is also what the Ask BIS launcher watches to shrink to
 * its orb over the headline on a phone, and each section's
 * `data-ask-section` picks the questions Ask BIS suggests while it is being
 * read (the keys are `chat.chips.*`).
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const other = locale === 'en' ? 'es' : 'en';
  const t = await getTranslations('home');
  const tx = await getTranslations({ locale: other, namespace: 'home' });
  const cc = await getTranslations('contact');
  const s = await getTranslations('services');
  const sx = await getTranslations({ locale: other, namespace: 'services' });
  const p = await getTranslations({ locale, namespace: 'platform' });
  const r = await getTranslations({ locale, namespace: 'resources' });
  const w = await getTranslations({ locale, namespace: 'work' });
  const it = await getTranslations({ locale, namespace: 'insights' });
  const latest = (await listPosts(locale as 'en' | 'es')).slice(0, 3);
  const phone = formatUsPhone(business.phone);
  const tel = telHref(business.phone);
  const withPhoto = hasPhoto('founder');

  return (
    <main className="hm">
      <SignalRibbon />

      <section id="hero" data-ask-section="top" className="hm-hero">
        <div className="hm-wrap">
          <div className="hm-stack">
            <div>
              <h1 className="hm-display">{t('heroTitle')}</h1>
              <Twin text={tx('heroTitle')} locale={locale} size="display" />
            </div>
            <p className="hm-lede">{t('heroBody')}</p>
            <div className="hm-ctas">
              <Link href="/contact" className="hm-btn hm-btn-primary">{t('heroCta2')}</Link>
              <a href="#talk-to-sofia" className="hm-btn hm-btn-ghost">{t('heroTalk')}</a>
            </div>
            <p className="hm-status">
              <span className="hm-dot" aria-hidden="true" />
              <span>{t('statusLine', { phone })}</span>
            </p>
          </div>
          <LiveCall
            strings={{
              label: t('call.label'), business: t('call.business'), live: t('call.live'), ended: t('call.ended'),
              meta: t('call.meta'), crmTitle: t('call.crmTitle'), crmContact: t('call.crmContact'),
              crmNeed: t('call.crmNeed'), crmLang: t('call.crmLang'), crmOutcome: t('call.crmOutcome'),
              crmBooked: t('call.crmBooked'), need: t('call.need'), langEs: t('call.langEs'), langEn: t('call.langEn'),
              mondayK: t('call.mondayK'), mondayCalls: t('call.mondayCalls'), mondayDelta: t('call.mondayDelta'),
              note: t('call.note'), replay: t('call.replay'), langLabel: t('call.langLabel'), caller: t('call.caller'),
            }}
          />
        </div>
      </section>

      <section className="hm-proof" aria-label={t('proofLabel')}>
        <div className="hm-wrap">
          <ul>
            <li><span className="hm-dot" aria-hidden="true" /><span>{t('proof1')}</span></li>
            <li><strong>EN / ES</strong><span>{t('proof2')}</span></li>
            <li><strong>Harlingen, TX</strong><span>{t('proof3')}</span></li>
          </ul>
        </div>
      </section>

      <section id="platform" data-ask-section="platform" className="hm-sec">
        <div className="hm-wrap">
          <div className="hm-plat-head">
            <div className="hm-head">
              <div>
                <h2 className="hm-h2">{t('platformTitle')}</h2>
                <Twin text={tx('platformTitle')} locale={locale} size="h2" hash="platform" />
              </div>
              <p className="hm-lede">{t('platformBody')}</p>
            </div>
            <Link href="/platform" className="hm-more">{t('platformLink')} <span aria-hidden="true">→</span></Link>
          </div>
          {hasShot(heroShot) ? (
            <HotspotShot
              src={shotSrc(heroShot)}
              width={heroShot.width}
              height={heroShot.height}
              alt={p('alt.hero')}
              caption={t('spots.hint')}
              spots={SPOTS.map((pos, i) => ({
                ...pos,
                title: t(`spots.s${i + 1}t`),
                body: t(`spots.s${i + 1}b`),
                label: t('spots.open', { n: i + 1 }),
              }))}
            />
          ) : null}
        </div>
      </section>

      <section id="services" data-ask-section="services" className="hm-sec">
        <div className="hm-wrap">
          <div className="hm-head">
            <div>
              <h2 className="hm-h2">{s('title')}</h2>
              <Twin text={sx('title')} locale={locale} size="h2" hash="services" />
            </div>
            <p className="hm-lede">{s('intro')}</p>
          </div>
          <div className="hm-rows">
            {SERVICE_GROUP_IDS.map((id) => (
              <article key={id} className="hm-row">
                <div>
                  <h3>{s(`${id}Title`)}</h3>
                  <Twin text={sx(`${id}Title`)} locale={locale} size="h3" as="text" />
                </div>
                <p>{s(`${id}Body`)}</p>
                <div className="hm-done">
                  <span className="hm-k">{id === 'g3' ? t('kEveryBuild') : t('kDelivered')}</span>
                  <p>{s(`${id}Proof`)}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-7">
            <Link href="/services" className="hm-more">{t('svcMore')} <span aria-hidden="true">→</span></Link>
          </p>
        </div>
      </section>

      <section id="talk-to-sofia" data-ask-section="sofia" className="hm-sec">
        <SofiaSection
          idle={t('orbIdle')}
          talking={t('orbTalk')}
          connected={t('orbLive')}
          heading={
            <>
              <div>
                <h2 className="hm-h2">{t('sofiaTitle')}</h2>
                <Twin text={tx('sofiaTitle')} locale={locale} size="h2" hash="talk-to-sofia" />
              </div>
              <p className="hm-lede">{t('sofiaBlurb')}</p>
            </>
          }
        />
      </section>

      <section id="prism" data-ask-section="prism" className="hm-sec">
        <div className="hm-wrap hm-prism">
          <AdFilm slot={PRISM_AD} label={w('cases.prism.videoLabel')} />
          <div className="hm-stack">
            <span className="hm-k">{t('prismKicker')}</span>
            <h2 className="hm-h2">{t('prismTitle')}</h2>
            <p className="hm-lede">{t('prismBody')}</p>
            <div className="hm-ctas">
              <a href={PRISM_URL} target="_blank" rel="noopener" className="hm-btn hm-btn-ghost">
                {t('prismDemo')} <span aria-hidden="true">↗</span>
                <span className="sr-only">({t('prismNewTab')})</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="founder" data-ask-section="founder" className="hm-sec">
        <div className="hm-wrap">
          <div className={withPhoto ? 'hm-founder' : 'hm-founder hm-founder--solo'}>
            <FounderPortrait locale={locale} className="h-auto w-full rounded-[18px] object-cover" />
            <figure className="m-0">
              <blockquote>“{t('quote')}”</blockquote>
              <figcaption><strong>{t('quoteName')}</strong> · {t('quoteRole')}</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section id="close" data-ask-section="founder" className="hm-close">
        <div className="hm-wrap hm-stack">
          <div>
            <h2 className="hm-display">{t('ctaTitle')}</h2>
            <Twin text={tx('ctaTitle')} locale={locale} size="display" hash="close" />
          </div>
          <p className="hm-lede">{t('ctaBody')}</p>
          <InlineBooking className="max-w-3xl" />
          <p className="hm-lede">
            {cc('callHeading')}{' '}
            <a href={tel} className="hm-more">{phone}</a>
          </p>
          <p className="hm-lede">
            {t('checklistLine')}{' '}
            <Link href="/resources/ai-readiness-checklist" className="hm-more">{r('home.ctaButton')}</Link>
          </p>
          {latest.length > 0 && (
            <div className="mt-10 grid gap-4">
              <h2 className="hm-k">{t('insightsHeading')}</h2>
              <ul className="hm-reads">
                {latest.map((post) => (
                  <li key={post.slug}>
                    <Link href={`/insights/${post.slug}`}>
                      <span>{post.title}</span>
                      <time dateTime={post.date}>
                        {formatDate(locale as 'en' | 'es', post.date)} · {it('minRead', { minutes: post.readingMinutes })}
                      </time>
                    </Link>
                  </li>
                ))}
              </ul>
              <p><Link href="/insights" className="hm-more">{t('insightsMore')} <span aria-hidden="true">→</span></Link></p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
