import { describe, it, expect } from 'vitest';
import { signTicket } from './ticket';

/**
 * The platform verifies what this signs, so the wire format is a contract
 * between two repositories. The identical vector is pinned there
 * (apps/web/src/lib/voice/web-demo.test.ts). A change here that is not made
 * there in the same breath presents as every visitor being refused, with a
 * correct-looking implementation on each side.
 */
describe('signTicket (cross-repo wire format)', () => {
  const VECTOR = '1760000000000.fixed-nonce.xgIR3steZ0rRu0fARbJMOaGgrAz4cQjf-GFc8wGYd74';

  it('signs the pinned vector exactly', () => {
    expect(signTicket('fixture-secret', 1_760_000_000_000, 'fixed-nonce')).toBe(VECTOR);
  });

  it('is three dot-separated parts', () => {
    expect(signTicket('s', 1, 'n').split('.')).toHaveLength(3);
  });

  it('carries the timestamp it was given, in the clear', () => {
    expect(signTicket('s', 1_700_000_000_000, 'n').startsWith('1700000000000.')).toBe(true);
  });

  it('signs the timestamp, so editing it invalidates the ticket', () => {
    const a = signTicket('s', 1_700_000_000_000, 'n').split('.')[2];
    const b = signTicket('s', 1_700_000_000_001, 'n').split('.')[2];
    expect(a).not.toBe(b);
  });

  it('gives different signatures under different secrets', () => {
    expect(signTicket('one', 1, 'n')).not.toBe(signTicket('two', 1, 'n'));
  });

  it('uses a fresh nonce per call when none is given', () => {
    expect(signTicket('s')).not.toBe(signTicket('s'));
  });

  it('is URL-safe — no +, / or = to be mangled in transit', () => {
    for (let i = 0; i < 40; i++) {
      expect(signTicket('s')).not.toMatch(/[+/=]/);
    }
  });
});
