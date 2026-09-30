import { ArrowRight } from 'lucide-react';

/**
 * The one "go there" mark on a text link or button. Links used to end in a
 * typed `&gt;` or `→`, whichever the author reached for, and JSX quietly ate
 * the space before the `&gt;` — so the button on every page's closing band
 * read "Book your assessment>". An icon cannot lose its gap, is the same
 * glyph everywhere, and is hidden from screen readers, which were announcing
 * "greater than" at the end of the site's main call to action.
 */
export function Arrow({ className = '' }: { className?: string }) {
  return <ArrowRight aria-hidden="true" strokeWidth={2.25} className={`inline-block size-[1em] shrink-0 ${className}`} />;
}
