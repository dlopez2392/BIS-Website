import { describe, it, expect } from 'vitest';
import { contactSchema } from '@/lib/contact-schema';

describe('contactSchema', () => {
  it('accepts a valid submission', () => {
    const r = contactSchema.safeParse({
      fullName: 'Ana', businessName: 'Acme', email: 'ana@acme.com',
      phone: '956-555-0100', industry: 'legal', language: 'es', message: '',
    });
    expect(r.success).toBe(true);
  });
  it('rejects a bad email and missing name', () => {
    const r = contactSchema.safeParse({
      fullName: '', businessName: 'Acme', email: 'nope', phone: '956', industry: 'legal', language: 'en',
    });
    expect(r.success).toBe(false);
  });
});
