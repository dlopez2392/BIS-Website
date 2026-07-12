import { z } from 'zod';

export const subscriberSchema = z.object({
  name: z.string().optional().default(''),
  email: z.email(),
  resource: z.string().min(1),
  locale: z.enum(['en', 'es']),
  newsletterConsent: z.boolean().optional().default(false),
});

export type SubscriberValues = z.infer<typeof subscriberSchema>;
export type SubscriberInput = z.input<typeof subscriberSchema>;
