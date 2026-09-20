import { describe, it, expect, vi } from 'vitest';
import { captureLeadSchema, processCapturedLead, type CaptureDeps } from '../capture-lead';

const ARGS = {
  firstName: 'Ana', lastName: 'Garza', businessName: 'Garza HVAC',
  email: 'ana@example.com', phone: '(956) 555-0134', need: 'Missed calls after hours', language: 'en' as const,
};

function deps(over: Partial<CaptureDeps> = {}): CaptureDeps {
  return {
    submitToPlatform: vi.fn().mockResolvedValue({ ok: true, submissionId: 'sub_1' }),
    insertLead: vi.fn().mockResolvedValue({ id: 'lead-1' }),
    sendLeadNotification: vi.fn().mockResolvedValue(undefined),
    report: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

describe('captureLeadSchema', () => {
  it('requires the same five things the contact form requires', () => {
    expect(captureLeadSchema.safeParse(ARGS).success).toBe(true);
    for (const key of ['firstName', 'businessName', 'email', 'phone', 'need'] as const) {
      expect(captureLeadSchema.safeParse({ ...ARGS, [key]: '' }).success, key).toBe(false);
    }
    expect(captureLeadSchema.safeParse({ ...ARGS, email: 'nope' }).success).toBe(false);
    // The last name is the one thing a person may not offer.
    expect(captureLeadSchema.parse({ ...ARGS, lastName: undefined }).lastName).toBe('');
  });
});

describe('processCapturedLead', () => {
  it('files the lead in the CRM, shaped for the platform, and touches nothing else', async () => {
    const d = deps();
    const result = await processCapturedLead(ARGS, d);
    expect(result).toEqual({ ok: true, message: expect.stringMatching(/Saved/) });
    expect(d.submitToPlatform).toHaveBeenCalledWith({
      locale: 'en', firstName: 'Ana', lastName: 'Garza', businessName: 'Garza HVAC',
      email: 'ana@example.com', phone: '(956) 555-0134', need: 'Missed calls after hours',
    });
    expect(d.insertLead).not.toHaveBeenCalled();
    expect(d.sendLeadNotification).not.toHaveBeenCalled();
    expect(d.report).not.toHaveBeenCalled();
  });

  it('falls back to the legacy store and the email when the platform refuses, and says so', async () => {
    const d = deps({ submitToPlatform: vi.fn().mockRejectedValue(new Error('intake 503')) });
    const result = await processCapturedLead(ARGS, d);
    expect(result.ok).toBe(true);
    expect(d.report).toHaveBeenCalledWith(expect.objectContaining({ event: 'lead.platform_intake_failed', level: 'error' }));
    expect(d.insertLead).toHaveBeenCalledWith(expect.objectContaining({
      fullName: 'Ana Garza', businessName: 'Garza HVAC', email: 'ana@example.com', phone: '(956) 555-0134',
      language: 'en', message: '[via AI assistant] Missed calls after hours',
    }));
    expect(d.sendLeadNotification).toHaveBeenCalledOnce();
  });

  it('still returns ok if the fallback notification email fails, and records it as recoverable', async () => {
    const d = deps({
      submitToPlatform: vi.fn().mockRejectedValue(new Error('intake 503')),
      sendLeadNotification: vi.fn().mockRejectedValue(new Error('mail down')),
    });
    const result = await processCapturedLead(ARGS, d);
    expect(result.ok).toBe(true);
    expect(d.report).toHaveBeenCalledWith(expect.objectContaining({ event: 'lead.notify_failed', level: 'error' }));
  });

  it('raises a critical alert carrying enough to answer the lead by hand when both stores refuse', async () => {
    const d = deps({
      submitToPlatform: vi.fn().mockRejectedValue(new Error('intake 503')),
      insertLead: vi.fn().mockRejectedValue(new Error('db down')),
    });
    const result = await processCapturedLead(ARGS, d);
    expect(result.ok).toBe(false);
    expect(d.report).toHaveBeenCalledWith(expect.objectContaining({
      event: 'lead.insert_failed', level: 'critical',
      recovery: expect.objectContaining({ Name: 'Ana Garza', Business: 'Garza HVAC', Email: 'ana@example.com', Phone: '(956) 555-0134', Need: 'Missed calls after hours' }),
    }));
  });
});
