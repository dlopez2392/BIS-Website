import { describe, it, expect, vi } from 'vitest';
import { processCapturedLead, captureLeadSchema, type CaptureDeps } from '../capture-lead';

const args = { fullName: 'Ana Reyes', email: 'ana@reyeslaw.com', need: 'AI intake for my law firm', language: 'en' as const };

function deps(over: Partial<CaptureDeps> = {}): CaptureDeps {
  return {
    insertLead: vi.fn().mockResolvedValue({ id: 'lead-1' }),
    sendLeadNotification: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

describe('captureLeadSchema', () => {
  it('rejects an invalid email', () => {
    expect(captureLeadSchema.safeParse({ ...args, email: 'nope' }).success).toBe(false);
  });
});

describe('processCapturedLead', () => {
  it('maps to a lead row, inserts, notifies, returns ok', async () => {
    const d = deps();
    const r = await processCapturedLead(args, d);
    expect(r.ok).toBe(true);
    expect(d.insertLead).toHaveBeenCalledWith(expect.objectContaining({
      fullName: 'Ana Reyes', email: 'ana@reyeslaw.com', businessName: '', phone: '',
      industry: 'other', language: 'en', message: '[via AI assistant] AI intake for my law firm',
    }));
    expect(d.sendLeadNotification).toHaveBeenCalledOnce();
  });

  it('still returns ok if the notification email fails (best-effort)', async () => {
    const d = deps({ sendLeadNotification: vi.fn().mockRejectedValue(new Error('mail down')) });
    const r = await processCapturedLead(args, d);
    expect(r.ok).toBe(true);
  });

  it('returns not-ok if the DB insert fails', async () => {
    const d = deps({ insertLead: vi.fn().mockRejectedValue(new Error('db down')) });
    const r = await processCapturedLead(args, d);
    expect(r.ok).toBe(false);
  });
});
