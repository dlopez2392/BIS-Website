import { db } from '@/db';
import { subscribers } from '@/db/schema';
import type { SubscriberValues } from '@/lib/subscriber-schema';
import { toSubscriberRow } from './to-subscriber-row';

export async function insertSubscriber(v: SubscriberValues): Promise<{ id: string }> {
  const [row] = await db.insert(subscribers).values(toSubscriberRow(v)).returning({ id: subscribers.id });
  return { id: row.id };
}
