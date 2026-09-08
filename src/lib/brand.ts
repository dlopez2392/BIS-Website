/**
 * The BIS wordmark as text, in one place.
 *
 * BIS is an initialism — Bespoke Intelligent Solutions — so it is set in caps;
 * the `>` is part of the mark, not punctuation. It shipped lowercase for
 * months because the string was written out separately in the header, the
 * footer, the OG share image and two email templates, so fixing any one of
 * them left the others wrong.
 *
 * Rendered five different ways — a DOM component, a satori image, and email
 * HTML each need their own markup — but spelled exactly once.
 * `Wordmark.test.tsx` fails if any file writes it out again.
 */
export const WORDMARK = 'BIS>';
