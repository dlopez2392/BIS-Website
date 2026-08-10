import type { ReactNode } from 'react';

// Capturing group so String.split keeps the URLs as array entries. Trailing
// sentence punctuation is excluded from the match so "…/insights." links to
// "…/insights" and leaves the period as text.
const URL_SPLIT = /(https?:\/\/[^\s<>()]*[^\s<>().,;:!?'"])/g;

// Deliberately a separate, NON-global regex. Calling .test() on a /g regex
// advances its lastIndex between calls, which would misclassify alternating
// parts of the split array.
const IS_URL = /^https?:\/\//;

/** Renders assistant text, turning bare URLs into anchors. */
export function linkify(text: string): ReactNode[] {
  return text.split(URL_SPLIT).map((part, i) =>
    IS_URL.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-link"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}
