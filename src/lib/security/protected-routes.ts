import { routing } from '@/i18n/routing';
import { resources } from '@/lib/resources';

/**
 * The endpoints Vercel BotID verifies, at what depth, in one table.
 *
 * Three things on this site cost something real when a script hits them: the
 * chat route, which spends model tokens per message; the security checker,
 * which makes requests to other people's servers from BIS's address; and the
 * resource form, which writes a subscriber and sends an email. Everything
 * else is a static page that search and answer engines are explicitly invited
 * to crawl, so nothing here touches page requests.
 *
 * Two rules this table exists to enforce, both of which have already been got
 * wrong once:
 *
 * 1. A path that calls `checkBotId()` on the server MUST appear here, because
 *    this list is what arms the client-side challenge. The security checker
 *    shipped without its page listed, which means the server was asking about
 *    a challenge the browser was never told to solve.
 * 2. The check level MUST be identical on both sides. Vercel's documentation
 *    is explicit that a mismatch fails verification and can block real
 *    visitors, so server call sites read their level from `checkLevelFor()`
 *    rather than passing a literal that can drift from this list.
 */

export type CheckLevel = 'basic' | 'deepAnalysis';

/**
 * Deep Analysis is a paid Pro feature, billed per `checkBotId()` call that
 * passes the free basic check, so it is spent where a bot getting through
 * costs more than the check does — not everywhere by default.
 *
 * Chat, because every message that reaches the model costs tokens, and
 * headless browsers are exactly what basic verification is weakest against.
 * The security checker, because abusing it turns BIS's own address into a
 * scanning service pointed at third parties, which is a reputation problem
 * rather than a billing one.
 *
 * The resource form stays basic: the worst a bot achieves there is a junk
 * subscriber row and one email, and the honeypot and rate limit already
 * cover it.
 */
const CHAT: CheckLevel = 'deepAnalysis';
const SECURITY_CHECK: CheckLevel = 'deepAnalysis';
const RESOURCE_FORM: CheckLevel = 'basic';

export interface ProtectedRoute {
  path: string;
  method: 'POST';
  advancedOptions: { checkLevel: CheckLevel };
}

/**
 * A server action runs at the path of the page that invokes it, so the tool
 * and guide pages are listed by page path rather than by any endpoint name.
 * Both are derived from the locale and resource lists, so a new language or a
 * third guide cannot quietly ship unprotected.
 */
export const PROTECTED_ROUTES: readonly ProtectedRoute[] = [
  { path: '/api/chat', method: 'POST', advancedOptions: { checkLevel: CHAT } },
  ...routing.locales.map((locale) => ({
    path: `/${locale}/tools/security-check`,
    method: 'POST' as const,
    advancedOptions: { checkLevel: SECURITY_CHECK },
  })),
  ...routing.locales.flatMap((locale) =>
    resources.map((r) => ({
      path: `/${locale}/resources/${r.slug}`,
      method: 'POST' as const,
      advancedOptions: { checkLevel: RESOURCE_FORM },
    })),
  ),
];

/**
 * The level the client challenge was armed with for a path, for the server to
 * ask with. Throws rather than guessing: a path that calls `checkBotId()`
 * without being in this table is the bug described above, and it should fail
 * loudly in a test rather than quietly at a visitor.
 */
export function checkLevelFor(path: string): CheckLevel {
  const route = PROTECTED_ROUTES.find((r) => r.path === path);
  if (!route) throw new Error(`${path} calls checkBotId() but is not in PROTECTED_ROUTES`);
  return route.advancedOptions.checkLevel;
}

/** Path constants, so a call site cannot typo its way out of protection. */
export const CHAT_ROUTE = '/api/chat';
export const securityCheckPath = (locale: string) => `/${locale}/tools/security-check`;
