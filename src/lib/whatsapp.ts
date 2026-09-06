/**
 * The WhatsApp entry point, and the one place its number becomes a link.
 *
 * Why it exists: 56% of Hispanic Americans use WhatsApp, against 22% of White
 * Americans, so in the Rio Grande Valley it is not a nice-to-have channel — it
 * is where a large share of customers already are, and a business they can
 * message is a business they are measurably likelier to buy from.
 *
 * It is deliberately configuration, not a constant. There is no WhatsApp
 * Business number yet, and a button that opens a chat nobody answers is worse
 * than no button at all: it converts a warm enquiry into an unanswered message
 * and a bad impression. So every placement renders nothing until
 * NEXT_PUBLIC_WHATSAPP_NUMBER is set, and appears everywhere at once when it
 * is. Nothing has to be deployed to turn it on.
 */

/** Digits only, with country code, the way wa.me wants them: 19565061545. */
export function normalizeNumber(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, '');
  // A US number typed without its country code is the likeliest mistake, so it
  // is corrected rather than rejected. Anything that is not a plausible
  // international number is refused: a wa.me link to a wrong number is a
  // stranger's phone, not an error page.
  if (digits.length === 10) return `1${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

export function whatsappNumber(): string | null {
  return normalizeNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
}

/**
 * wa.me opens the app on a phone and WhatsApp Web on a desktop, with the
 * message already typed so the visitor only has to press send — and so BIS
 * knows which page the enquiry came from.
 */
export function whatsappLink(number: string, prefill: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(prefill)}`;
}
