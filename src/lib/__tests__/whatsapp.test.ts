import { describe, it, expect } from 'vitest';
import { normalizeNumber, whatsappLink } from '../whatsapp';

describe('normalizeNumber', () => {
  it('accepts the ways a person actually writes a number', () => {
    for (const input of ['+1 (956) 506-1545', '1-956-506-1545', '19565061545', '+1 956 506 1545']) {
      expect(normalizeNumber(input), input).toBe('19565061545');
    }
  });

  it('adds the country code to a bare US number rather than rejecting it', () => {
    expect(normalizeNumber('956-506-1545')).toBe('19565061545');
  });

  it('keeps a non-US international number as given', () => {
    expect(normalizeNumber('+52 899 123 4567')).toBe('528991234567');
  });

  it('refuses anything that is not a plausible number', () => {
    // A wa.me link to a wrong number opens a stranger's phone, not an error.
    for (const input of [undefined, '', '   ', 'call us', '12345', '1234567890123456789']) {
      expect(normalizeNumber(input), String(input)).toBeNull();
    }
  });
});

describe('whatsappLink', () => {
  it('prefills the message so the visitor only has to press send', () => {
    const url = new URL(whatsappLink('19565061545', 'Hi BIS — I found you on bis-rgv.com.'));
    expect(url.origin + url.pathname).toBe('https://wa.me/19565061545');
    expect(url.searchParams.get('text')).toBe('Hi BIS — I found you on bis-rgv.com.');
  });

  it('escapes a message with punctuation and accents intact', () => {
    const url = new URL(whatsappLink('19565061545', 'Hola: ¿tienen tiempo? Vi el sitio & quiero información.'));
    expect(url.searchParams.get('text')).toBe('Hola: ¿tienen tiempo? Vi el sitio & quiero información.');
  });
});
