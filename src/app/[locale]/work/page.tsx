import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CallLink } from '@/components/layout/CallLink';
import { TalkToSofia } from '@/components/sofia/TalkToSofia';
import { pageMetadata } from '@/lib/seo/metadata';
import { workCases } from '@/lib/work';
import { AdFilm } from '@/components/work/AdFilm';
import { ThemedShot } from '@/components/work/ThemedShot';
import { PlatformProof } from '@/components/marketing/PlatformProof';
import { tourShot } from '@/lib/platform-tour';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'work' });
  return pageMetadata({ locale, path: '/work', title: t('title'), description: t('metaDescription') });
}

export default async function WorkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'work' });
  const c = await getTranslations('common');
  const p = await getTranslations({ locale, namespace: 'platform' });

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t('title')}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-muted">{t('intro')}</p>

      {workCases.map((entry) => {
        const k = (key: string) => t(`cases.${entry.id}.${key}`);
        const facts = t.raw(`cases.${entry.id}.facts`) as string[];
        const stack = t.raw(`cases.${entry.id}.stack`) as string[];

        return (
          <article key={entry.id} id={entry.id} className="mt-12 scroll-mt-24 overflow-hidden rounded-2xl border border-hairline bg-surface-alt">
            <header className="border-b border-hairline p-8 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">{k('label')}</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">{k('title')}</h2>
              <p className="mt-4 text-ink-muted">{k('summary')}</p>
            </header>

            {entry.media && (
              // The product, before the claims about it. Film on the left at
              // phone width, the screens on the right: one wide, then three
              // phone-sized. Stacks on a phone, film first.
              <div data-work-media className="grid gap-8 border-b border-hairline p-8 sm:p-10 md:grid-cols-[16rem_1fr] md:items-start">
                {entry.media.video && (
                  <AdFilm slot={entry.media.video} label={k('videoLabel')} className="mx-auto w-full max-w-[16rem]" />
                )}
                <figure className="m-0">
                  {entry.media.desktop && (
                    <ThemedShot shot={entry.media.desktop} alt={k(`galleryAlt.${entry.media.desktop.id}`)}
                      sizes="(min-width: 56rem) 32rem, 100vw" />
                  )}
                  {entry.media.phones && (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {entry.media.phones.map((shot) => (
                        <ThemedShot key={shot.id} shot={shot} alt={k(`galleryAlt.${shot.id}`)}
                          sizes="(min-width: 56rem) 10rem, 33vw" />
                      ))}
                    </div>
                  )}
                  <figcaption className="mt-3 text-xs text-ink-muted">{k('galleryCaption')}</figcaption>
                </figure>
              </div>
            )}

            <div className="grid gap-10 p-8 sm:p-10 md:grid-cols-2">
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted">{k('factsHeading')}</h3>
                <ul className="mt-4 space-y-4">
                  {facts.map((fact) => (
                    <li key={fact} className="flex gap-3 text-ink-muted">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted">{k('builtHeading')}</h3>
                <p className="mt-4 text-ink-muted">{k('builtBody')}</p>
                <h3 className="mt-8 text-xs font-bold uppercase tracking-widest text-ink-muted">{k('stackHeading')}</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {stack.map((item) => (
                    <li key={item} className="rounded-full border border-hairline bg-surface px-3 py-1 text-sm text-ink-muted">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {entry.cta === 'call' && (
              <div className="border-t border-hairline bg-primary/5 p-8 sm:p-10">
                <h3 className="text-xl font-bold text-ink">{k('tryHeading')}</h3>
                <p className="mt-2 text-ink-muted">{k('tryBody')}</p>
                <CallLink className="mt-6 inline-flex items-center gap-3 rounded-lg bg-primary px-6 py-3 text-xl font-extrabold text-on-primary" />
                <p className="mt-4 text-sm text-ink-muted">
                  {k('tryNote')}{' '}
                  <Link href="/privacy" className="text-link underline">
                    {k('tryNoteLink')}
                  </Link>
                </p>
                {/* The page argues she answers a real line; the number above
                    proves it to anyone willing to dial. Most readers are not,
                    so the same conversation is offered without one. */}
                <div className="mt-8 border-t border-hairline pt-8">
                  <TalkToSofia placement="work" title={k('tryBrowserTitle')} blurb={k('tryBrowserBlurb')} />
                </div>
              </div>
            )}
            {entry.cta === 'visit' && (
              <div className="border-t border-hairline bg-primary/5 p-8 sm:p-10">
                <h3 className="text-xl font-bold text-ink">{k('visitHeading')}</h3>
                <p className="mt-2 text-ink-muted">{k('visitBody')}</p>
                <a
                  href={entry.href}
                  target="_blank"
                  rel="noopener"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-on-primary"
                >
                  {k('visitLink')}
                  <span aria-hidden="true">↗</span>
                  <span className="sr-only">({k('visitNewTab')})</span>
                </a>
              </div>
            )}
          </article>
        );
      })}

      {/* After the case studies, not before: the work earns the claim. The
          capture is the call LOG rather than the dashboard — this page is
          about delivery, and a list of real calls with outcomes reads as
          delivery in a way a KPI row does not. */}
      <div className="mt-12">
        <PlatformProof
          shot={tourShot('calls')}
          alt={p('alt.calls')}
          caption={p('sampleCaption')}
          kicker={t('platformKicker')}
          title={t('platformTitle')}
          body={t('platformBody')}
          linkLabel={t('platformLink')}
        />
      </div>

      <section className="mt-12 rounded-xl border border-hairline bg-surface-alt p-8">
        <h2 className="text-2xl font-bold text-ink">{t('nextHeading')}</h2>
        <p className="mt-3 text-ink-muted">{t('nextBody')}</p>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-extrabold text-ink">{t('ctaTitle')}</h2>
        <p className="mt-2 text-ink-muted">{t('ctaBody')}</p>
        <Link href="/contact" className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-bold text-on-primary">
          {c('cta')}
        </Link>
      </section>
    </main>
  );
}
