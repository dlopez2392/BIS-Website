import { Link } from '@/i18n/navigation';
import { ThemedShot } from '@/components/work/ThemedShot';
import { PRISM_MEDIA, PRISM_URL } from '@/lib/work';

/**
 * "Also built by BIS" — one line of proof that the platform is not the only
 * thing this company ships. Prism is public, so the strongest link is the live
 * demo itself; the quieter one goes to the write-up on /work.
 *
 * Deliberately NOT a second solid primary button: on this site that treatment
 * means "book an assessment", and the page already has one.
 */
export function PrismTeaser({ kicker, title, body, demo, more, newTab, alt }: {
  kicker: string; title: string; body: string; demo: string; more: string; newTab: string; alt: string;
}) {
  const shot = PRISM_MEDIA.desktop!;
  return (
    <section data-prism-teaser className="overflow-hidden rounded-2xl border border-hairline bg-surface-alt">
      <div className="grid gap-8 p-8 sm:p-10 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">{kicker}</p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h2>
          <p className="mt-4 text-ink-muted">{body}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={PRISM_URL}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface px-5 py-2.5 font-bold text-ink hover:border-accent"
            >
              {demo}
              <span aria-hidden="true">↗</span>
              <span className="sr-only">({newTab})</span>
            </a>
            <Link href={{ pathname: '/work', hash: 'prism' }} className="font-bold text-link underline-offset-4 hover:underline">
              {more}
            </Link>
          </div>
        </div>
        <ThemedShot shot={shot} alt={alt} sizes="(min-width: 64rem) 28rem, 100vw" />
      </div>
    </section>
  );
}
