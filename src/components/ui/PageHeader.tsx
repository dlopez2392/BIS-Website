import Image from 'next/image';
import type { ReactNode } from 'react';
import { artPosition, artProps, type ArtSlotName } from '@/lib/art';

const WIDTHS = { '4xl': 'max-w-4xl', '6xl': 'max-w-6xl' } as const;

/**
 * The opening band of an inner page: kicker, headline and intro on the
 * site's dark ground, lit by the page's Señal plate.
 *
 * The ground is dark in both themes (see `.ground` in globals.css), so the
 * plate needs no light variant and the white headline reads at ~17:1
 * whatever the page theme is. Type and light sit side by side, never one
 * over the other (`.ground-art[data-mask="end"]`): the plate lights the end
 * half of the band on a wide screen and is a strip under the type on a
 * phone, cropped at the anchor its slot names. The type column is held
 * narrow enough to stay on the plain ground at every width.
 *
 * With no plate on disk the band still renders, lit by the ground's own two
 * glows, so a page never waits on its art. `width` matches the column the
 * rest of the page uses, so the headline lines up with the content below.
 */
export function PageHeader({
  art, kicker, title, intro, width = '6xl', children,
}: {
  art?: ArtSlotName;
  kicker?: string;
  title: string;
  intro?: string;
  width?: keyof typeof WIDTHS;
  children?: ReactNode;
}) {
  const plate = artProps(art);
  return (
    <section className="ground" data-page-header>
      {plate && art && (
        <Image
          {...plate}
          alt=""
          aria-hidden="true"
          priority
          sizes="100vw"
          className="ground-art"
          data-mask="end"
          style={{ objectPosition: artPosition(art) }}
        />
      )}
      <div className={`relative mx-auto ${WIDTHS[width]} px-6 pt-20 ${plate ? 'pb-56' : 'pb-20'} md:py-24`}>
        {kicker && <p className="ground-accent text-xs font-bold uppercase tracking-widest">{kicker}</p>}
        <h1 className={`ground-text max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl${kicker ? ' mt-3' : ''}`}>{title}</h1>
        {intro && <p className="ground-muted mt-4 max-w-xl text-lg">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
