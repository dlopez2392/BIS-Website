/**
 * Every surface that renders the live Sofía panel, and the copy each one uses.
 *
 * The panel takes its heading and invitation from the page rather than owning
 * them, because the argument differs by where a visitor meets it: on the
 * homepage the panel IS the claim, on a trade page it is evidence for a claim
 * the paragraph above already made, and on /contact it is an alternative to
 * typing. This table exists so that copy cannot go missing in one language,
 * and so `placement` on the analytics events is a closed set rather than a
 * free-typed string that quietly forks into `work` and `Work`.
 *
 * Adding a placement is: append here, write both locales, render the panel
 * with that id. `placements.test.ts` fails if a key is missing or empty.
 */
export interface SofiaPlacement {
  /** Stable id. Also the `placement` property on the Vercel Analytics events. */
  id: string;
  /** Dotted i18n paths, from the message root, for the panel's own copy. */
  titleKey: string;
  blurbKey: string;
}

export const sofiaPlacements = [
  { id: 'home', titleKey: 'home.sofiaTitle', blurbKey: 'home.sofiaBlurb' },
  { id: 'trust', titleKey: 'sofia.title', blurbKey: 'sofia.blurb' },
  { id: 'services', titleKey: 'services.sofiaTitle', blurbKey: 'services.sofiaBlurb' },
  {
    id: 'work',
    titleKey: 'work.cases.sofia.tryBrowserTitle',
    blurbKey: 'work.cases.sofia.tryBrowserBlurb',
  },
  { id: 'contact', titleKey: 'contact.sofiaTitle', blurbKey: 'contact.sofiaBlurb' },
  {
    id: 'industry',
    titleKey: 'industries.shared.sofiaTryTitle',
    blurbKey: 'industries.shared.sofiaTryBlurb',
  },
] as const satisfies readonly SofiaPlacement[];

export type SofiaPlacementId = (typeof sofiaPlacements)[number]['id'];
