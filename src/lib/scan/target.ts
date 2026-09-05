/**
 * Turning what someone typed into a hostname this server is willing to fetch.
 *
 * This is the security-critical half of the checker. The visitor supplies a
 * name and the server makes a request to it, which is server-side request
 * forgery unless every one of these holds:
 *
 *   - only a hostname is honoured, never a scheme, port, path, or credentials
 *     smuggled in as `user@internal-host`;
 *   - the name resolves to a public address, checked against the resolved IPs
 *     rather than the text, because `internal.example.com` can point at
 *     127.0.0.1 and a name can resolve differently on the second lookup;
 *   - every redirect hop is re-checked, since a public host may redirect to
 *     `http://169.254.169.254/` and ask this server to read its own cloud
 *     credentials.
 *
 * A tool that sells security should not be the least careful thing on the
 * site, so the guards live in one place, are pure, and are tested by address
 * rather than by hope.
 */

export type TargetError = 'empty' | 'malformed' | 'not-public' | 'ip-address';

/**
 * Thrown when a name cannot be resolved, or resolves somewhere this server
 * will not go. It is a distinct type rather than a message to match on,
 * because the two cases are told apart on the visitor's screen: a typo is
 * their problem to fix, and anything else is an incident BIS should hear
 * about. Matching on message text got that wrong — Node's own ENOTFOUND does
 * not read like the message this module writes, so every mistyped domain was
 * filed as a system failure.
 */
export class UnsafeTargetError extends Error {}

export type ParsedTarget = { ok: true; hostname: string } | { ok: false; error: TargetError };

const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Accepts what a business owner would actually type: `example.com`,
 * `www.example.com`, `https://example.com/contact`, `EXAMPLE.COM`, with or
 * without stray spaces. Everything else is refused rather than guessed at.
 */
export function parseTarget(input: string): ParsedTarget {
  const raw = input.trim();
  if (!raw) return { ok: false, error: 'empty' };

  let hostname: string;
  try {
    // A scheme is required by the URL parser; anything the visitor supplied is
    // preserved so `http://a@b` is seen for what it is rather than repaired.
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (url.username || url.password) return { ok: false, error: 'malformed' };
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false, error: 'malformed' };
    // A port would let a visitor aim this server at an internal service on a
    // host that is otherwise public. Only the web ports are ever probed.
    if (url.port && url.port !== '80' && url.port !== '443') return { ok: false, error: 'malformed' };
    hostname = url.hostname.toLowerCase();
  } catch {
    return { ok: false, error: 'malformed' };
  }

  // Bracketed IPv6 and bare IPv4 are refused outright: this checks a business's
  // domain, and an address is how the private-network guard gets probed.
  if (hostname.startsWith('[') || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return { ok: false, error: 'ip-address' };

  const labels = hostname.split('.');
  if (labels.length < 2) return { ok: false, error: 'not-public' };
  if (hostname.length > 253) return { ok: false, error: 'malformed' };
  if (!labels.every((l) => LABEL.test(l))) return { ok: false, error: 'malformed' };
  // Names that never leave the machine or the LAN.
  const tld = labels[labels.length - 1];
  if (['local', 'localhost', 'internal', 'test', 'invalid', 'example', 'onion'].includes(tld)) {
    return { ok: false, error: 'not-public' };
  }

  return { ok: true, hostname };
}

/** Every range that must never be fetched on a visitor's behalf. */
export function isPublicIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  if (a === 0) return false; // this network
  if (a === 10) return false; // private
  if (a === 127) return false; // loopback
  if (a === 169 && b === 254) return false; // link-local, and the cloud metadata address
  if (a === 172 && b >= 16 && b <= 31) return false; // private
  if (a === 192 && b === 168) return false; // private
  if (a === 192 && b === 0) return false; // IETF protocol assignments
  if (a === 100 && b >= 64 && b <= 127) return false; // carrier-grade NAT
  if (a === 198 && (b === 18 || b === 19)) return false; // benchmarking
  if (a >= 224) return false; // multicast, reserved, broadcast
  return true;
}

export function isPublicIpv6(ip: string): boolean {
  const address = ip.toLowerCase().split('%')[0]; // drop any zone index
  if (address === '::' || address === '::1') return false; // unspecified, loopback
  if (address.startsWith('fe8') || address.startsWith('fe9') || address.startsWith('fea') || address.startsWith('feb')) return false; // link-local
  if (/^f[cd]/.test(address)) return false; // unique local
  if (address.startsWith('ff')) return false; // multicast
  // IPv4 written as IPv6 reaches the same networks, so it is judged as IPv4.
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(address);
  if (mapped) return isPublicIpv4(mapped[1]);
  return true;
}

export function isPublicAddress(ip: string): boolean {
  return ip.includes(':') ? isPublicIpv6(ip) : isPublicIpv4(ip);
}
