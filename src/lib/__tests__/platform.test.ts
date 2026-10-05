import { describe, it, expect } from 'vitest';
import {
  embedUrl, parseEmbedMessage, publicPageUrl, PLATFORM_ORIGIN, BOOKING_PUBLIC_ID, FORM_PUBLIC_IDS,
  conciergeUrl, isConciergeClose, CONCIERGE_REFRESH_MS,
} from '../platform';

describe('embedUrl', () => {
  it('points a form embed at the locale-specific form with locale and theme hints', () => {
    const url = new URL(embedUrl({
      kind: 'form', locale: 'es', theme: 'dark',
      hostHref: 'https://bis-rgv.com/es/contact', referrer: '',
    }));
    expect(url.origin).toBe(PLATFORM_ORIGIN);
    expect(url.pathname).toBe(`/f/${FORM_PUBLIC_IDS.es}`);
    expect(url.searchParams.get('locale')).toBe('es');
    expect(url.searchParams.get('theme')).toBe('dark');
    expect(url.searchParams.get('page')).toBe('https://bis-rgv.com/es/contact');
    expect(url.searchParams.get('ref')).toBeNull();
  });

  it('points a booking embed at the one calendar, whichever the language', () => {
    for (const locale of ['en', 'es'] as const) {
      const url = new URL(embedUrl({
        kind: 'booking', locale, theme: 'light', hostHref: 'https://bis-rgv.com/', referrer: '',
      }));
      expect(url.pathname).toBe(`/b/${BOOKING_PUBLIC_ID}`);
      expect(url.searchParams.get('locale')).toBe(locale);
    }
  });

  it('lifts utm and click ids off the host url, which the iframe cannot see, and drops the rest', () => {
    const url = new URL(embedUrl({
      kind: 'form', locale: 'en', theme: 'light',
      hostHref: 'https://bis-rgv.com/en/contact?utm_source=google&utm_medium=cpc&gclid=xyz&ignored=1',
      referrer: 'https://www.google.com/',
    }));
    expect(url.searchParams.get('utm_source')).toBe('google');
    expect(url.searchParams.get('utm_medium')).toBe('cpc');
    expect(url.searchParams.get('gclid')).toBe('xyz');
    expect(url.searchParams.get('ignored')).toBeNull();
    expect(url.searchParams.get('ref')).toBe('https://www.google.com/');
    // The whole host url rides along so attribution records the landing page.
    expect(url.searchParams.get('page')).toContain('utm_source=google');
  });

  it('survives a host href that is not a url', () => {
    const url = new URL(embedUrl({ kind: 'form', locale: 'en', theme: 'light', hostHref: 'not a url', referrer: '' }));
    expect(url.searchParams.get('page')).toBeNull();
    expect(url.searchParams.get('locale')).toBe('en');
  });
});

describe('publicPageUrl', () => {
  it('is the bare hosted page with only the language', () => {
    expect(publicPageUrl('booking', 'es')).toBe(`${PLATFORM_ORIGIN}/b/${BOOKING_PUBLIC_ID}?locale=es`);
    expect(publicPageUrl('form', 'en')).toBe(`${PLATFORM_ORIGIN}/f/${FORM_PUBLIC_IDS.en}?locale=en`);
  });
});

describe('parseEmbedMessage', () => {
  it('decodes the four message types the platform sends', () => {
    expect(parseEmbedMessage({ type: 'bis-form-height', height: 812.4 })).toEqual({ type: 'height', height: 812.4 });
    expect(parseEmbedMessage({ type: 'bis-form-redirect', url: 'https://bis-rgv.com/en/thanks' }))
      .toEqual({ type: 'redirect', url: 'https://bis-rgv.com/en/thanks' });
    expect(parseEmbedMessage({ type: 'bis-form-submitted' })).toEqual({ type: 'submitted', kind: 'form' });
    expect(parseEmbedMessage({ type: 'bis-booking-submitted' })).toEqual({ type: 'submitted', kind: 'booking' });
  });

  it('drops a redirect to anything but http(s), exactly as embed.js does', () => {
    expect(parseEmbedMessage({ type: 'bis-form-redirect', url: 'javascript:alert(1)' })).toBeNull();
    expect(parseEmbedMessage({ type: 'bis-form-redirect', url: 42 })).toBeNull();
  });

  it('drops a height that is not a positive finite number', () => {
    expect(parseEmbedMessage({ type: 'bis-form-height', height: -1 })).toBeNull();
    expect(parseEmbedMessage({ type: 'bis-form-height', height: Number.NaN })).toBeNull();
    expect(parseEmbedMessage({ type: 'bis-form-height', height: '900' })).toBeNull();
  });

  it('ignores anything else', () => {
    expect(parseEmbedMessage(null)).toBeNull();
    expect(parseEmbedMessage('bis-form-height')).toBeNull();
    expect(parseEmbedMessage({ type: 'something-else' })).toBeNull();
  });
});

describe('conciergeUrl', () => {
  it('frames the BIS concierge with the same hints and attribution embed.js gives it', () => {
    const url = new URL(conciergeUrl({
      locale: 'es', theme: 'dark',
      hostHref: 'https://bis-rgv.com/es?utm_source=fb&gclid=g1&other=x',
      referrer: 'https://www.google.com/',
    }));
    expect(`${url.origin}${url.pathname}`).toBe('https://app.bis-rgv.com/c/b2swbbu52be8');
    expect(url.searchParams.get('locale')).toBe('es');
    expect(url.searchParams.get('theme')).toBe('dark');
    expect(url.searchParams.get('utm_source')).toBe('fb');
    expect(url.searchParams.get('gclid')).toBe('g1');
    // Only the allow-list crosses; anything else on the host url stays there.
    expect(url.searchParams.get('other')).toBeNull();
    expect(url.searchParams.get('page')).toBe('https://bis-rgv.com/es?utm_source=fb&gclid=g1&other=x');
    expect(url.searchParams.get('ref')).toBe('https://www.google.com/');
  });

  it('refreshes the frame ahead of the chat page\'s 30-minute render token', () => {
    expect(CONCIERGE_REFRESH_MS).toBeLessThan(30 * 60 * 1000);
  });
});

describe('isConciergeClose', () => {
  it('recognises only the chat page\'s close message', () => {
    expect(isConciergeClose({ type: 'bis-concierge-close' })).toBe(true);
    expect(isConciergeClose({ type: 'bis-concierge-closed' })).toBe(false);
    expect(isConciergeClose('bis-concierge-close')).toBe(false);
    expect(isConciergeClose(null)).toBe(false);
  });
});
