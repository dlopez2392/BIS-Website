import { db } from '@/db';
import { subscribers } from '@/db/schema';
import type { SubscriberValues } from '@/lib/subscriber-schema';

export function toSubscriberRow(v: SubscriberValues) {
  return {
    email: v.email,
    name: v.name ? v.name : null,
    resource: v.resource,
    locale: v.locale,
    newsletterConsent: v.newsletterConsent,
  };
}

export async function insertSubscriber(v: SubscriberValues): Promise<{ id: string }> {
  const [row] = await db.insert(subscribers).values(toSubscriberRow(v)).returning({ id: subscribers.id });
  return { id: row.id };
}
