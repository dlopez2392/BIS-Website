import { z } from 'zod';
import type { ContactFormValues } from '@/lib/contact-schema';

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
    console.error('[assistant] capture_lead insert failed', err);
    return { ok: false, message: 'Sorry — something went wrong saving your details. Please email us instead.' };
  }
  try {
    await deps.sendLeadNotification(lead);
  } catch (err) {
    console.error('[assistant] capture_lead notification failed (best-effort)', err);
  }
  return { ok: true, message: 'Saved. Our team will follow up shortly.' };
}
