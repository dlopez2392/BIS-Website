'use server';

import { processSubscription, type SubscribeResult } from '@/lib/subscribe/process';
import { insertSubscriber } from '@/lib/subscribe/repository';
import { sendResourceEmail } from '@/lib/email/resend';
import { report } from '@/lib/observability/reporter';
import { checkBotId } from 'botid/server';
import { verifyHuman } from '@/lib/security/verify-human';

export async function subscribeForResource(input: unknown): Promise<SubscribeResult> {
  const { allowed } = await verifyHuman({ check: checkBotId, report });
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
