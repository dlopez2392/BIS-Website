import { db } from '@/db';
import { leads } from '@/db/schema';
import { toLeadRow } from './to-lead-row';
import type { ContactFormValues } from '@/lib/contact-schema';

export async function insertLead(values: ContactFormValues): Promise<{ id: string }> {
  const [row] = await db.insert(leads).values(toLeadRow(values)).returning({ id: leads.id });
  return { id: row.id };
}
