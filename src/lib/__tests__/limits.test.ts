import { describe, it, expect, vi } from 'vitest';
import {
  makeLimits,
  createMemoryCounter,
  CHAT_PER_MINUTE,
  BOOKINGS_PER_IP_PER_DAY,
  BOOKINGS_PER_DAY,
  type Counter,
} from '../limits';

/** Records every key/ttl it sees so tests can assert namespacing and expiry. */
function recordingCounter(): Counter & { calls: Array<{ key: string; ttl: number }> } {
  const counts = new Map<string, number>();
  const calls: Array<{ key: string; ttl: number }> = [];
  return {
    calls,
    async incr(key, ttl) {
      calls.push({ key, ttl });
      const next = (counts.get(key) ?? 0) + 1;
      counts.set(key, next);
      return next;
    },
  };
}

const AT = new Date('2026-08-08T18:30:00.000Z');
const now = () => AT;

describe('allowChat', () => {
  it('allows up to the per-minute limit and then refuses', async () => {
    const limits = makeLimits(recordingCounter(), now);
    for (let i = 0; i < CHAT_PER_MINUTE; i++) {
      expect(await limits.allowChat('1.2.3.4'), `request ${i + 1}`).toBe(true);
    }
    expect(await limits.allowChat('1.2.3.4')).toBe(false);
  });

  it('counts each visitor separately', async () => {
    const limits = makeLimits(recordingCounter(), now);
    for (let i = 0; i < CHAT_PER_MINUTE; i++) await limits.allowChat('1.2.3.4');
    expect(await limits.allowChat('1.2.3.4')).toBe(false);
    expect(await limits.allowChat('5.6.7.8')).toBe(true);
  });

  it('namespaces its keys under web: and expires them after a minute', async () => {
    const counter = recordingCounter();
    await makeLimits(counter, now).allowChat('1.2.3.4');
    expect(counter.calls[0].key).toBe('web:rl:chat:1.2.3.4');
    expect(counter.calls[0].ttl).toBe(60);
  });
});

describe('allowBooking', () => {
  it('allows a first booking and reports which cap refused a later one', async () => {
    const limits = makeLimits(recordingCounter(), now);
    for (let i = 0; i < BOOKINGS_PER_IP_PER_DAY; i++) {
      expect((await limits.allowBooking('1.2.3.4')).ok, `booking ${i + 1}`).toBe(true);
    }
    expect(await limits.allowBooking('1.2.3.4')).toEqual({ ok: false, reason: 'ip-daily' });
  });

  it('applies a global daily cap across different visitors', async () => {
    const limits = makeLimits(recordingCounter(), now);
    // Distinct IPs so the per-IP cap never fires and the global one must.
    for (let i = 0; i < BOOKINGS_PER_DAY; i++) {
      expect((await limits.allowBooking(`10.0.0.${i}`)).ok, `booking ${i + 1}`).toBe(true);
    }
    expect(await limits.allowBooking('10.0.1.1')).toEqual({ ok: false, reason: 'global-daily' });
  });

  it('does not consume global budget when the per-IP cap already refused', async () => {
    const counter = recordingCounter();
    const limits = makeLimits(counter, now);
    for (let i = 0; i < BOOKINGS_PER_IP_PER_DAY; i++) await limits.allowBooking('1.2.3.4');
    const before = counter.calls.filter((c) => c.key.includes(':book:day:')).length;
    await limits.allowBooking('1.2.3.4');
    const after = counter.calls.filter((c) => c.key.includes(':book:day:')).length;
    expect(after).toBe(before);
  });

  it('keys the daily caps by date and expires them within a day', async () => {
    const counter = recordingCounter();
    await makeLimits(counter, now).allowBooking('1.2.3.4');
    const keys = counter.calls.map((c) => c.key);
    expect(keys).toContain('web:rl:book:ip:1.2.3.4:2026-08-08');
    expect(keys).toContain('web:rl:book:day:2026-08-08');
    for (const call of counter.calls) expect(call.ttl).toBeLessThanOrEqual(86_400);
  });
});

describe('when the counter is broken', () => {
  const exploding: Counter = {
    async incr() {
      throw new Error('redis unreachable');
    },
  };

  it('lets chat through rather than silencing the assistant', async () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
    const limits = makeLimits(exploding, now);
    expect(await limits.allowChat('1.2.3.4')).toBe(true);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('lets a booking through rather than losing a prospect', async () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
    const limits = makeLimits(exploding, now);
    expect((await limits.allowBooking('1.2.3.4')).ok).toBe(true);
    warn.mockRestore();
  });
});

describe('createMemoryCounter', () => {
  it('counts within the window and forgets after it', async () => {
    let t = 1_000_000;
    const counter = createMemoryCounter(() => t);
    expect(await counter.incr('k', 60)).toBe(1);
    expect(await counter.incr('k', 60)).toBe(2);
    t += 61_000;
    expect(await counter.incr('k', 60)).toBe(1);
  });
});
