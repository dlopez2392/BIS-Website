import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { photoSlots, hasPhoto, photoSrc } from '@/lib/photos';

/**
 * Renders nothing until `public/photos/dan-lopez.jpg` exists, so the About page
 * reads correctly today and gains a portrait the moment a file lands — no code
 * change, no placeholder shipping to production in the meantime.
 */
export async function FounderPortrait({ locale }: { locale: string }) {
  if (!hasPhoto('founder')) return null;
  const t = await getTranslations({ locale, namespace: 'photos' });
  const slot = photoSlots.founder;

  return (
    <Image
      src={photoSrc('founder')}
      alt={t(`alt.${slot.altKey}`)}
      width={slot.width}
      height={slot.height}
      // The portrait is above the fold on /about, so it is the LCP candidate.
      priority
      sizes="(min-width: 48rem) 20rem, 100vw"
      className="w-full max-w-xs rounded-2xl border border-hairline object-cover"
    />
  );
}
