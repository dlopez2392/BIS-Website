import { describe, it, expect } from 'vitest';
import { siteVerification } from '../verification';

describe('siteVerification', () => {
  it('emits nothing at all when no token is configured', () => {
    // An empty verification object would render a meaningless meta tag.
    expect(siteVerification({})).toBeUndefined();
  });

  it('emits only the engine that has a token', () => {
    expect(siteVerification({ GOOGLE_SITE_VERIFICATION: 'g-token' })).toEqual({ google: 'g-token' });
    expect(siteVerification({ BING_SITE_VERIFICATION: 'b-token' })).toEqual({
      other: { 'msvalidate.01': 'b-token' },
    });
  });

  it('emits both when both are configured', () => {
    expect(siteVerification({ GOOGLE_SITE_VERIFICATION: 'g', BING_SITE_VERIFICATION: 'b' })).toEqual({
      google: 'g',
      other: { 'msvalidate.01': 'b' },
    });
  });

  it('treats a blank or whitespace value as unset', () => {
    // Vercel makes it easy to create a variable with an empty value.
    expect(siteVerification({ GOOGLE_SITE_VERIFICATION: '   ' })).toBeUndefined();
  });

  it('trims a pasted token', () => {
    expect(siteVerification({ GOOGLE_SITE_VERIFICATION: ' g-token \n' })).toEqual({ google: 'g-token' });
  });
});
