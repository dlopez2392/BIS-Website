import { describe, it, expect } from 'vitest';
import {
  runChecks, score, headline, checkSpf, checkDmarc, checkCsp, checkHsts, checkCookieFlags,
  checkServerDisclosure, checkCertExpiry, checkMixedContent, checkDkim,
  CERT_WARN_DAYS, type Evidence,
} from '../checks';

function evidence(over: Partial<Evidence> & { headers?: Record<string, string>; setCookie?: string[] } = {}): Evidence {
  const headers = new Headers(over.headers ?? {});
  for (const cookie of over.setCookie ?? []) headers.append('set-cookie', cookie);
  return {
    https: over.https === undefined ? { status: 200, headers } : over.https,
    httpRedirectsToHttps: over.httpRedirectsToHttps ?? true,
    txt: over.txt ?? [],
    dmarc: over.dmarc ?? [],
    mx: over.mx ?? ['mail.example.com'],
    dkimSelectors: over.dkimSelectors ?? ['google'],
    certDaysLeft: over.certDaysLeft ?? 90,
    insecureSubresources: over.insecureSubresources ?? 0,
  };
}

describe('email checks — the ones a small business is actually attacked through', () => {
  it('fails a domain anyone can send mail as', () => {
    expect(checkSpf(evidence({ txt: [] })).status).toBe('fail');
    expect(checkDmarc(evidence({ dmarc: [] })).status).toBe('fail');
  });

  it('treats two SPF records as none, because receivers must reject both', () => {
    expect(checkSpf(evidence({ txt: ['v=spf1 include:a -all', 'v=spf1 include:b -all'] })).status).toBe('fail');
  });

  it('reads the enforcement word at the end of an SPF record', () => {
    expect(checkSpf(evidence({ txt: ['v=spf1 include:_spf.google.com -all'] })).status).toBe('pass');
    expect(checkSpf(evidence({ txt: ['v=spf1 include:_spf.google.com ~all'] })).status).toBe('warn');
    expect(checkSpf(evidence({ txt: ['v=spf1 +all'] })).status).toBe('fail');
  });

  it('does not credit a DMARC record that enforces nothing', () => {
    expect(checkDmarc(evidence({ dmarc: ['v=DMARC1; p=none; rua=mailto:a@b.com'] })).status).toBe('warn');
    expect(checkDmarc(evidence({ dmarc: ['v=DMARC1; p=quarantine'] })).status).toBe('pass');
    expect(checkDmarc(evidence({ dmarc: ['v=DMARC1; p=reject'] })).status).toBe('pass');
  });
});

describe('header checks', () => {
  it('does not credit a policy that allows any script from anywhere', () => {
    expect(checkCsp(evidence({ headers: { 'content-security-policy': "default-src 'self'" } })).status).toBe('pass');
    expect(checkCsp(evidence({ headers: { 'content-security-policy': 'script-src *' } })).status).toBe('warn');
    expect(checkCsp(evidence({ headers: { 'content-security-policy': "script-src 'self' 'unsafe-eval'" } })).status).toBe('warn');
  });

  it('marks down an HSTS lifetime that lapses before a second visit', () => {
    expect(checkHsts(evidence({ headers: { 'strict-transport-security': 'max-age=63072000' } })).status).toBe('pass');
    expect(checkHsts(evidence({ headers: { 'strict-transport-security': 'max-age=600' } })).status).toBe('warn');
    expect(checkHsts(evidence()).status).toBe('fail');
  });

  it('treats a site with no cookies as fine, not as missing something', () => {
    expect(checkCookieFlags(evidence()).status).toBe('pass');
    expect(checkCookieFlags(evidence({ setCookie: ['sid=1; Secure; HttpOnly; SameSite=Lax'] })).status).toBe('pass');
  });

  it('always flags a cookie that can travel over plain HTTP', () => {
    expect(checkCookieFlags(evidence({ setCookie: ['NEXT_LOCALE=en; Path=/; SameSite=Lax'] })).status).toBe('warn');
    expect(checkCookieFlags(evidence({ setCookie: ['sid=1; HttpOnly'] })).status).toBe('warn');
  });

  it('does not cry wolf about a preference cookie the page has to read itself', () => {
    // The false positive this fixes: bis-rgv.com sets NEXT_LOCALE with Secure
    // and SameSite but deliberately without HttpOnly, because the language
    // switcher is client-side. A checker that calls a correct configuration a
    // problem teaches people to ignore it.
    expect(checkCookieFlags(evidence({ setCookie: ['NEXT_LOCALE=en; Path=/; Secure; SameSite=Lax'] })).status).toBe('pass');
    expect(checkCookieFlags(evidence({ setCookie: ['theme=dark; Secure', 'consent=1; Secure'] })).status).toBe('pass');
  });

  it('still flags a session cookie that scripts can read', () => {
    for (const cookie of ['sessionid=abc; Secure', 'PHPSESSID=abc; Secure', 'auth_token=abc; Secure', 'jwt=abc; Secure', 'remember_me=1; Secure']) {
      expect(checkCookieFlags(evidence({ setCookie: [cookie] })).status, cookie).toBe('warn');
    }
  });

  it('flags a version number, not merely a product name', () => {
    expect(checkServerDisclosure(evidence({ headers: { server: 'nginx' } })).status).toBe('pass');
    expect(checkServerDisclosure(evidence({ headers: { server: 'nginx/1.18.0' } })).status).toBe('warn');
    expect(checkServerDisclosure(evidence({ headers: { 'x-powered-by': 'PHP/7.4.3' } })).status).toBe('warn');
  });
});

describe('score', () => {
  it('gives a well-configured site an A', () => {
    const good = evidence({
      headers: {
        'strict-transport-security': 'max-age=63072000; includeSubDomains',
        'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
      },
      txt: ['v=spf1 include:_spf.google.com -all'],
      dmarc: ['v=DMARC1; p=reject'],
    });
    expect(score(runChecks(good)).grade).toBe('A');
  });

  it('fails a site that is reachable but protects nothing', () => {
    const bad = evidence({ httpRedirectsToHttps: false });
    const result = score(runChecks(bad));
    expect(result.grade).toBe('F');
    expect(result.points).toBeLessThan(50);
  });

  it('does not mark down a domain for receiving no email', () => {
    // The guarantee is that an inapplicable check costs nothing, not that two
    // differently-configured domains land on the same number. A check that
    // returns `unknown` leaves the denominator as well as the numerator, so a
    // domain with nothing else wrong still scores full marks with no mail.
    const headers = {
      'strict-transport-security': 'max-age=63072000',
      'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    };
    const clean = { txt: ['v=spf1 -all'], dmarc: ['v=DMARC1; p=reject'], headers };
    const noMail = { ...evidence(clean), mx: [], dkimSelectors: [] };
    expect(score(runChecks(noMail)).points).toBe(100);
    expect(score(runChecks(evidence(clean))).points).toBe(100);
  });

  it('scores a site that cannot be reached at all as a failure, not an error', () => {
    const unreachable: Evidence = {
      https: undefined, httpRedirectsToHttps: false, txt: [], dmarc: [], mx: [], dkimSelectors: [],
    };
    expect(score(runChecks(unreachable)).grade).toBe('F');
  });
});

describe('headline', () => {
  it('leads with failures, heaviest first, and never with something that passed', () => {
    const findings = runChecks(evidence({ headers: { 'x-content-type-options': 'nosniff' } }));
    const top = headline(findings);
    expect(top).toHaveLength(3);
    expect(top.every((f) => f.status !== 'pass')).toBe(true);
    // Email spoofing outranks a missing referrer policy, every time.
    expect(top.map((f) => f.id)).toContain('spf');
    expect(top.map((f) => f.id)).toContain('dmarc');
  });

  it('says nothing when there is nothing wrong', () => {
    const perfect = evidence({
      headers: {
        'strict-transport-security': 'max-age=63072000',
        'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer',
      },
      txt: ['v=spf1 -all'],
      dmarc: ['v=DMARC1; p=reject'],
    });
    expect(headline(runChecks(perfect))).toEqual([]);
  });
});

describe('certificate expiry', () => {
  it('says nothing when the certificate could not be read', () => {
    expect(checkCertExpiry({ ...evidence(), certDaysLeft: undefined }).status).toBe('unknown');
  });

  it('warns before a renewal is late rather than after the site goes down', () => {
    expect(checkCertExpiry(evidence({ certDaysLeft: 90 })).status).toBe('pass');
    expect(checkCertExpiry(evidence({ certDaysLeft: CERT_WARN_DAYS })).status).toBe('warn');
    expect(checkCertExpiry(evidence({ certDaysLeft: 3 })).status).toBe('fail');
    expect(checkCertExpiry(evidence({ certDaysLeft: -1 })).status).toBe('fail');
  });
});

describe('mixed content', () => {
  it('fails a secure page that loads anything over plain HTTP', () => {
    expect(checkMixedContent(evidence({ insecureSubresources: 3 })).status).toBe('fail');
    expect(checkMixedContent(evidence({ insecureSubresources: 0 })).status).toBe('pass');
  });

  it('stays quiet when the page was not read', () => {
    expect(checkMixedContent({ ...evidence(), insecureSubresources: undefined }).status).toBe('unknown');
  });
});

describe('DKIM', () => {
  it('passes when a signing key was found under any known selector', () => {
    expect(checkDkim(evidence({ dkimSelectors: ['selector1'] })).status).toBe('pass');
  });

  it('warns rather than fails when none was found, because selectors cannot be enumerated', () => {
    expect(checkDkim(evidence({ dkimSelectors: [] })).status).toBe('warn');
  });

  it('does not judge a domain that receives no mail', () => {
    expect(checkDkim({ ...evidence({ dkimSelectors: [] }), mx: [] }).status).toBe('unknown');
  });
});
