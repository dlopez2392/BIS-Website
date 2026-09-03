import { describe, it, expect, vi } from 'vitest';
import {
  makeLimits,
  createMemoryCounter,
  CHAT_PER_MINUTE,
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

describe('allowChat', () => {
  it('allows up to the per-minute limit and then refuses', async () => {
    const limits = makeLimits(recordingCounter());
    for (let i = 0; i < CHAT_PER_MINUTE; i++) {
      expect(await limits.allowChat('1.2.3.4'), `request ${i + 1}`).toBe(true);
    }
    expect(await limits.allowChat('1.2.3.4')).toBe(false);
  });

  it('counts each visitor separately', async () => {
    const limits = makeLimits(recordingCounter());
    for (let i = 0; i < CHAT_PER_MINUTE; i++) await limits.allowChat('1.2.3.4');
    expect(await limits.allowChat('1.2.3.4')).toBe(false);
    expect(await limits.allowChat('5.6.7.8')).toBe(true);
  });

  it('namespaces its keys under web: and expires them after a minute', async () => {
    const counter = recordingCounter();
    await makeLimits(counter).allowChat('1.2.3.4');
    expect(counter.calls[0].key).toBe('web:rl:chat:1.2.3.4');
    expect(counter.calls[0].ttl).toBe(60);
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
    const limits = makeLimits(exploding);
    expect(await limits.allowChat('1.2.3.4')).toBe(true);
    expect(warn).toHaveBeenCalled();
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
