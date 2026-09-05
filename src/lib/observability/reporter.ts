import { makeReporter, throttleWith, type Reporter } from './report';
import { createMemoryCounter } from '@/lib/limits';

/**
 * The wired reporter. Built on demand rather than at module load for the same
 * reason `getLimits()` is: route modules are evaluated during `next build`
 * page-data collection, where none of these env vars exist.
 */
let cached: Reporter | undefined;

export async function getReporter(): Promise<Reporter> {
  if (cached) return cached;

  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  let counter = createMemoryCounter();
  if (url && token) {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url, token });
    counter = {
      async incr(key, ttlSeconds) {
        const count = await redis.incr(key);
        if (count === 1) await redis.expire(key, ttlSeconds);
        return count;
      },
    };
  }

  cached = makeReporter({
    now: () => new Date(),
    log: (line) => console.error(line),
    shouldAlert: throttleWith(counter),
    // Imported lazily so a build without RESEND_API_KEY still collects page data.
    sendAlert: async (subject, body) => {
      const { sendOperationalAlert } = await import('@/lib/email/resend');
      await sendOperationalAlert(subject, body);
    },
  });
  return cached;
}

/** Convenience for call sites that have nothing to do with the result. */
export async function report(input: Parameters<Reporter['report']>[0]): Promise<void> {
  const reporter = await getReporter();
  await reporter.report(input);
}
