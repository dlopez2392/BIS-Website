import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { CTASection } from '@/components/ui/CTASection';
import { TourShot } from '@/components/marketing/TourShot';
import { TourSectionBlock } from '@/components/marketing/TourSectionBlock';
import { pageMetadata } from '@/lib/seo/metadata';
import { tourSections, heroShot, allShots, hasShot } from '@/lib/platform-tour';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'platform' });
  return pageMetadata({ locale, path: '/platform', title: t('title'), description: t('metaDescription') });
}

/**
 * /platform — what a client's own workspace looks like.
 *
 * The page sells the system as the thing a client RUNS ON after we build it,
 * not as software with a price list: it opens on the promise the rest of the
 * site already makes ("your first hour back") and ends at the same free
 * assessment every other page ends at. There is no signup, because there is
 * no self-serve product behind one.
 *
 * Every screenshot is of an invented company, and the page says so twice — a
 * note before the first capture, and a caption under every one of them. See
 * `lib/platform-tour.ts` for why that is the stronger sell rather than a
 * disclaimer we tolerate.
 */
export default async function PlatformPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'platform' });
  const c = await getTranslations('common');

  return (
    <main>
      <div className="mx-auto max-w-6xl px-6 pt-20">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">{t('heroKicker')}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold text-ink sm:text-5xl">
          {t('heroTitle')}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-ink-muted">{t('heroBody')}</p>

        <div className="mt-10">
          <TourShot
            slot={heroShot}
            alt={t('alt.hero')}
            caption={t('sampleCaption')}
            // Above the fold once it exists, so it is the LCP candidate.
            priority
            // This one renders full width (~69rem), not in the tour's 36rem
            // column: with the default hint the browser chose a 640px file
            // and stretched it 1.9x into an 1104px box, so a prospect's first
            // look at the product was soft.
            sizes="(min-width: 64rem) 69rem, 100vw"
          />
        </div>

        {/* Stated before the tour rather than in a footnote: a reader should
            know what they are looking at before they have looked at it. Hidden
            while no capture exists, because "about these screenshots" above a
            page with no screenshots is its own small lie. */}
        {allShots().some(hasShot) ? (
          <aside className="mt-10 rounded-xl border border-hairline bg-surface-alt p-5">
            <h2 className="text-sm font-bold text-ink">{t('sampleNoteTitle')}</h2>
            <p className="mt-2 text-sm text-ink-muted">{t('sampleNote')}</p>
          </aside>
        ) : null}

        {tourSections.map((section) => (
          <TourSectionBlock key={section.id} locale={locale} section={section} />
        ))}
      </div>

      <div className="mt-8">
        <CTASection title={t('ctaTitle')} body={t('ctaBody')} cta={c('cta')} />
      </div>
    </main>
  );
}
