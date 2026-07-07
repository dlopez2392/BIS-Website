'use server';

import { processContactSubmission, type ContactResult } from '@/lib/contact/process';
import { insertLead } from '@/lib/contact/repository';
import { sendLeadNotification, sendThankYou } from '@/lib/email/resend';

export async function submitContact(input: unknown): Promise<ContactResult> {
  return processContactSubmission(input, { insertLead, sendLeadNotification, sendThankYou });
}
