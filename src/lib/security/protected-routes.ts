import { routing } from '@/i18n/routing';
import { resources } from '@/lib/resources';

/**
 * The endpoints Vercel BotID verifies, and the client-side list that has to
 * match them.
 *
 * Only two things on this site cost BIS money when a script hits them: the
 * chat route, which spends model tokens per message, and the resource form,
 * which writes a subscriber and sends an email. Everything else is a static
 * page that search and answer engines are explicitly invited to crawl, so
 * nothing here touches page requests.
 *
 * The resource paths are derived rather than typed out, because a third guide
 * added to `resources.ts` must not quietly ship unprotected.
 */
export const PROTECTED_ROUTES = [
  { path: '/api/chat', method: 'POST' },
  ...routing.locales.flatMap((locale) =>
    resources.map((r) => ({ path: `/${locale}/resources/${r.slug}`, method: 'POST' })),
  ),
] as const;
