'use server';

import { headers } from 'next/headers';
import { checkBotId } from 'botid/server';
import { runScan, type ScanResult } from '@/lib/scan/run';
import { gather } from '@/lib/scan/probe';
import { getLimits } from '@/lib/limits';
import { report } from '@/lib/observability/reporter';
import { verifyHuman } from '@/lib/security/verify-human';

// This action reads DNS and follows redirects by hand, so it needs the Node
// runtime — which is the App Router default. It cannot say so with a `runtime`
// export, because a 'use server' module may only export async functions.

export async function checkSite(input: unknown): Promise<ScanResult> {
  if (typeof input !== 'string') return { ok: false, error: 'malformed' };

  const { allowed } = await verifyHuman({ check: checkBotId, report });
  if (!allowed) return { ok: false, error: 'rate-limited' };

  const requestHeaders = await headers();
  const ip = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limits = await getLimits();

  return runScan(input, { gather, allow: () => limits.allowScan(ip), report });
}
