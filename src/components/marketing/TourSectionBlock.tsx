import { getTranslations } from 'next-intl/server';
import { TourShot } from './TourShot';
import type { TourSection } from '@/lib/platform-tour';

/**
 * One step of the /platform story: the words, then that step's own capture.
 *
 * The words are written to stand alone. Every claim here is carried by the
 * prose and, where the wording itself is the evidence, by a quoted line of
 * real interface copy — never by the picture. That is what a screen reader
 * and a search engine get, and it is why the page still reads correctly with
 * no captures on disk at all.
 *
 * Rendered inside `TourStory`. The inline capture below the words is the
 * whole layout on a phone and without JavaScript; on a wide screen, once the
 * story has hydrated, it steps aside (`.tour-inline`) for the one pinned
 * frame that follows the reader, and `data-tour-step` is how that frame
 * knows which step is being read.
 */
export async function TourSectionBlock({
  locale, section,
}: { locale: string; section: TourSection }) {
  const t = await getTranslations({ locale, namespace: 'platform' });
  const k = `sections.${section.id}`;

  return (
    <section
      id={section.id}
      data-tour-step={section.id}
      className="scroll-mt-24 border-t border-hairline py-16 first:border-t-0 lg:py-20"
    >
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">{t(`${k}.kicker`)}</p>
        <h2 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">{t(`${k}.title`)}</h2>
        <p className="mt-4 text-ink-muted">{t(`${k}.body`)}</p>

        {section.quoted ? (
          <blockquote className="mt-6 border-l-2 border-link pl-4">
            <p className="text-lg text-ink" lang="es">{t(`${k}.quote`)}</p>
            <footer className="mt-2 text-sm text-ink-muted">{t(`${k}.quoteSource`)}</footer>
          </blockquote>
        ) : null}
      </div>

      <div className="tour-inline">
        <TourShot slot={section.shot} alt={t(`alt.${section.id}`)} caption={t('sampleCaption')} />
      </div>
    </section>
  );
}
