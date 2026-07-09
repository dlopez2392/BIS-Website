import { describe, it, expect } from 'vitest';
import { pageMetadata } from '../metadata';

describe('pageMetadata', () => {
  it('builds canonical + hreflang alternates for a sub-path', () => {
    const m = pageMetadata({ locale: 'es', path: '/services', title: 'Qué hacemos', description: 'desc' });
    expect(m.title).toBe('Qué hacemos');
    expect(m.alternates?.canonical).toBe('https://bis-rgv.com/es/services');
    expect(m.alternates?.languages).toMatchObject({
      en: 'https://bis-rgv.com/en/services',
      es: 'https://bis-rgv.com/es/services',
      'x-default': 'https://bis-rgv.com/en/services',
    });
  });
  it('handles the home path without a trailing segment', () => {
    const m = pageMetadata({ locale: 'en', path: '/', title: 'Home', description: 'd' });
    expect(m.alternates?.canonical).toBe('https://bis-rgv.com/en');
    expect(m.alternates?.languages).toMatchObject({ 'x-default': 'https://bis-rgv.com/en' });
  });
});
