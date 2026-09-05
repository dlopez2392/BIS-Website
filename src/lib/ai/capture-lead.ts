import { z } from 'zod';
import type { ContactFormValues } from '@/lib/contact-schema';
import type { ReportInput } from '@/lib/observability/report';

export const captureLeadSchema = z.object({
  fullName: z.string().min(1),
  email: z.email(),
  need: z.string().min(1),
  language: z.enum(['en', 'es']),
});
export type CaptureLeadArgs = z.infer<typeof captureLeadSchema>;

export interface CaptureDeps {
  insertLead: (v: ContactFormValues) => Promise<{ id: string }>;
  sendLeadNotification: (v: ContactFormValues) => Promise<void>;
  /** Where failures go. See src/lib/observability/report.ts. */
  report: (input: ReportInput) => Promise<void>;
}

export async function processCapturedLead(
  args: CaptureLeadArgs,
  deps: CaptureDeps,
): Promise<{ ok: boolean; message: string }> {
  const lead: ContactFormValues = {
    fullName: args.fullName,
    businessName: '',
    email: args.email,
    phone: '',
    industry: 'other',
    language: args.language,
    message: `[via AI assistant] ${args.need}`,
  };
  try {
    await deps.insertLead(lead);
  } catch (err) {
    // A person typed their details into the assistant and the database refused
    // them. That is a lost customer unless someone is told, so the alert
    // carries everything needed to answer them by hand.
    await deps.report({
      event: 'lead.insert_failed',
      level: 'critical',
      error: err,
      context: { source: 'assistant', email: lead.email },
      recovery: { Name: lead.fullName, Email: lead.email, Language: lead.language, Need: args.need },
    });
    return { ok: false, message: 'Sorry — something went wrong saving your details. Please email us instead.' };
  }
  try {
    await deps.sendLeadNotification(lead);
  } catch (err) {
    // The lead is safe in the database; only the heads-up email failed.
    await deps.report({ event: 'lead.notify_failed', level: 'error', error: err, context: { source: 'assistant' } });
  }
  return { ok: true, message: 'Saved. Our team will follow up shortly.' };
}
