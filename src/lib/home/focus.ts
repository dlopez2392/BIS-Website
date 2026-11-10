/**
 * The five things the home page says BIS does, in the order it says them.
 * Copy lives under `home.focus.<id>` in messages/*.json.
 *
 * `ai` is the odd one out in the hero: its panel is the live call (LiveCall),
 * which already is the three layers this page is built on, a conversation,
 * the record it leaves and the line it adds to Monday's report. The other
 * four borrow that same shape with a still example.
 */
export const FOCUS_IDS = ['ai', 'it', 'apps', 'web', 'security'] as const;
export type FocusId = (typeof FOCUS_IDS)[number];

/** The four areas whose hero panel is a still example rather than the call. */
export const STILL_FOCUS_IDS = ['it', 'apps', 'web', 'security'] as const satisfies readonly FocusId[];
export type StillFocusId = (typeof STILL_FOCUS_IDS)[number];

/** Where each area's row, and its hero panel's button, leads. */
export const FOCUS_LINKS: Record<FocusId, string> = {
  ai: '/#talk-to-sofia',
  it: '/how-we-work',
  apps: '/platform',
  web: '/#work',
  security: '/tools/security-check',
};

/** Text keys every area must define in both locales. */
export const focusTextKeys = ['tab', 'title', 'body', 'proofK', 'proof', 'link'] as const;

/** Extra keys the four still panels need. */
export const focusPanelTextKeys = ['head', 'meta', 'status', 'recTitle', 'stripK', 'strip'] as const;

/** A still panel shows this many lines, as the live call does. */
export const FOCUS_PANEL_LINES = 4;
