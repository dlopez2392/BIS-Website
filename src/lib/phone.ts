/**
 * Two representations of the business phone number — the dialable one and the
 * printed one — both derived from `business.phone` so they cannot drift apart.
 */

const US_NATIONAL_DIGITS = 10;

const digitsOf = (phone: string) => phone.replace(/\D/g, '');

/** `tel:` URI for an anchor href. Assumes US when no country code is given. */
export function telHref(phone: string): string {
  const digits = digitsOf(phone);
  const e164 = digits.length === US_NATIONAL_DIGITS ? `1${digits}` : digits;
  return `tel:+${e164}`;
}

/** Human-readable US form. Anything that is not a US number is returned as-is. */
export function formatUsPhone(phone: string): string {
  const digits = digitsOf(phone);
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (national.length !== US_NATIONAL_DIGITS) return phone;
  return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
}
