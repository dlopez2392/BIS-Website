import { createHash, createHmac, randomUUID } from 'node:crypto';

/**
 * A short-lived ticket that vouches for a visitor to the platform's
 * "Talk to Sofía" session endpoint.
 *
 * Why the website signs it: minting a Realtime session costs money, so that
 * endpoint must not be open to the internet. The bot check and the
 * per-visitor rate limit that decide it already exist HERE, proven on chat
 * and the security checker. Rather than build a second, weaker copy of both
 * in the platform, this site vouches and the platform verifies.
 *
 * The wire format and key derivation are mirrored in the platform
 * (apps/web/src/lib/voice/web-demo.ts) and pinned on both sides by the same
 * known-answer vector in ticket.test.ts. Neither may change alone.
 */

/** Never HMAC with the raw shared secret. */
function ticketKey(secret: string): Buffer {
  return createHash('sha256').update(`bis-sofia-web-ticket:${secret}`).digest();
}

/** `<issuedAtMs>.<nonce>.<hmac>` — the platform bounds the age; this side
 *  only has to sign honestly. */
export function signTicket(
  secret: string,
  nowMs: number = Date.now(),
  nonce: string = randomUUID(),
): string {
  const payload = `${nowMs}.${nonce}`;
  return `${payload}.${createHmac('sha256', ticketKey(secret)).update(payload).digest('base64url')}`;
}
