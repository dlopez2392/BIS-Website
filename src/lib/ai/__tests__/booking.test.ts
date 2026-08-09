import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UIMessage } from 'ai';
import { alreadyBookedInConversation, runBookAssessment, type BookingDeps } from '../booking';

const ctx = { ip: '1.2.3.4', timeZone: 'America/New_York', language: 'en' as const };
const args = {
  startsAt: '2026-08-12T13:00:00.000Z',
  fullName: 'Dan Lopez',
  email: 'dan@example.com',
};

function deps(over: Partial<BookingDeps> = {}): BookingDeps {
  return {
    book: vi.fn(async () => ({ uid: 'abc123', startsAt: '2026-08-12T13:00:00.000Z' })),
    allowBooking: vi.fn(async () => ({ ok: true })),
    insertLead: vi.fn(async () => ({ id: 'lead-1' })),
    sendLeadNotification: vi.fn(async () => {}),
    ...over,
  };
}

const msg = (parts: unknown[]) => ({ id: 'm', role: 'assistant', parts } as unknown as UIMessage);

beforeEach(() => vi.restoreAllMocks());

describe('alreadyBookedInConversation', () => {
  it('spots a successful booking earlier in the thread', () => {
    expect(alreadyBookedInConversation([msg([{ type: 'tool-book_assessment', output: { ok: true } }])])).toBe(true);
  });

  it('ignores a failed booking attempt, so the visitor can retry', () => {
    expect(alreadyBookedInConversation([msg([{ type: 'tool-book_assessment', output: { ok: false } }])])).toBe(false);
  });

  it('ignores other tools and plain text', () => {
    expect(
      alreadyBookedInConversation([
        msg([{ type: 'text', text: 'book me' }]),
        msg([{ type: 'tool-check_availability', output: { slots: [] } }]),
      ]),
    ).toBe(false);
  });

  it('survives messages with no parts', () => {
    expect(alreadyBookedInConversation([{ id: 'x', role: 'user' } as unknown as UIMessage])).toBe(false);
  });
});

describe('runBookAssessment', () => {
  it('books, then records the lead and notifies', async () => {
    const d = deps();
    const res = await runBookAssessment(args, ctx, d, { alreadyBooked: false });

    expect(res).toEqual({ ok: true, uid: 'abc123', startsAt: '2026-08-12T13:00:00.000Z' });
    expect(d.book).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Dan Lopez', email: 'dan@example.com', timeZone: 'America/New_York' }),
    );
    // A booking with no lead is an invisible calendar event — the defect the
    // phone channel shipped as "Unknown caller".
    expect(d.insertLead).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'Dan Lopez', email: 'dan@example.com', language: 'en' }),
    );
    expect(d.sendLeadNotification).toHaveBeenCalled();
  });

  it('records the booked time in the lead message so the row is self-explanatory', async () => {
    const d = deps();
    await runBookAssessment(args, ctx, d, { alreadyBooked: false });
    const lead = (d.insertLead as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(lead.message).toContain('2026-08-12T13:00:00.000Z');
    expect(lead.message).toContain('[via AI assistant');
  });

  it('refuses a second booking in the same conversation without calling Cal', async () => {
    const d = deps();
    const res = await runBookAssessment(args, ctx, d, { alreadyBooked: true });
    expect(res.ok).toBe(false);
    expect(d.book).not.toHaveBeenCalled();
  });

  it('refuses when the daily cap says no, and does not call Cal', async () => {
    const d = deps({ allowBooking: vi.fn(async () => ({ ok: false, reason: 'ip-daily' })) });
    const res = await runBookAssessment(args, ctx, d, { alreadyBooked: false });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/booking link/i);
    expect(d.book).not.toHaveBeenCalled();
  });

  it('returns Cal’s reason as something the model can act on, not a thrown error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const d = deps({ book: vi.fn(async () => { throw new Error('no_available_users_found_error'); }) });
    const res = await runBookAssessment(args, ctx, d, { alreadyBooked: false });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain('no_available_users_found_error');
      expect(res.error).toMatch(/another time|booking link/i);
    }
    expect(d.insertLead).not.toHaveBeenCalled();
  });

  it('still reports success when the lead write fails after a real booking', async () => {
    // The appointment exists on Cal. Telling the visitor it failed would be a
    // lie that costs them the slot; the log is the alert.
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const d = deps({ insertLead: vi.fn(async () => { throw new Error('neon down'); }) });
    const res = await runBookAssessment(args, ctx, d, { alreadyBooked: false });
    expect(res.ok).toBe(true);
    expect(err).toHaveBeenCalled();
  });

  it('still reports success when only the notification fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const d = deps({ sendLeadNotification: vi.fn(async () => { throw new Error('resend down'); }) });
    expect((await runBookAssessment(args, ctx, d, { alreadyBooked: false })).ok).toBe(true);
  });

  it('passes an optional phone through and defaults it to empty on the lead', async () => {
    const withPhone = deps();
    await runBookAssessment({ ...args, phone: '956-292-1696' }, ctx, withPhone, { alreadyBooked: false });
    expect(withPhone.book).toHaveBeenCalledWith(expect.objectContaining({ phone: '956-292-1696' }));

    const without = deps();
    await runBookAssessment(args, ctx, without, { alreadyBooked: false });
    const lead = (without.insertLead as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(lead.phone).toBe('');
  });
});
