import { subscriberSchema, type SubscriberValues } from '@/lib/subscriber-schema';
import type { ReportInput } from '@/lib/observability/report';

export type SubscribeResult = { ok: true } | { ok: false; error: 'invalid' | 'failed' };

export interface SubscribeDeps {
  insertSubscriber: (v: SubscriberValues) => Promise<{ id: string }>;
  sendResourceEmail: (v: SubscriberValues) => Promise<void>;
  /** Where failures go. See src/lib/observability/report.ts. */
  report: (input: ReportInput) => Promise<void>;
}

export async function processSubscription(input: unknown, deps: SubscribeDeps): Promise<SubscribeResult> {
  if (input && typeof input === 'object' && 'website' in input && (input as { website?: unknown }).website) {
    return { ok: true }; // honeypot tripped — silently drop
  }

  const parsed = subscriberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  const sub = parsed.data;

  const [dbResult, mailResult] = await Promise.allSettled([
    deps.insertSubscriber(sub),
    deps.sendResourceEmail(sub),
  ]);
  const captured = dbResult.status === 'fulfilled' || mailResult.status === 'fulfilled';
  if (!captured) {
    // Neither stored nor delivered: the visitor asked for a guide, got an
    // error, and left no trace anyone can follow up on.
    await deps.report({
      event: 'subscribe.lost',
      level: 'critical',
      error: dbResult.status === 'rejected' ? dbResult.reason : mailResult.status === 'rejected' ? mailResult.reason : undefined,
      context: { email: sub.email, resource: sub.resource },
      recovery: { Name: sub.name || '(not given)', Email: sub.email, Guide: sub.resource, Language: sub.locale },
    });
    return { ok: false, error: 'failed' };
  }
  // One path worked, so the visitor is not lost — but a half-failure that
  // nobody looks at becomes a full failure the week the other path breaks too.
  if (dbResult.status === 'rejected') {
    await deps.report({ event: 'subscribe.insert_failed', level: 'error', error: dbResult.reason, context: { email: sub.email } });
  }
  if (mailResult.status === 'rejected') {
    await deps.report({ event: 'subscribe.email_failed', level: 'error', error: mailResult.reason, context: { email: sub.email } });
  }
  return { ok: true };
}
