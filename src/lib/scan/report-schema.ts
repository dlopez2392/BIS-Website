import { z } from 'zod';

export const reportRequestSchema = z.object({
  domain: z.string().min(1).max(253),
  email: z.email(),
  name: z.string().max(120).optional().default(''),
  locale: z.enum(['en', 'es']),
  /** Honeypot: a real person never fills a field they cannot see. */
  website: z.string().optional().default(''),
});

export type ReportRequest = z.infer<typeof reportRequestSchema>;
export type ReportRequestInput = z.input<typeof reportRequestSchema>;

export type ReportResult =
  | { ok: true }
  | { ok: false; error: 'invalid' | 'rate-limited' | 'unreachable' | 'failed' };
