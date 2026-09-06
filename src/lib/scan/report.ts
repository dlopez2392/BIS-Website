import { reportRequestSchema, type ReportResult } from './report-schema';
import { parseTarget, UnsafeTargetError } from './target';
import { runChecks, score, headline, type Evidence, type Finding } from './checks';
import type { ReportFinding } from '@/emails/ScanReport';
import type { ContactFormValues } from '@/lib/contact-schema';
import type { ReportInput } from '@/lib/observability/report';

/**
 * Emailing the full report, and turning it into a lead.
 *
 * The scan is run again here rather than trusting anything the browser sends
 * back. That is not caution about correctness; it is the difference between a
 * tool and an abuse vector. If the findings arrived from the client, anyone
 * could have BIS email an authoritative-looking "security report" about a
 * third party, saying whatever they wanted, from a domain that now publishes
 * SPF and DMARC precisely so its mail is trusted.
 */

export interface ReportDeps {
  gather: (hostname: string) => Promise<Evidence>;
  allow: () => Promise<boolean>;
  /** Finding copy from the site's own catalogue, so page and email agree. */
  describe: (finding: Finding, locale: 'en' | 'es') => ReportFinding;
  sendReport: (input: {
    to: string; name: string; locale: 'en' | 'es'; domain: string;
    grade: string; points: number; headline: ReportFinding[]; findings: ReportFinding[];
  }) => Promise<void>;
  insertLead: (v: ContactFormValues) => Promise<{ id: string }>;
  notifyLead: (v: ContactFormValues) => Promise<void>;
  report: (input: ReportInput) => Promise<void>;
}

/** A one-line summary of what was found, so a follow-up call opens with substance. */
export function leadMessage(domain: string, grade: string, points: number, top: ReportFinding[]): string {
  const lines = top.map((f) => `- ${f.title} (${f.status})`);
  return [`[security check] ${domain} scored ${grade} (${points}/100).`, ...lines].join('\n');
}

export async function requestReport(input: unknown, deps: ReportDeps): Promise<ReportResult> {
  const parsed = reportRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  const { domain, email, name, locale, website } = parsed.data;

  // Honeypot: silently accepted so a script learns nothing, and nothing is sent.
  if (website) return { ok: true };

  const target = parseTarget(domain);
  if (!target.ok) return { ok: false, error: 'invalid' };

  if (!(await deps.allow())) return { ok: false, error: 'rate-limited' };

  let evidence: Evidence;
  try {
    evidence = await deps.gather(target.hostname);
  } catch (error) {
    if (error instanceof UnsafeTargetError) return { ok: false, error: 'unreachable' };
    await deps.report({ event: 'scan.report_scan_failed', level: 'error', error, context: { domain: target.hostname } });
    return { ok: false, error: 'failed' };
  }

  const findings = runChecks(evidence);
  const { points, grade } = score(findings);
  const described = findings.map((f) => deps.describe(f, locale));
  const top = headline(findings).map((f) => deps.describe(f, locale));

  try {
    await deps.sendReport({ to: email, name, locale, domain: target.hostname, grade, points, headline: top, findings: described });
  } catch (error) {
    // The visitor asked for something and did not get it, and they already
    // have the result on screen, so this is worth a person seeing.
    await deps.report({
      event: 'scan.report_email_failed',
      level: 'critical',
      error,
      context: { domain: target.hostname, email },
      recovery: { Email: email, Name: name || '(not given)', Domain: target.hostname, Grade: `${grade} (${points}/100)` },
    });
    return { ok: false, error: 'failed' };
  }

  // The lead is the point of the tool. It is recorded after the visitor has
  // been served, and a failure here never costs them their report.
  const lead: ContactFormValues = {
    fullName: name || email,
    businessName: target.hostname,
    email,
    phone: '',
    industry: 'other',
    language: locale,
    message: leadMessage(target.hostname, grade, points, top),
  };
  try {
    await deps.insertLead(lead);
  } catch (error) {
    await deps.report({
      event: 'lead.insert_failed',
      level: 'critical',
      error,
      context: { source: 'security-check', email },
      recovery: { Name: lead.fullName, Email: email, Domain: target.hostname, Result: `${grade} (${points}/100)` },
    });
  }
  try {
    await deps.notifyLead(lead);
  } catch (error) {
    await deps.report({ event: 'lead.notify_failed', level: 'error', error, context: { source: 'security-check' } });
  }

  return { ok: true };
}
