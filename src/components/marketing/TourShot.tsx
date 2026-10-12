import Image from 'next/image';
import { hasShot, shotSrc, type ShotSlot } from '@/lib/platform-tour';
import type { PhoneScreen } from '@/lib/phone-frame';
import { PhoneFrame } from './PhoneFrame';

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
 *
 * With `phone`, the capture is drawn on a phone rising out of a lit panel
 * (PhoneFrame), and `label` names whose phone it is — the same words the
 * story frame shows on a wide screen.
 */
export function TourShot({
  slot, alt, caption, priority = false, sizes = '(min-width: 64rem) 36rem, 100vw', phone, label,
}: {
  slot: ShotSlot; alt: string; caption: string; priority?: boolean; sizes?: string;
  phone?: PhoneScreen; label?: string;
}) {
  if (!hasShot(slot)) return null;

  if (phone) {
    return (
      <figure className="m-0">
        <div className="ground phone-stage relative">
          {label ? (
            <p className="phone-label">
              <span className="tour-dot" aria-hidden="true" />
              {label}
            </p>
          ) : null}
          <PhoneFrame
            phone={phone}
            src={shotSrc(slot)}
            alt={alt}
            width={slot.width}
            height={slot.height}
            priority={priority}
            // The crop is min(19rem, 80%) of the panel, the screen 390/414 of that.
            sizes="(min-width: 30rem) 18rem, 76vw"
          />
        </div>
        <figcaption className="mt-2 text-xs text-ink-muted">{caption}</figcaption>
      </figure>
    );
  }

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
