/**
 * Where failures go.
 *
 * Before this, every failure on the site ended at `console.error`. On Vercel
 * that means a line in a log nobody reads, so the two failures that actually
 * cost money — a lead the database refused, a gated download that reached
 * neither the database nor the visitor's inbox — were invisible. A visitor saw
 * an apology and went elsewhere; BIS never learned it happened.
 *
 * So reporting has two levels, and they are different things:
 *
 *   `error`    something broke, the request recovered. Logged as one JSON line
 *              with a stable event name, greppable in Vercel's runtime logs.
 *   `critical` something broke and a person's enquiry is at stake. Logged the
 *              same way AND emailed to the address that already receives lead
 *              notifications, carrying enough detail to recover the lead by
 *              hand.
 *
 * Two rules the implementation holds to. Reporting never throws: a broken
 * reporter must not turn a recovered failure into a 500. And a critical alert
 * is throttled per event, because a vendor outage produces one failure per
 * visitor and an inbox with 400 identical emails is the same as no alert.
 */

import type { Counter } from '@/lib/limits';

export type Level = 'error' | 'critical';

export interface ReportInput {
  /** Stable, greppable, dotted: `lead.insert_failed`. Never interpolate values into it. */
  event: string;
  level: Level;
  error?: unknown;
  /** Anything that helps diagnose. Emails and phone numbers are masked in logs. */
  context?: Record<string, unknown>;
  /** Extra lines for the alert email only — details a person needs to recover the lead. */
  recovery?: Record<string, string>;
}

export interface ReporterDeps {
  now: () => Date;
  log: (line: string) => void;
  sendAlert: (subject: string, body: string) => Promise<void>;
  /** False when an alert for this event was already sent inside the throttle window. */
  shouldAlert: (event: string) => Promise<boolean>;
}

export interface Reporter {
  report: (input: ReportInput) => Promise<void>;
}

/** One alert per event per quarter hour. Long enough to not flood, short enough to notice a new outage. */
export const ALERT_THROTTLE_SECONDS = 900;

const EMAIL = /\b([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g;
// A leading `\b` would not hold before a `+`, which left the country code
// unmasked; a lookbehind anchors the match at the start of the number itself.
const PHONE = /(?<![\w+])(\+?\d[\d\s().-]{7,}\d)\b/g;

/**
 * Logs are a different audience from the alert inbox. The inbox is BIS reading
 * about its own enquiry and needs the address to answer it; the log is a
 * durable third-party store and gets `d***@gmail.com` instead.
 */
export function maskPii(value: string): string {
  return value
    .replace(EMAIL, (_m, first: string, domain: string) => `${first}***${domain}`)
    .replace(PHONE, (m: string) => `${m.slice(0, 2)}***${m.slice(-2)}`);
}

function describe(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === 'string') return error;
  if (error === undefined) return '';
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function maskDeep(context: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(context).map(([k, v]) => [k, typeof v === 'string' ? maskPii(v) : v]),
  );
}

export function makeReporter(deps: ReporterDeps): Reporter {
  return {
    async report({ event, level, error, context, recovery }) {
      try {
        const line = JSON.stringify({
          at: deps.now().toISOString(),
          level,
          event,
          error: maskPii(describe(error)),
          ...maskDeep(context ?? {}),
        });
        deps.log(line);

        if (level !== 'critical') return;
        if (!(await deps.shouldAlert(event))) return;

        const detail = Object.entries(recovery ?? {}).map(([k, v]) => `${k}: ${v}`);
        const body = [
          `Event: ${event}`,
          `When: ${deps.now().toISOString()}`,
          `Error: ${describe(error)}`,
          ...(detail.length ? ['', 'Recover this by hand:', ...detail] : []),
          '',
          `Further alerts for ${event} are suppressed for ${ALERT_THROTTLE_SECONDS / 60} minutes.`,
        ].join('\n');
        await deps.sendAlert(`[bis-rgv.com] ${event}`, body);
      } catch (reporterFailure) {
        // Last resort. Nothing above this line may propagate.
        try {
          deps.log(`{"level":"error","event":"report.failed","error":${JSON.stringify(describe(reporterFailure))}}`);
        } catch {
          /* give up quietly rather than break the caller */
        }
      }
    },
  };
}

/** Throttle backed by the same shared counter the rate limiter uses, so it survives instance recycling. */
export function throttleWith(counter: Counter): (event: string) => Promise<boolean> {
  return async (event) => {
    try {
      return (await counter.incr(`web:alert:${event}`, ALERT_THROTTLE_SECONDS)) === 1;
    } catch {
      // A dead counter must not silence a critical alert; send it.
      return true;
    }
  };
}
