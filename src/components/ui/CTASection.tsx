import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { artProps } from '@/lib/art';
import { InlineBooking } from '@/components/platform/InlineBooking';
import { business } from '@/lib/seo/business';
import { formatUsPhone, telHref } from '@/lib/phone';

/**
 * The band every page ends on, and now the place a visitor books.
 *
 * It used to end on a button that sent them to /contact to find the
 * calendar. The calendar is the conversion the site is built around, so it
 * lives here instead: the platform's own booking page, framed, with open
 * times showing (Phase 2 of the 2026-10 redesign). The iframe is
 * `loading="lazy"`, so a visitor who never scrolls this far never fetches it.
 *
 * The ground is the hero's: dark in both themes, lit by the two glows or,
 * when `public/art/cta-band.1.webp` exists, by the Señal plate briefed for
 * it. White on #0b0a18 is ~17:1. The calendar sits on its own card rather
 * than on the ground, so its fallback link — the site's link colour — reads
 * on a surface it was chosen for in both themes.
 */
export async function CTASection({ title, body }: { title: string; body: string }) {
  const t = await getTranslations('contact');
  const plate = artProps('ctaBand');
  const phone = formatUsPhone(business.phone);
  return (
    <section className="ground" data-cta-band>
      {plate && (
        <Image {...plate} alt="" aria-hidden="true" sizes="100vw" className="ground-art" />
      )}
      <div className="ground-veil" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start">
        <div>
          <h2 className="ground-text text-3xl font-extrabold sm:text-4xl">{title}</h2>
          <p className="ground-muted mt-4 max-w-xl">{body}</p>
          <p className="ground-muted mt-8 text-sm">
            {t('callHeading')}{' '}
            <a href={telHref(business.phone)} className="ground-link font-bold">{phone}</a>
          </p>
        </div>
        <InlineBooking />
      </div>
    </section>
  );
}
