import { describe, it, expect } from 'vitest';
import { telHref, formatUsPhone } from '../phone';
import { business } from '@/lib/seo/business';

describe('telHref', () => {
  it('builds a dialable tel: URI from the stored number', () => {
    expect(telHref('+1-956-705-5146')).toBe('tel:+19567055146');
  });

  it('drops punctuation and spacing', () => {
    expect(telHref('+1 (956) 705-5146')).toBe('tel:+19567055146');
  });

  it('is idempotent on an already-clean number', () => {
    expect(telHref('+19567055146')).toBe('tel:+19567055146');
  });

  it('assumes US when no country code is present', () => {
    expect(telHref('956-705-5146')).toBe('tel:+19567055146');
  });
});

describe('formatUsPhone', () => {
  it('renders a US number in (AAA) BBB-CCCC form', () => {
    expect(formatUsPhone('+1-956-705-5146')).toBe('(956) 705-5146');
  });

  it('accepts an unpunctuated number', () => {
    expect(formatUsPhone('+19567055146')).toBe('(956) 705-5146');
  });

  it('accepts a bare 10-digit national number', () => {
    expect(formatUsPhone('9567055146')).toBe('(956) 705-5146');
  });

  it('returns the input unchanged when it is not a US number', () => {
    expect(formatUsPhone('+44 20 7946 0958')).toBe('+44 20 7946 0958');
  });
});

describe('the configured business number', () => {
  // Guards the launch placeholder from creeping back into JSON-LD, where it
  // was published to Google for weeks before this change.
  it('is the real Sofia line, not the placeholder', () => {
    expect(business.phone).not.toContain('000-0000');
    expect(telHref(business.phone)).toBe('tel:+19567055146');
    expect(formatUsPhone(business.phone)).toBe('(956) 705-5146');
  });
});
