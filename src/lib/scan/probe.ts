import { promises as dns } from 'node:dns';
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
    void response.body?.cancel();

    const location = response.status >= 300 && response.status < 400 ? response.headers.get('location') : null;
    if (!location) return response;
    url = new URL(location, url).toString();
  }
  return undefined;
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

  const [httpsResponse, httpResponse, txtRecords, dmarcRecords, mxRecords] = await Promise.all([
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
  ]);

  void httpResponse?.body?.cancel();
  const location = httpResponse?.headers.get('location');

  return {
    https: httpsResponse ? { status: httpsResponse.status, headers: httpsResponse.headers } : undefined,
    httpRedirectsToHttps:
      httpResponse === undefined
        ? undefined
        : httpResponse.status >= 300 && httpResponse.status < 400 && !!location && new URL(location, `http://${hostname}/`).protocol === 'https:',
    txt: txtRecords,
    dmarc: dmarcRecords,
    mx: mxRecords,
  };
}
