import Image from 'next/image';
import { hasShot, shotSrc, type ShotSlot } from '@/lib/platform-tour';

/**
 * A product screenshot, or nothing at all.
 *
 * Same rule as `FounderPortrait`: the slot renders only once its file exists,
 * so this page ships and reads correctly before the capture pipeline has run,
 * and gains its images the moment the files land — no code change, and never a
 * grey placeholder in production.
 *
 * The caption is not decoration. Every capture here is of an invented company,
 * and a reader who scrolls straight to a screenshot must be able to tell that
 * from the screenshot itself rather than from a note further up the page.
 */
export function TourShot({
  slot, alt, caption, priority = false, sizes = '(min-width: 64rem) 36rem, 100vw',
}: { slot: ShotSlot; alt: string; caption: string; priority?: boolean; sizes?: string }) {
  if (!hasShot(slot)) return null;

  return (
    <figure className="m-0">
      <Image
        src={shotSrc(slot)}
        alt={alt}
        width={slot.width}
        height={slot.height}
        priority={priority}
        sizes={sizes}
        className="w-full rounded-xl border border-hairline shadow-sm"
      />
      <figcaption className="mt-2 text-xs text-ink-muted">{caption}</figcaption>
    </figure>
  );
}
