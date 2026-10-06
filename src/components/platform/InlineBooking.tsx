import { PlatformEmbed } from '@/components/platform/PlatformEmbed';

/**
 * The booking calendar, framed on its own card, wherever a page used to end
 * on a "Book your assessment" button that sent the visitor to /contact to
 * find it. Booking on the page is the conversion the site exists for; a
 * second page between the decision and the calendar only loses people.
 *
 * On a card, not bare: the embed's fallback link is the site's link colour,
 * chosen for a surface, and several of these sit on the dark ground band.
 */
export function InlineBooking({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-hairline bg-surface-alt p-3 sm:p-4 ${className}`} data-cta-booking>
      <PlatformEmbed kind="booking" />
    </div>
  );
}
