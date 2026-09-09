import { business } from '@/lib/seo/business';
import { WORDMARK } from '@/lib/brand';

/**
 * The BIS wordmark, in one place.
 *
 * The letters come from `WORDMARK`, never from a literal here — that is what
 * the guard in this component's test enforces, and it is why this comment
 * describes the old lowercase spelling instead of quoting it.
 *
 * The chevron is part of the mark, not punctuation, so the accessible name is
 * the company's actual name rather than the characters on screen: a screen
 * reader announcing the initials letter by letter followed by "greater than"
 * tells a visitor nothing.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      {/* Real text, not aria-label. A bare <span> carries no role, and ARIA
          forbids a name on a roleless element: axe reports it as
          aria-prohibited-attr, and a screen reader that honours the rule
          drops the name entirely — leaving the letter-by-letter reading this
          was added to fix. Visually-hidden text has neither problem. */}
      <span className="sr-only">{business.name}</span>
      <span aria-hidden="true">{WORDMARK}</span>
    </span>
  );
}
