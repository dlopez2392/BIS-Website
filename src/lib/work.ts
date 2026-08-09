// Ordered case studies for /work. Copy lives in the `work` i18n namespace
// (work.cases.<id>.*), so adding an engagement is: append an id here, write its
// EN + ES copy, done — the page renders whatever this list contains and the
// coverage test in __tests__/work.test.ts fails loudly if a locale is missing.
//
// `cta` is what closes the entry. 'call' renders the tap-to-call block (only
// honest for something a visitor can dial themselves); 'none' ends the card
// after the facts, which is what a client engagement will normally want.
export const workCases = [{ id: 'sofia', cta: 'call' }] as const;

export type WorkCase = (typeof workCases)[number];
export type WorkCaseId = WorkCase['id'];

/** Text keys every case must define in both locales. */
export const workCaseTextKeys = [
  'label',
  'title',
  'summary',
  'factsHeading',
  'builtHeading',
  'builtBody',
  'stackHeading',
] as const;

/** List keys every case must define in both locales. */
export const workCaseListKeys = ['facts', 'stack'] as const;

/** Text keys required only by cases whose `cta` is 'call'. */
export const workCallCtaKeys = ['tryHeading', 'tryBody', 'tryNote', 'tryNoteLink'] as const;
