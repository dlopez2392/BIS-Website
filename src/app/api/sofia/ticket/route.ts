import { after } from 'next/server';
import { checkBotId } from 'botid/server';
import { verifyHuman } from '@/lib/security/verify-human';
import { SOFIA_TICKET_ROUTE } from '@/lib/security/protected-routes';
import { getLimits } from '@/lib/limits';
import { signTicket } from '@/lib/sofia/ticket';
import { report } from '@/lib/observability/reporter';

/**
 * Vouches for a visitor so the platform will open a voice session with Sofía.
 *
 * This route holds the two guards, in the order the chat route established:
 * the bot check first, because a script that never reaches a paid session
 * costs nothing and must not consume a real visitor's share of the window;
 * then the per-IP limit. Only after both does it sign a short-lived ticket.
 * The platform verifies that signature and mints the actual OpenAI credential
 * — this route never sees an OpenAI key and never talks to OpenAI.
 *
 * Deep Analysis, the same level as chat, for a stronger reason: a session here
 * bills by the minute rather than once per message, and headless browsers are
 * exactly what basic verification is weakest against.
 */
export async function POST(req: Request) {
  const { allowed } = await verifyHuman({ check: checkBotId, report, path: SOFIA_TICKET_ROUTE });
  if (!allowed) {
    after(() => report({ event: 'sofia.bot_blocked', level: 'error' }));
    return Response.json({ error: 'denied' }, { status: 403 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limits = await getLimits();
  if (!(await limits.allowSofiaSession(ip))) {
    return Response.json({ error: 'rate_limited' }, { status: 429 });
  }

  const secret = process.env.SOFIA_WEB_SECRET;
  const sessionUrl = process.env.NEXT_PUBLIC_SOFIA_SESSION_URL;
  if (!secret || !sessionUrl) {
    // 503 and nothing else. The button is hidden when this happens, so an
    // unconfigured deployment simply does not offer the feature — it never
    // offers it and then fails in the visitor's face.
    after(() => report({
      event: 'sofia.unconfigured', level: 'error',
      context: { hasSecret: String(!!secret), hasSessionUrl: String(!!sessionUrl) },
    }));
    return Response.json({ error: 'unavailable' }, { status: 503 });
  }

  return Response.json({ ticket: signTicket(secret), sessionUrl }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
