'use server';

import { headers } from 'next/headers';
import { checkBotId } from 'botid/server';
import { getTranslations } from 'next-intl/server';
import { runScan, type ScanResult } from '@/lib/scan/run';
import { requestReport } from '@/lib/scan/report';
import type { ReportResult } from '@/lib/scan/report-schema';
import { gather } from '@/lib/scan/probe';
import type { Finding } from '@/lib/scan/checks';
import { getLimits } from '@/lib/limits';
import { report } from '@/lib/observability/reporter';
import { verifyHuman } from '@/lib/security/verify-human';
import { securityCheckPath } from '@/lib/security/protected-routes';
import { routing } from '@/i18n/routing';

// This action reads DNS and follows redirects by hand, so it needs the Node
// runtime — which is the App Router default. It cannot say so with a `runtime`
// export, because a 'use server' module may only export async functions.

export async function checkSite(input: unknown, locale?: unknown): Promise<ScanResult> {
  if (typeof input !== 'string') return { ok: false, error: 'malformed' };
  // The locale decides which page path armed the client-side challenge, so an
  // unknown one is refused rather than asking BotID about a path that was
  // never protected.
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    return { ok: false, error: 'malformed' };
  }

  const { allowed } = await verifyHuman({ check: checkBotId, report, path: securityCheckPath(locale as string) });
  if (!allowed) return { ok: false, error: 'rate-limited' };

  const requestHeaders = await headers();
  const ip = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limits = await getLimits();

  return runScan(input, { gather, allow: () => limits.allowScan(ip), report });
}

/**
 * Emails the full report and records the lead.
 *
 * Finding copy is read from the site's own message catalogue and passed to the
 * email, so the page and the email can never describe the same finding
 * differently.
 */
export async function emailReport(input: unknown): Promise<ReportResult> {
  const locale = (input as { locale?: unknown })?.locale;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    return { ok: false, error: 'invalid' };
  }

  const { allowed } = await verifyHuman({ check: checkBotId, report, path: securityCheckPath(locale as string) });
  if (!allowed) return { ok: false, error: 'rate-limited' };

  const requestHeaders = await headers();
  const ip = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limits = await getLimits();

  const t = await getTranslations({ locale: locale as string, namespace: 'securityCheck' });
  const describe = (finding: Finding) => ({
    title: t(`checks.${finding.id}.title`),
    explanation: t.has(`checks.${finding.id}.${finding.status}`) ? t(`checks.${finding.id}.${finding.status}`) : '',
    status: finding.status,
  });

  // Imported at the point of use, not up front. `@/lib/contact/repository`
  // pulls in `@/db`, which calls neon() at module load and throws without
  // DATABASE_URL — so eager imports made an invalid email address crash the
  // action before its own validation ever ran. Observed locally; it would have
  // been invisible on Vercel, where the variable is always present.
  return requestReport(input, {
    gather,
    allow: () => limits.allowReport(ip),
    describe,
    sendReport: async (payload) => (await import('@/lib/email/resend')).sendScanReport(payload),
    insertLead: async (lead) => (await import('@/lib/contact/repository')).insertLead(lead),
    notifyLead: async (lead) => (await import('@/lib/email/resend')).sendLeadNotification(lead),
    report,
  });
}
