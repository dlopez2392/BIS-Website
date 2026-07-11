import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, __resetRateLimit } from '../rate-limit';

describe('rateLimit', () => {
  beforeEach(() => __resetRateLimit());
  it('allows up to the limit then blocks the same IP', () => {
    const ip = '1.2.3.4';
    let allowed = 0;
    for (let i = 0; i < 12; i++) if (rateLimit(ip)) allowed++;
    expect(allowed).toBe(10); // LIMIT = 10 per window
    expect(rateLimit(ip)).toBe(false);
    expect(rateLimit('9.9.9.9')).toBe(true); // different IP unaffected
  });
});
