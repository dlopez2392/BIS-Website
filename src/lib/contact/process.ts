import { contactSchema, type ContactFormValues } from '@/lib/contact-schema';

export type ContactResult = { ok: true } | { ok: false; error: 'invalid' | 'failed' };

export interface ContactDeps {
  insertLead: (v: ContactFormValues) => Promise<{ id: string }>;
  sendLeadNotification: (v: ContactFormValues) => Promise<void>;
  sendThankYou: (v: ContactFormValues) => Promise<void>;
}

export async function processContactSubmission(input: unknown, deps: ContactDeps): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  const lead = parsed.data;

  const [dbResult, notifyResult] = await Promise.allSettled([
    deps.insertLead(lead),
    deps.sendLeadNotification(lead),
  ]);
  const captured = dbResult.status === 'fulfilled' || notifyResult.status === 'fulfilled';
  if (!captured) {
    console.error('[contact] lead not captured — both persistence paths failed', {
      dbError: dbResult.status === 'rejected' ? dbResult.reason : undefined,
      notifyError: notifyResult.status === 'rejected' ? notifyResult.reason : undefined,
    });
    return { ok: false, error: 'failed' };
  }

  // Best-effort thank-you — never affects the result.
  try {
    await deps.sendThankYou(lead);
  } catch (err) {
    console.error('[contact] thank-you email failed (best-effort, lead already captured)', err);
  }

  return { ok: true };
}
