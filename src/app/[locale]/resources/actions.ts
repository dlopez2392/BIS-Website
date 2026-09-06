'use server';

import { processSubscription, type SubscribeResult } from '@/lib/subscribe/process';
import { insertSubscriber } from '@/lib/subscribe/repository';
import { sendResourceEmail } from '@/lib/email/resend';
import { report } from '@/lib/observability/reporter';
import { checkBotId } from 'botid/server';
import { verifyHuman } from '@/lib/security/verify-human';
import { routing } from '@/i18n/routing';
import { resources } from '@/lib/resources';

/**
 * A server action runs at the path of the page that called it, and that is
 * the path whose client-side challenge BotID will look for. Read defensively
 * off the same payload the form submits, and refuse anything that does not
 * name a real guide in a real language rather than asking about a path that
 * was never armed.
 */
function pagePathFor(input: unknown): string | null {
  const value = input as { locale?: unknown; resource?: unknown } | null;
  const locale = typeof value?.locale === 'string' ? value.locale : '';
  const resource = typeof value?.resource === 'string' ? value.resource : '';
  const known = routing.locales.includes(locale as (typeof routing.locales)[number])
    && resources.some((r) => r.slug === resource);
  return known ? `/${locale}/resources/${resource}` : null;
}

export async function subscribeForResource(input: unknown): Promise<SubscribeResult> {
  const path = pagePathFor(input);
  if (!path) return { ok: false, error: 'invalid' };

  const { allowed } = await verifyHuman({ check: checkBotId, report, path });
  if (!allowed) {
    // Deliberately the ordinary failure, not a silent success: the form then
    // shows its "try again or email us directly" message, so a real person
    // wrongly flagged still has a way to reach BIS. Reported at error level so
    // a run of these is visible rather than assumed to be bots.
    await report({ event: 'subscribe.bot_blocked', level: 'error' });
    return { ok: false, error: 'failed' };
  }
  return processSubscription(input, { insertSubscriber, sendResourceEmail, report });
}
