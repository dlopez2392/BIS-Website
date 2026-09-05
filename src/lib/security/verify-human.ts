import type { ReportInput } from '@/lib/observability/report';

/**
 * The bot check, with the same failure rule the rate limiter already follows:
 * fail OPEN.
 *
 * `checkBotId()` throws when the verification infrastructure is not reachable
 * — off Vercel entirely, or on Vercel with the OIDC token not enabled for the
 * project. Left unguarded that turns a protective measure into an outage: the
 * assistant answers nobody and the download form rejects everybody, for a
 * misconfiguration nobody can see from the outside. A silenced assistant is
 * worse than an unverified one, exactly as `makeLimits` argues about a dead
 * Redis, so a broken check lets the request through and says so.
 *
 * Verified crawlers pass on purpose. robots.txt invites answer engines to read
 * this site, and a policy that contradicts itself one layer down is a bug
 * waiting to be discovered by whoever stops being cited.
 */

export interface Verification {
  isBot: boolean;
  isVerifiedBot: boolean;
}

export interface VerifyDeps {
  check: () => Promise<Verification>;
  report: (input: ReportInput) => Promise<void>;
}

export interface VerifyResult {
  /** False only when the check ran and identified an unverified bot. */
  allowed: boolean;
  /** True when the check could not run at all, so `allowed` is an assumption. */
  degraded: boolean;
}

export async function verifyHuman(deps: VerifyDeps): Promise<VerifyResult> {
  let verdict: Verification;
  try {
    verdict = await deps.check();
  } catch (error) {
    await deps.report({
      event: 'botid.unavailable',
      level: 'error',
      error,
      context: { effect: 'request allowed without verification' },
    });
    return { allowed: true, degraded: true };
  }
  return { allowed: !(verdict.isBot && !verdict.isVerifiedBot), degraded: false };
}
