/**
 * Vercel BotID serves its client-side challenge through rewrites that
 * `withBotId()` injects into `next.config.ts`, and those requests arrive on
 * random UUID pairs at the site root — `/149e9513-…/2d206a39-…` — rather than
 * on any path this app declares.
 *
 * Next.js runs middleware BEFORE those rewrites. So the i18n middleware, whose
 * whole job is to send a path with no locale prefix to `/en/<path>`, was
 * redirecting the challenge to `/en/149e9513-…`, which is nothing, and the
 * browser got a 404. The challenge could never be solved, so `checkBotId()`
 * saw no valid solution and classified every real visitor as a bot: 403 on
 * chat, on the security checker, on the guide forms, and on the Sofía voice
 * ticket that finally made it visible.
 *
 * Matching the UUID shape is deliberate over matching a fixed path. BotID
 * changes its challenge on every page load by design, so the segment values
 * are not stable — the SHAPE is what identifies them. No real page on this
 * site is named like a UUID, and if one ever were, it would be a page whose
 * name is a 36-character hex string, which is its own problem.
 */
const UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

/** Anchored at the first segment: `/<uuid>` alone, or `/<uuid>/anything`. */
const BOTID_CHALLENGE = new RegExp(`^/${UUID}(?:/|$)`);

export function isBotIdChallengePath(pathname: string): boolean {
  return BOTID_CHALLENGE.test(pathname);
}

/**
 * The same shape as a Next.js `headers()` / rewrite `source` pattern: every
 * path EXCEPT a BotID challenge. Used to scope this site's CSP off responses
 * that belong to BotID rather than to this app.
 *
 * Kept beside the predicate deliberately. These two express one rule, and the
 * bug they exist for was expensive precisely because the rule was implicit in
 * three different places.
 */
export const NON_BOTID_PATH_SOURCE = `/((?!${UUID}(?:/|$)).*)`;
