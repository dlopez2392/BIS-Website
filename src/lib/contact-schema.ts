import { z } from 'zod';

export const contactSchema = z.object({
  fullName: z.string().min(1),
  businessName: z.string().min(1),
  email: z.email(),
  phone: z.string().min(1),
  industry: z.enum(['legal', 'health', 'mfg', 'logistics', 'other']),
  language: z.enum(['en', 'es']),
  message: z.string().optional().default(''),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
