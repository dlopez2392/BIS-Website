'use server';

import { processSubscription, type SubscribeResult } from '@/lib/subscribe/process';
import { insertSubscriber } from '@/lib/subscribe/repository';
import { sendResourceEmail } from '@/lib/email/resend';

export async function subscribeForResource(input: unknown): Promise<SubscribeResult> {
  return processSubscription(input, { insertSubscriber, sendResourceEmail });
}
