import { describe, it, expect, vi, beforeEach } from 'vitest';

const send = vi.fn();
// NOTE: must be a `function` expression (not an arrow fn) — this vitest version
// (4.1.9) forwards `new Resend(...)` to the mock implementation via
// Reflect.construct, which requires a constructible function. Arrow functions
// are never constructible in JS, so `vi.fn(() => ({...}))` throws
// "is not a constructor" when the implementation calls `new Resend(...)`.
// See task-4-report.md for details.
vi.mock('resend', () => ({ Resend: vi.fn(function () { return { emails: { send } }; }) }));

const lead = {
  fullName: 'Ana Reyes', businessName: 'Reyes Law', email: 'ana@reyeslaw.com',
  phone: '956-555-0100', industry: 'legal' as const, language: 'es' as const, message: '',
};

describe('resend sender', () => {
  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({ data: { id: 'email-1' }, error: null });
    process.env.RESEND_API_KEY = 'test-key';
    process.env.CONTACT_FROM = 'BIS <hello@bis-rgv.com>';
    process.env.CONTACT_NOTIFY_TO = 'bespokeintelligentsolutions@gmail.com';
    process.env.CONTACT_REPLY_TO = 'bespokeintelligentsolutions@gmail.com';
  });

  it('sends the notification to the company inbox with the prospect as reply-to', async () => {
    const { sendLeadNotification } = await import('../resend');
    await sendLeadNotification(lead);
    const arg = send.mock.calls[0][0];
    expect(arg.to).toBe('bespokeintelligentsolutions@gmail.com');
    expect(arg.from).toBe('BIS <hello@bis-rgv.com>');
    expect(arg.replyTo).toBe('ana@reyeslaw.com');
    expect(arg.subject).toContain('Reyes Law');
    expect(arg.react).toBeTruthy();
  });

  it('falls back to the person when there is no business name', async () => {
    // Every assistant-captured and chat-booked lead has businessName '', which
    // left the subject ending in a dangling "— ".
    const { sendLeadNotification } = await import('../resend');
    await sendLeadNotification({ ...lead, businessName: '' });
    const arg = send.mock.calls[0][0];
    expect(arg.subject).toContain('Ana Reyes');
    expect(arg.subject).not.toMatch(/—\s*$/);
  });

  it('throws when Resend returns an error', async () => {
    send.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    const { sendLeadNotification } = await import('../resend');
    await expect(sendLeadNotification(lead)).rejects.toThrow('boom');
  });
});
