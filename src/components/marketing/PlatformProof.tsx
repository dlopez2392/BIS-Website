import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { hasShot, shotSrc, type ShotSlot } from '@/lib/platform-tour';

/**
 * "The software is ours" — said once, with the product in the frame.
 *
 * The strongest thing this company can say to a Valley business owner is that
 * the CRM answering their phone is not a licence somebody resold them. That
 * argument is made at length on /platform; this is the band that makes it in
 * passing, wherever a reader already is.
 *
 * ONE capture, never a gallery. A row of six screenshots on a page that is
 * about something else reads as a brochure; a single screen next to a single
 * sentence reads as evidence. /platform is where the tour lives.
 *
 * Render-only-if-present, same rule as `TourShot` and `FounderPortrait`: with
 * no file on disk the copy stands alone in a single column rather than
 * leaving an empty half-grid. That is not hypothetical — the two-column
 * layout on /platform shipped with exactly that bug before the captures
 * existed, which is why `illustrated` gates the grid itself and not just the
 * <Image>.
 *
 * The caption is load-bearing. Every capture is of an invented company, and a
 * reader who meets a screenshot here — away from /platform's disclosure — has
 * only the caption to tell them so.
 */
export function PlatformProof({
  shot, alt, caption, kicker, title, body, linkLabel,
}: {
  shot: ShotSlot;
  alt: string;
  caption: string;
  kicker: string;
  title: string;
  body: string;
  linkLabel: string;
}) {
  const illustrated = hasShot(shot);

  return (
    <section
      data-platform-proof
      className="overflow-hidden rounded-2xl border border-hairline bg-surface-alt"
    >
      <div className={
        illustrated
          ? 'grid gap-8 p-8 sm:p-10 md:grid-cols-2 md:items-center'
          : 'p-8 sm:p-10'
      }>
        <div className={illustrated ? '' : 'max-w-2xl'}>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">{kicker}</p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h2>
          <p className="mt-4 text-ink-muted">{body}</p>
          {/*
            Deliberately NOT the solid `bg-primary` button. On this site that
            treatment means one thing — book an assessment — and every page
            this band appears on already has one; on /work an identical-looking
            one sits a few hundred pixels below. Two solid buttons make the
            reader choose, and the one that earns money would lose half those
            clicks to a tour. The border treatment is the site's existing
            secondary link (the industry chips), with `hover:bg-surface`
            because the band itself is already `bg-surface-alt`.
          */}
          <Link
            href="/platform"
            className="mt-6 inline-block rounded-lg border border-hairline px-6 py-3 font-bold text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            {linkLabel}
          </Link>
        </div>

        {illustrated ? (
          <figure className="m-0">
            <Image
              src={shotSrc(shot)}
              alt={alt}
              width={shot.width}
              height={shot.height}
              // Half a column on desktop, the whole thing on a phone. These
              // captures are 2560 wide; without this next/image would serve a
              // far larger variant than the slot ever paints.
              sizes="(min-width: 48rem) 28rem, 100vw"
              className="w-full rounded-xl border border-hairline shadow-sm"
            />
            <figcaption className="mt-2 text-xs text-ink-muted">{caption}</figcaption>
          </figure>
        ) : null}
      </div>
    </section>
  );
}
