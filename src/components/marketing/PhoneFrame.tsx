import Image from 'next/image';
import { croppedAspect, type PhoneScreen } from '@/lib/phone-frame';

/**
 * A capture shown on a phone: bezel, status bar, then the screenshot, cut off
 * at the bottom by whatever panel it sits in (`show`). See `lib/phone-frame.ts`
 * for why the tour draws one, and globals.css `.phone` for the geometry.
 *
 * No hooks and no browser APIs, so the same component serves the server-rendered
 * inline step (TourShot) and the client-side story frame (TourStory).
 *
 * The status bar is decoration and hidden from assistive technology; the
 * capture's alt text is the description. Nothing on the bar claims anything:
 * a clock that agrees with the picture, a battery, a signal.
 */
export function PhoneFrame({
  phone, src, alt, width, height, sizes, priority = false, className,
}: {
  phone: PhoneScreen;
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={className ? `phone-crop ${className}` : 'phone-crop'}
      style={{ aspectRatio: croppedAspect(phone.show) }}
      data-phone
    >
      <div className="phone">
        <div className="phone-screen">
          <div className="phone-status" style={{ background: phone.ground }} aria-hidden="true">
            <span className="phone-clock">{phone.clock}</span>
            <span className="phone-island" />
            <span className="phone-icons">
              {/* Signal: four bars, rising. */}
              <svg viewBox="0 0 17 11" className="phone-signal">
                <rect x="0" y="7" width="3" height="4" rx="0.7" />
                <rect x="4.6" y="5" width="3" height="6" rx="0.7" />
                <rect x="9.2" y="2.5" width="3" height="8.5" rx="0.7" />
                <rect x="13.8" y="0" width="3" height="11" rx="0.7" />
              </svg>
              {/* Battery: outline, charge, terminal. */}
              <svg viewBox="0 0 27 13" className="phone-battery">
                <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" strokeOpacity="0.4" />
                <rect x="2" y="2" width="16" height="9" rx="2" />
                <path d="M25 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2z" fillOpacity="0.4" />
              </svg>
            </span>
          </div>
          <div className="phone-content">
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              sizes={sizes}
              priority={priority}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
