import Image from 'next/image';
import type { ThemedShot as Shot } from '@/lib/work';

/**
 * One screen, captured twice — light and dark — and shown in whichever
 * matches this site's own theme, so a dark-mode reader is not flash-banged by
 * a white screenshot and a light-mode reader does not get a black slab.
 *
 * Both are `loading="lazy"` and the hidden one is `display: none`, which
 * browsers do not fetch until it is shown, so only one image is ever paid for.
 */
export function ThemedShot({ shot, alt, sizes, className = '' }: {
  shot: Shot;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const img = 'h-auto w-full rounded-xl border border-hairline shadow-sm';
  return (
    <div className={className} data-themed-shot={shot.id}>
      <Image src={shot.light} alt={alt} width={shot.width} height={shot.height} sizes={sizes}
        className={`${img} dark:hidden`} />
      <Image src={shot.dark} alt={alt} width={shot.width} height={shot.height} sizes={sizes}
        className={`${img} hidden dark:block`} />
    </div>
  );
}
