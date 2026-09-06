import { promises as dns } from 'node:dns';
import tls from 'node:tls';
import { parseTarget, isPublicAddress, UnsafeTargetError } from './target';
import type { Evidence } from './checks';

/**
 * The network half of the checker: everything that actually leaves the server.
 *
 * Three rules, in order of how much they matter.
 *
 * 1. A hostname is resolved and every returned address is checked before a
 *    request is made, and again at every redirect, because a public host may
 *    redirect to `http://169.254.169.254/` and invite this server to read its
 *    own cloud credentials.
 * 2. Nothing a probed site returns is ever shown to the visitor. The checker
 *    reports its own judgements — "no policy", "expires too soon" — never a
 *    header value or a byte of a body. That is what keeps the residual DNS
 *    rebinding window (a name that resolves publicly for the check and
 *    privately a millisecond later, which `fetch` gives no way to pin) from
 *    being a way to read anything: at most it changes a pass to a fail.
 * 3. Everything is bounded. One request per hop, three hops, five seconds,
 *    headers only, and the body is discarded unread.
 */

const TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 3;
/**
 * How much of the page is read to look for insecure subresources. The body is
 * still never shown to the visitor — only a count of what was found leaves
 * this module — and a cap means a hostile or enormous page cannot be used to
 * exhaust this server's memory.
 */
const MAX_BODY_BYTES = 512 * 1024;

/**
 * Selectors worth asking about. There is no way to enumerate a domain's DKIM
 * selectors, so this is the set the mail providers a Valley business actually
 * uses publish under. A miss means "we could not find one", which is why the
 * finding is a warning rather than a failure.
 */
const DKIM_SELECTORS = [
  'google',        // Google Workspace
  'selector1', 'selector2', // Microsoft 365
  'k1',            // Mailchimp / Mandrill
  'resend',        // Resend
  's1', 's2',      // Amazon SES and others
  'default',
  'dkim',
  'mail',
] as const;
const USER_AGENT = 'BIS-SecurityCheck/1.0 (+https://bis-rgv.com/tools/security-check)';

async function assertPublic(hostname: string): Promise<void> {
  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    // ENOTFOUND, ENODATA, EAI_AGAIN: a name nobody can reach, which is a typo
    // far more often than it is an outage.
    throw new UnsafeTargetError(`${hostname} does not resolve`);
  }
  if (addresses.length === 0) throw new UnsafeTargetError(`${hostname} does not resolve`);
  for (const { address } of addresses) {
    if (!isPublicAddress(address)) throw new UnsafeTargetError(`${hostname} resolves to a non-public address`);
  }
}

async function headOnce(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // GET rather than HEAD: too many servers answer HEAD with a different set
    // of headers, or with 405, and the checker would report a site as bare
    // when it is not. The body is never read.
    return await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'user-agent': USER_AGENT, accept: 'text/html' },
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Follows redirects by hand so every hop's hostname is re-validated. */
async function fetchChecked(startUrl: string): Promise<Response | undefined> {
  let url = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const parsed = parseTarget(url);
    if (!parsed.ok) return undefined;
    await assertPublic(parsed.hostname);

    let response: Response;
    try {
      response = await headOnce(url);
    } catch {
      return undefined;
    }

    const location = response.status >= 300 && response.status < 400 ? response.headers.get('location') : null;
    // The final response keeps its body so the mixed-content scan can read a
    // bounded prefix of it; every redirect hop discards its own.
    if (!location) return response;
    void response.body?.cancel();
    url = new URL(location, url).toString();
  }
  return undefined;
}

/**
 * Reads the certificate the site presents, for its expiry date only. A
 * separate connection from the fetch because Node's fetch does not expose the
 * peer certificate, and the same public-address rule applies first.
 */
async function certificateDaysLeft(hostname: string): Promise<number | undefined> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (value: number | undefined) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(value);
    };
    const socket = tls.connect(
      { host: hostname, port: 443, servername: hostname, timeout: TIMEOUT_MS },
      () => {
        const cert = socket.getPeerCertificate();
        const validTo = cert && typeof cert.valid_to === 'string' ? Date.parse(cert.valid_to) : NaN;
        done(Number.isNaN(validTo) ? undefined : Math.floor((validTo - Date.now()) / 86_400_000));
      },
    );
    // An untrusted or expired certificate still answers the question being
    // asked, so the handshake is not required to validate — `checkHttps`
    // already reports a site that will not load.
    socket.on('error', () => done(undefined));
    socket.on('timeout', () => done(undefined));
    setTimeout(() => done(undefined), TIMEOUT_MS + 500).unref?.();
  });
}

/** `src`/`href` on a script, stylesheet, iframe or image that is plain HTTP. */
const INSECURE_SUBRESOURCE = /<(?:script|iframe|img|source|link)\b[^>]*?\b(?:src|href)\s*=\s*["']http:\/\//gi;

/**
 * Counts insecure subresources in the page's own markup. The body is read here
 * and nowhere else, is capped, and never leaves this function: the caller gets
 * a number.
 */
async function countInsecureSubresources(response: Response): Promise<number | undefined> {
  const type = response.headers.get('content-type') ?? '';
  if (!/text\/html/i.test(type) || !response.body) return undefined;
  try {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let html = '';
    let read = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      read += value.byteLength;
      html += decoder.decode(value, { stream: true });
      if (read >= MAX_BODY_BYTES) {
        void reader.cancel();
        break;
      }
    }
    return (html.match(INSECURE_SUBRESOURCE) ?? []).length;
  } catch {
    return undefined;
  }
}

async function dkim(hostname: string): Promise<string[]> {
  const found = await Promise.all(DKIM_SELECTORS.map(async (selector): Promise<string | null> => {
    try {
      const records = await dns.resolveTxt(`${selector}._domainkey.${hostname}`);
      const joined = records.map((chunks) => chunks.join(''));
      return joined.some((r) => /(^|;)\s*p\s*=\s*[A-Za-z0-9+/]/.test(r)) ? selector : null;
    } catch {
      return null;
    }
  }));
  return found.filter((s): s is string => s !== null);
}

async function txt(name: string): Promise<string[]> {
  try {
    // A long TXT record arrives split into 255-byte chunks that must be joined
    // before the record can be read at all.
    return (await dns.resolveTxt(name)).map((chunks) => chunks.join(''));
  } catch {
    return [];
  }
}

export async function gather(hostname: string): Promise<Evidence> {
  await assertPublic(hostname);

  const [httpsResponse, httpResponse, txtRecords, dmarcRecords, mxRecords, certDaysLeft, dkimSelectors] = await Promise.all([
    fetchChecked(`https://${hostname}/`),
    // Only the first hop matters here: the question is whether plain HTTP is
    // sent to HTTPS at all, not where it eventually lands.
    (async () => {
      try {
        await assertPublic(hostname);
        return await headOnce(`http://${hostname}/`);
      } catch {
        return undefined;
      }
    })(),
    txt(hostname),
    txt(`_dmarc.${hostname}`),
    dns.resolveMx(hostname).then((rs) => rs.map((r) => r.exchange)).catch(() => []),
    certificateDaysLeft(hostname),
    dkim(hostname),
  ]);

  void httpResponse?.body?.cancel();
  const location = httpResponse?.headers.get('location');
  const insecureSubresources = httpsResponse ? await countInsecureSubresources(httpsResponse) : undefined;

  return {
    https: httpsResponse ? { status: httpsResponse.status, headers: httpsResponse.headers } : undefined,
    certDaysLeft,
    insecureSubresources,
    dkimSelectors,
    httpRedirectsToHttps:
      httpResponse === undefined
        ? undefined
        : httpResponse.status >= 300 && httpResponse.status < 400 && !!location && new URL(location, `http://${hostname}/`).protocol === 'https:',
    txt: txtRecords,
    dmarc: dmarcRecords,
    mx: mxRecords,
  };
}
