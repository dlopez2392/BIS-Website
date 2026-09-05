import { parseTarget, UnsafeTargetError, type TargetError } from './target';
import { runChecks, score, headline, type Finding, type Grade } from './checks';
import type { Evidence } from './checks';

/**
 * One check, start to finish, over injected I/O so the whole flow is testable
 * without a network.
 */

export type ScanError = TargetError | 'unreachable' | 'rate-limited' | 'failed';

export type ScanResult =
  | { ok: true; domain: string; grade: Grade; points: number; findings: Finding[]; headline: Finding[] }
  | { ok: false; error: ScanError };

export interface ScanDeps {
  gather: (hostname: string) => Promise<Evidence>;
  allow: () => Promise<boolean>;
  report: (input: { event: string; level: 'error' | 'critical'; error?: unknown; context?: Record<string, unknown> }) => Promise<void>;
}

export async function runScan(input: string, deps: ScanDeps): Promise<ScanResult> {
  const target = parseTarget(input);
  if (!target.ok) return { ok: false, error: target.error };

  if (!(await deps.allow())) return { ok: false, error: 'rate-limited' };

  let evidence: Evidence;
  try {
    evidence = await deps.gather(target.hostname);
  } catch (error) {
    // A name that does not resolve, or resolves somewhere this server will not
    // go, is the visitor's problem to fix and not an incident. Everything else
    // is ours, and is reported.
    if (error instanceof UnsafeTargetError) return { ok: false, error: 'unreachable' };
    await deps.report({ event: 'scan.failed', level: 'error', error, context: { domain: target.hostname } });
    return { ok: false, error: 'failed' };
  }

  const findings = runChecks(evidence);
  const { points, grade } = score(findings);
  return { ok: true, domain: target.hostname, grade, points, findings, headline: headline(findings) };
}
