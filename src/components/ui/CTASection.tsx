import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { artProps } from '@/lib/art';

/**
 * The band every page ends on. It was a flat violet slab with a white pill,
 * and in dark mode the pill's violet text sat at 2.6:1 on white and the body
 * at 3.7:1 on the band — the one conversion the site is built around,
 * unreadable for a dark-mode visitor on ten pages.
 *
 * It is now the hero's ground: dark in both themes, lit by the two glows or,
 * when `public/art/cta-band.1.webp` exists, by the Señal plate briefed for it
 * (dark in the centre, light at both edges — the type is centred). White on
 * #0b0a18 is ~17:1; the button is a solid #7c3aed at 5.6:1 in both themes.
 */
export function CTASection({ title, body, cta }: { title: string; body: string; cta: string }) {
  const plate = artProps('ctaBand');
  return (
    <section className="ground" data-cta-band>
      {plate && (
        <Image {...plate} alt="" aria-hidden="true" sizes="100vw" className="ground-art" />
      )}
      <div className="ground-veil" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="ground-text text-3xl font-extrabold sm:text-4xl">{title}</h2>
        <p className="ground-muted mx-auto mt-4 max-w-2xl">{body}</p>
        <Link href="/contact" className="ground-btn mt-8 inline-block rounded-md px-6 py-3 font-bold">
          {cta} &gt;
        </Link>
      </div>
    </section>
  );
}
