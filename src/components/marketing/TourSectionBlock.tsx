import { getTranslations } from 'next-intl/server';
import { TourShot } from './TourShot';
import { hasShot, type TourSection } from '@/lib/platform-tour';

/**
 * One section of the /platform tour: words on one side, a screenshot on the
 * other, alternating down the page.
 *
 * The words are written to stand alone. Every claim here is carried by the
 * prose and, where the wording itself is the evidence, by a quoted line of
 * real interface copy — never by the picture. That is what lets the page go
 * live before a single capture exists, and it is also what a screen reader and
 * a search engine get.
 *
 * The two-column grid appears only when there IS a capture. A `TourShot` with
 * no file renders nothing, and the first build of this page proved what that
 * does to a fixed grid: five sections of text each hugging one side with an
 * empty half beside it. Without images this is a single measured column, which
 * is what a text section should look like anyway.
 */
export async function TourSectionBlock({
  locale, section,
}: { locale: string; section: TourSection }) {
  const t = await getTranslations({ locale, namespace: 'platform' });
  const k = `sections.${section.id}`;
  const illustrated = hasShot(section.shot);

  const words = (
    <div className={illustrated && section.reversed ? 'lg:order-2' : undefined}>
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
  );

  return (
    <section
      id={section.id}
      className="scroll-mt-24 border-t border-hairline py-16 first:border-t-0 lg:py-20"
    >
      {illustrated ? (
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {words}
          <div className={section.reversed ? 'lg:order-1' : undefined}>
            <TourShot
              slot={section.shot}
              alt={t(`alt.${section.id}`)}
              caption={t('sampleCaption')}
            />
          </div>
        </div>
      ) : (
        <div className="max-w-2xl">{words}</div>
      )}
    </section>
  );
}
