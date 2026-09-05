import { describe, it, expect } from 'vitest';
import { parseTarget, isPublicAddress } from '../target';

describe('parseTarget', () => {
  it('accepts what a business owner would actually type', () => {
    for (const input of ['example.com', ' Example.COM ', 'www.example.com', 'https://example.com/contact', 'http://example.com']) {
      expect(parseTarget(input)).toEqual({ ok: true, hostname: expect.stringContaining('example.com') });
    }
  });

  it('refuses credentials smuggled into the authority', () => {
    // `http://x@127.0.0.1/` reads as a host of 127.0.0.1 to a fetcher and as
    // a host of `x` to a careless parser.
    expect(parseTarget('http://user@internal-host.com')).toEqual({ ok: false, error: 'malformed' });
    expect(parseTarget('https://a:b@example.com')).toEqual({ ok: false, error: 'malformed' });
  });

  it('refuses a port, which would aim the server at an internal service', () => {
    expect(parseTarget('example.com:22')).toEqual({ ok: false, error: 'malformed' });
    expect(parseTarget('https://example.com:8080')).toEqual({ ok: false, error: 'malformed' });
    expect(parseTarget('https://example.com:443')).toEqual({ ok: true, hostname: 'example.com' });
  });

  it('refuses a scheme that is not the web', () => {
    for (const input of ['file:///etc/passwd', 'gopher://example.com', 'javascript:alert(1)']) {
      expect(parseTarget(input).ok).toBe(false);
    }
  });

  it('refuses addresses and names that never leave the machine or the LAN', () => {
    expect(parseTarget('127.0.0.1')).toEqual({ ok: false, error: 'ip-address' });
    expect(parseTarget('169.254.169.254')).toEqual({ ok: false, error: 'ip-address' });
    expect(parseTarget('http://[::1]/')).toEqual({ ok: false, error: 'ip-address' });
    expect(parseTarget('localhost')).toEqual({ ok: false, error: 'not-public' });
    expect(parseTarget('printer.local')).toEqual({ ok: false, error: 'not-public' });
    expect(parseTarget('db.internal')).toEqual({ ok: false, error: 'not-public' });
  });

  it('refuses an empty or nonsense entry rather than guessing', () => {
    expect(parseTarget('   ')).toEqual({ ok: false, error: 'empty' });
    expect(parseTarget('not a domain')).toEqual({ ok: false, error: 'malformed' });
    expect(parseTarget('-bad-.com')).toEqual({ ok: false, error: 'malformed' });
  });
});

describe('isPublicAddress', () => {
  it('rejects every address a request must never reach', () => {
    for (const ip of [
      '127.0.0.1', '10.0.0.5', '172.16.0.1', '172.31.255.255', '192.168.1.1',
      '169.254.169.254', // the cloud metadata endpoint
      '0.0.0.0', '100.64.0.1', '198.18.0.1', '224.0.0.1', '255.255.255.255',
      '::1', '::', 'fe80::1', 'fd00::1', 'ff02::1', '::ffff:127.0.0.1',
    ]) {
      expect(isPublicAddress(ip), ip).toBe(false);
    }
  });

  it('accepts ordinary public addresses', () => {
    for (const ip of ['93.184.216.34', '8.8.8.8', '172.32.0.1', '2606:2800:220:1::', '::ffff:93.184.216.34']) {
      expect(isPublicAddress(ip), ip).toBe(true);
    }
  });
});
