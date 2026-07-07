import { Resend } from 'resend';
import { ThankYou } from '@/emails/ThankYou';
import { LeadNotification } from '@/emails/LeadNotification';
import { thankYouSubject, type EmailLocale } from '@/emails/messages';
import type { ContactFormValues } from '@/lib/contact-schema';

function client(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendThankYou(lead: ContactFormValues): Promise<void> {
  const locale = lead.language as EmailLocale;
  const { error } = await client().emails.send({
    from: process.env.CONTACT_FROM ?? 'onboarding@resend.dev',
    to: lead.email,
    replyTo: process.env.CONTACT_REPLY_TO ?? 'bespokeintelligentsolutions@gmail.com',
    subject: thankYouSubject(locale),
    react: ThankYou({ locale, fullName: lead.fullName }),
  });
  if (error) throw new Error(error.message);
}

export async function sendLeadNotification(lead: ContactFormValues): Promise<void> {
  const { error } = await client().emails.send({
    from: process.env.CONTACT_FROM ?? 'onboarding@resend.dev',
    to: process.env.CONTACT_NOTIFY_TO ?? 'bespokeintelligentsolutions@gmail.com',
    replyTo: lead.email,
    subject: `New assessment request — ${lead.businessName}`,
    react: LeadNotification({ lead }),
  });
  if (error) throw new Error(error.message);
}
