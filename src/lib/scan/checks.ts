/**
 * What the checker looks at, and how it judges what it finds.
 *
 * Every check is a pure function of evidence already gathered, so the
 * judgement is testable without a network and the network layer has no
 * opinions. Nothing here probes, guesses a password, or sends a single
 * unusual request: it reads response headers and public DNS records, which is
 * what any visitor's browser and any mail server already see.
 *
 * The wording of a finding matters as much as the finding. A business owner
 * does not need to be told "SPF record missing"; they need to be told that
 * anyone can send email that looks like it came from them.
 */

export type Status = 'pass' | 'warn' | 'fail' | 'unknown';

export type CheckId =
  | 'https'
  | 'httpsRedirect'
  | 'hsts'
  | 'csp'
  | 'clickjacking'
  | 'nosniff'
  | 'referrerPolicy'
  | 'cookieFlags'
  | 'serverDisclosure'
  | 'spf'
  | 'dmarc'
  | 'mx';

export interface Finding {
  id: CheckId;
  status: Status;
  /** Filled from the message catalogue at render time; never a raw header. */
  detail?: string;
}

export interface Evidence {
  /** Response to https://<host>/ — absent when it could not be reached at all. */
  https?: { status: number; headers: Headers };
  /** Whether http://<host>/ ends up on https. */
  httpRedirectsToHttps?: boolean;
  txt: string[];
  dmarc: string[];
  mx: string[];
}

/** `weight` is how much a failure costs the grade; email failures cost the most because they are exploited the most. */
const WEIGHTS: Record<CheckId, number> = {
  https: 20,
  httpsRedirect: 8,
  hsts: 6,
  csp: 8,
  clickjacking: 6,
  nosniff: 4,
  referrerPolicy: 3,
  cookieFlags: 5,
  serverDisclosure: 2,
  spf: 14,
  dmarc: 14,
  mx: 2,
};

function header(evidence: Evidence, name: string): string | undefined {
  return evidence.https?.headers.get(name) ?? undefined;
}

export function checkHttps(e: Evidence): Finding {
  if (!e.https) return { id: 'https', status: 'fail' };
  return { id: 'https', status: e.https.status < 500 ? 'pass' : 'warn' };
}

export function checkHttpsRedirect(e: Evidence): Finding {
  if (e.httpRedirectsToHttps === undefined) return { id: 'httpsRedirect', status: 'unknown' };
  return { id: 'httpsRedirect', status: e.httpRedirectsToHttps ? 'pass' : 'fail' };
}

export function checkHsts(e: Evidence): Finding {
  const value = header(e, 'strict-transport-security');
  if (!value) return { id: 'hsts', status: 'fail' };
  const maxAge = Number(/max-age=(\d+)/i.exec(value)?.[1] ?? 0);
  // Six months is the usual floor for the browser preload list; below that the
  // protection lapses before most people visit twice.
  return { id: 'hsts', status: maxAge >= 15552000 ? 'pass' : 'warn' };
}

export function checkCsp(e: Evidence): Finding {
  const value = header(e, 'content-security-policy');
  if (!value) return { id: 'csp', status: 'fail' };
  // A policy that allows any script from anywhere is a policy in name only.
  const scriptSrc = /(?:^|;)\s*(?:script-src|default-src)\s([^;]*)/i.exec(value)?.[1] ?? '';
  return { id: 'csp', status: /(^|\s)\*(\s|$)|'unsafe-eval'/i.test(scriptSrc) ? 'warn' : 'pass' };
}

export function checkClickjacking(e: Evidence): Finding {
  const csp = header(e, 'content-security-policy') ?? '';
  const xfo = header(e, 'x-frame-options');
  if (/frame-ancestors/i.test(csp)) return { id: 'clickjacking', status: 'pass' };
  if (xfo && /deny|sameorigin/i.test(xfo)) return { id: 'clickjacking', status: 'pass' };
  return { id: 'clickjacking', status: 'fail' };
}

export function checkNosniff(e: Evidence): Finding {
  const value = header(e, 'x-content-type-options');
  return { id: 'nosniff', status: value?.toLowerCase().trim() === 'nosniff' ? 'pass' : 'fail' };
}

export function checkReferrerPolicy(e: Evidence): Finding {
  return { id: 'referrerPolicy', status: header(e, 'referrer-policy') ? 'pass' : 'warn' };
}

export function checkCookieFlags(e: Evidence): Finding {
  const cookies = e.https?.headers.getSetCookie?.() ?? [];
  // No cookies on the front page is a fine answer, not a missing one.
  if (cookies.length === 0) return { id: 'cookieFlags', status: 'pass' };
  const weak = cookies.filter((c) => !/;\s*secure/i.test(c) || !/;\s*httponly/i.test(c));
  return { id: 'cookieFlags', status: weak.length ? 'warn' : 'pass' };
}

export function checkServerDisclosure(e: Evidence): Finding {
  const banners = [header(e, 'server'), header(e, 'x-powered-by')].filter(Boolean) as string[];
  // A name is harmless; a version number tells an attacker which exploit to try.
  const versioned = banners.some((b) => /\d+\.\d+/.test(b));
  return { id: 'serverDisclosure', status: versioned ? 'warn' : 'pass' };
}

export function checkSpf(e: Evidence): Finding {
  const records = e.txt.filter((r) => /^v=spf1/i.test(r.trim()));
  if (records.length === 0) return { id: 'spf', status: 'fail' };
  // Two SPF records is the same as none: receivers are required to fail the check.
  if (records.length > 1) return { id: 'spf', status: 'fail' };
  const record = records[0];
  if (/-all\s*$/i.test(record)) return { id: 'spf', status: 'pass' };
  if (/~all\s*$/i.test(record)) return { id: 'spf', status: 'warn' };
  // `?all` or `+all` instructs receivers to accept anything.
  return { id: 'spf', status: 'fail' };
}

export function checkDmarc(e: Evidence): Finding {
  const record = e.dmarc.find((r) => /^v=DMARC1/i.test(r.trim()));
  if (!record) return { id: 'dmarc', status: 'fail' };
  const policy = /\bp=\s*(none|quarantine|reject)\b/i.exec(record)?.[1]?.toLowerCase();
  if (policy === 'reject' || policy === 'quarantine') return { id: 'dmarc', status: 'pass' };
  // p=none monitors and enforces nothing, which is where most domains stop.
  return { id: 'dmarc', status: 'warn' };
}

export function checkMx(e: Evidence): Finding {
  return { id: 'mx', status: e.mx.length > 0 ? 'pass' : 'unknown' };
}

const CHECKS = [
  checkHttps, checkHttpsRedirect, checkHsts, checkCsp, checkClickjacking, checkNosniff,
  checkReferrerPolicy, checkCookieFlags, checkServerDisclosure, checkSpf, checkDmarc, checkMx,
];

export function runChecks(evidence: Evidence): Finding[] {
  return CHECKS.map((check) => check(evidence));
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Score out of 100, then a letter. A `warn` costs half of what a `fail` costs,
 * and an `unknown` costs nothing — a domain that receives no email should not
 * be marked down for it.
 */
export function score(findings: Finding[]): { points: number; grade: Grade } {
  let possible = 0;
  let lost = 0;
  for (const finding of findings) {
    if (finding.status === 'unknown') continue;
    const weight = WEIGHTS[finding.id];
    possible += weight;
    if (finding.status === 'fail') lost += weight;
    if (finding.status === 'warn') lost += weight / 2;
  }
  const points = possible === 0 ? 0 : Math.round(((possible - lost) / possible) * 100);
  const grade: Grade = points >= 90 ? 'A' : points >= 78 ? 'B' : points >= 64 ? 'C' : points >= 50 ? 'D' : 'F';
  return { points, grade };
}

/** The three findings worth saying out loud first: heaviest, worst, email before headers. */
export function headline(findings: Finding[]): Finding[] {
  const rank = { fail: 0, warn: 1, unknown: 2, pass: 3 } as const;
  return [...findings]
    .filter((f) => f.status === 'fail' || f.status === 'warn')
    .sort((a, b) => rank[a.status] - rank[b.status] || WEIGHTS[b.id] - WEIGHTS[a.id])
    .slice(0, 3);
}
