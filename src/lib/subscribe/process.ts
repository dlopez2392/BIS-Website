import { subscriberSchema, type SubscriberValues } from '@/lib/subscriber-schema';

export type SubscribeResult = { ok: true } | { ok: false; error: 'invalid' | 'failed' };

export interface SubscribeDeps {
  insertSubscriber: (v: SubscriberValues) => Promise<{ id: string }>;
  sendResourceEmail: (v: SubscriberValues) => Promise<void>;
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
    console.error('[subscribe] not captured — both paths failed', {
      dbError: dbResult.status === 'rejected' ? dbResult.reason : undefined,
      mailError: mailResult.status === 'rejected' ? mailResult.reason : undefined,
    });
    return { ok: false, error: 'failed' };
  }
  return { ok: true };
}
