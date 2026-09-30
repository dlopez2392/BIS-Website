import { describe, it, expect, vi } from 'vitest';
import {
  makeLimits,
  createMemoryCounter,
  SCANS_PER_WINDOW,
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

describe('allowScan', () => {
  it('allows up to the window limit and then refuses', async () => {
    const limits = makeLimits(recordingCounter());
    for (let i = 0; i < SCANS_PER_WINDOW; i++) {
      expect(await limits.allowScan('1.2.3.4'), `request ${i + 1}`).toBe(true);
    }
    expect(await limits.allowScan('1.2.3.4')).toBe(false);
  });

  it('counts each visitor separately, under the web: namespace', async () => {
    const counter = recordingCounter();
    const limits = makeLimits(counter);
    for (let i = 0; i < SCANS_PER_WINDOW; i++) await limits.allowScan('1.2.3.4');
    expect(await limits.allowScan('1.2.3.4')).toBe(false);
    expect(await limits.allowScan('5.6.7.8')).toBe(true);
    expect(counter.calls[0].key).toBe('web:rl:scan:1.2.3.4');
  });
});

describe('when the counter is broken', () => {
  const exploding: Counter = {
    async incr() {
      throw new Error('redis unreachable');
    },
  };

  it('lets a scan through rather than turning a visitor away', async () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
    const limits = makeLimits(exploding);
    expect(await limits.allowScan('1.2.3.4')).toBe(true);
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
