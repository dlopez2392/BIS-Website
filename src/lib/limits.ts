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

export interface Counter {
  /** Increments `key`, setting `ttlSeconds` on first write, and returns the new count. */
  incr(key: string, ttlSeconds: number): Promise<number>;
}

export interface Limits {
  allowChat(ip: string): Promise<boolean>;
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
