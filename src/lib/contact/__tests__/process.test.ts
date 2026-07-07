import { describe, it, expect, vi } from 'vitest';
import { processContactSubmission, type ContactDeps } from '../process';

const valid = {
  fullName: 'Ana', businessName: 'Acme', email: 'ana@acme.com',
  phone: '956-555-0100', industry: 'legal', language: 'en', message: '',
};

function deps(over: Partial<ContactDeps> = {}): ContactDeps {
  return {
    insertLead: vi.fn().mockResolvedValue({ id: 'lead-1' }),
    sendLeadNotification: vi.fn().mockResolvedValue(undefined),
    sendThankYou: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

describe('processContactSubmission', () => {
  it('happy path: validates, stores, notifies, thanks, returns ok', async () => {
    const d = deps();
    const r = await processContactSubmission(valid, d);
    expect(r).toEqual({ ok: true });
    expect(d.insertLead).toHaveBeenCalledOnce();
    expect(d.sendLeadNotification).toHaveBeenCalledOnce();
    expect(d.sendThankYou).toHaveBeenCalledOnce();
  });

  it('rejects invalid input without storing or emailing', async () => {
    const d = deps();
    const r = await processContactSubmission({ ...valid, email: 'nope' }, d);
    expect(r).toEqual({ ok: false, error: 'invalid' });
    expect(d.insertLead).not.toHaveBeenCalled();
    expect(d.sendLeadNotification).not.toHaveBeenCalled();
  });

  it('still succeeds if the DB insert fails but the notification email sends', async () => {
    const d = deps({ insertLead: vi.fn().mockRejectedValue(new Error('db down')) });
    const r = await processContactSubmission(valid, d);
    expect(r).toEqual({ ok: true });
    expect(d.sendLeadNotification).toHaveBeenCalledOnce();
  });

  it('fails only when both the DB insert and the notification email fail', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const d = deps({
      insertLead: vi.fn().mockRejectedValue(new Error('db down')),
      sendLeadNotification: vi.fn().mockRejectedValue(new Error('mail down')),
    });
    const r = await processContactSubmission(valid, d);
    expect(r).toEqual({ ok: false, error: 'failed' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('a failing thank-you never affects a successful result', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const d = deps({ sendThankYou: vi.fn().mockRejectedValue(new Error('mail down')) });
    const r = await processContactSubmission(valid, d);
    expect(r).toEqual({ ok: true });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
