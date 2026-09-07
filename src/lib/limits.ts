/**
 * Rate and abuse limits that survive across server instances.
 *
 * The previous limiter kept its counts in a module-level Map, so on Vercel each
 * lambda instance had its own notepad and a recycled instance started blank —
 * "10 per minute" was really "10 per minute per instance until it forgets".
 * Shared counters stay even though the chat no longer books appointments
 * itself (the platform's scheduler owns that, with its own rate limit): a
 * per-instance cap on model calls is still not a cap.
 *
 * Keys are prefixed `web:` because this Upstash store is shared with the Sofía
 * receptionist, whose keys are `session:*` and `calls:*`.
 */

export const CHAT_PER_MINUTE = 10;
export const CHAT_WINDOW_SECONDS = 60;

/**
 * The security checker makes requests to somebody else's server, so its limit
 * is about being a good neighbour as much as about protecting BIS: a visitor
 * gets a handful of checks, not a scanning service.
 */
export const SCANS_PER_WINDOW = 5;
export const SCAN_WINDOW_SECONDS = 600;

/**
 * Emailing a report is a stricter thing than running a scan: it sends mail
 * from the BIS domain to an address a stranger typed. The scan limit protects
 * other people's servers; this one protects the sending reputation that the
 * SPF and DMARC records exist to defend.
 */
export const REPORTS_PER_WINDOW = 3;
export const REPORT_WINDOW_SECONDS = 3600;

/**
 * Opening a voice session with Sofía is the most expensive thing a stranger
 * can do on this site: it bills OpenAI Realtime audio by the minute for as
 * long as the session lives, where a chat message bills once for a handful of
 * tokens. Three an hour is more than anyone curious needs and far less than
 * anyone bored could spend.
 */
export const SOFIA_SESSIONS_PER_WINDOW = 3;
export const SOFIA_WINDOW_SECONDS = 3600;

export interface Counter {
  /** Increments `key`, setting `ttlSeconds` on first write, and returns the new count. */
  incr(key: string, ttlSeconds: number): Promise<number>;
}

export interface Limits {
  allowChat(ip: string): Promise<boolean>;
  allowScan(ip: string): Promise<boolean>;
  allowReport(ip: string): Promise<boolean>;
  allowSofiaSession(ip: string): Promise<boolean>;
}

let brokenCounterLogged = false;
function logBrokenCounter(err: unknown) {
  if (brokenCounterLogged) return;
  brokenCounterLogged = true;
  console.error('[limits] counter unavailable — failing open', err);
}

/**
 * Pure over its Counter, so the cap is testable without Redis.
 *
 * Fails OPEN. A dead Redis silencing the assistant is worse than an unmetered
 * window — the same call Sofía's daily call caps make, and the same
 * never-lose-a-lead rule the lead pipeline follows.
 */
export function makeLimits(counter: Counter): Limits {
  return {
    async allowChat(ip) {
      try {
        const used = await counter.incr(`web:rl:chat:${ip}`, CHAT_WINDOW_SECONDS);
        return used <= CHAT_PER_MINUTE;
      } catch (err) {
        logBrokenCounter(err);
        return true;
      }
    },
    async allowScan(ip) {
      try {
        const used = await counter.incr(`web:rl:scan:${ip}`, SCAN_WINDOW_SECONDS);
        return used <= SCANS_PER_WINDOW;
      } catch (err) {
        logBrokenCounter(err);
        return true;
      }
    },
    /**
     * Fails CLOSED, unlike the others. A dead counter silencing the assistant
     * is worse than an unmetered window; a dead counter letting an unmetered
     * number of emails leave the BIS domain is how a sending reputation is
     * lost, and the visitor still has their result on screen either way.
     */
    async allowReport(ip) {
      try {
        const used = await counter.incr(`web:rl:report:${ip}`, REPORT_WINDOW_SECONDS);
        return used <= REPORTS_PER_WINDOW;
      } catch (err) {
        logBrokenCounter(err);
        return false;
      }
    },
    /**
     * Fails CLOSED, for the same reason as `allowReport` and more so. The two
     * fail-open limits protect against waste; an unmetered voice session is a
     * bill that grows by the minute for as long as someone leaves it running.
     * A visitor refused here still has the phone number and the chat.
     */
    async allowSofiaSession(ip) {
      try {
        const used = await counter.incr(`web:rl:sofia:${ip}`, SOFIA_WINDOW_SECONDS);
        return used <= SOFIA_SESSIONS_PER_WINDOW;
      } catch (err) {
        logBrokenCounter(err);
        return false;
      }
    },
  };
}

/** Fallback used when Redis is unconfigured — correct for local dev and tests. */
export function createMemoryCounter(nowMs: () => number = () => Date.now()): Counter {
  const entries = new Map<string, { count: number; expiresAt: number }>();
  return {
    async incr(key, ttlSeconds) {
      const at = nowMs();
      const existing = entries.get(key);
      if (!existing || existing.expiresAt <= at) {
        entries.set(key, { count: 1, expiresAt: at + ttlSeconds * 1000 });
        return 1;
      }
      existing.count += 1;
      return existing.count;
    },
  };
}

/**
 * Built on demand, never at module load: reading env at import time would bake
 * the "unconfigured" answer into the build, and route handlers are evaluated
 * during `next build` page-data collection where these vars do not exist.
 *
 * Accepts both env spellings. The Vercel Marketplace integration injects
 * KV_REST_API_*, while a direct Upstash project injects UPSTASH_REDIS_REST_*.
 */
let cached: Limits | undefined;
export async function getLimits(): Promise<Limits> {
  if (cached) return cached;

  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    console.warn('[limits] no Redis configured — using in-process counters (per-instance only)');
    cached = makeLimits(createMemoryCounter());
    return cached;
  }

  const { Redis } = await import('@upstash/redis');
  const redis = new Redis({ url, token });
  cached = makeLimits({
    async incr(key, ttlSeconds) {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, ttlSeconds);
      return count;
    },
  });
  return cached;
}
