'use client';
import { useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { track } from '@vercel/analytics';
import { ShieldCheck, ShieldAlert, ShieldX, Minus, Loader2, Mail } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { checkSite, emailReport } from '@/app/[locale]/tools/security-check/actions';
import type { ScanResult, ScanError } from '@/lib/scan/run';
import type { ReportResult } from '@/lib/scan/report-schema';
import type { Finding, Status } from '@/lib/scan/checks';

/** Message keys are camelCase; the scan's error codes are kebab-case. */
const ERROR_KEY: Record<ScanError, string> = {
  empty: 'empty',
  malformed: 'malformed',
  'not-public': 'notPublic',
  'ip-address': 'ipAddress',
  unreachable: 'unreachable',
  'rate-limited': 'rateLimited',
  failed: 'failed',
};

const STATUS_ICON = {
  pass: ShieldCheck,
  warn: ShieldAlert,
  fail: ShieldX,
  unknown: Minus,
} as const;

// Status is never colour alone: each row carries an icon, the word, and the
// explanation. A red dot means nothing to someone who cannot see red.
const STATUS_TONE: Record<Status, string> = {
  pass: 'text-emerald-700 dark:text-emerald-400',
  warn: 'text-amber-700 dark:text-amber-400',
  fail: 'text-red-700 dark:text-red-400',
  unknown: 'text-ink-muted',
};

const GRADE_TONE: Record<string, string> = {
  A: 'text-emerald-700 dark:text-emerald-400',
  B: 'text-emerald-700 dark:text-emerald-400',
  C: 'text-amber-700 dark:text-amber-400',
  D: 'text-red-700 dark:text-red-400',
  F: 'text-red-700 dark:text-red-400',
};

function FindingRow({ finding, compact = false }: { finding: Finding; compact?: boolean }) {
  const t = useTranslations('securityCheck');
  const Icon = STATUS_ICON[finding.status];
  // Not every check defines copy for every status — a pass has no "fail" line.
  // A row already explained at the top of the page keeps its place in the full
  // list, for completeness, but does not repeat the paragraph word for word.
  const explanation = !compact && t.has(`checks.${finding.id}.${finding.status}`)
    ? t(`checks.${finding.id}.${finding.status}`)
    : null;

  return (
    <li className="flex gap-3 py-4">
      <Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 flex-none ${STATUS_TONE[finding.status]}`} />
      <div>
        <p className="font-semibold text-ink">
          {t(`checks.${finding.id}.title`)}{' '}
          <span className={`text-sm font-medium ${STATUS_TONE[finding.status]}`}>
            · {t(`status${finding.status[0].toUpperCase()}${finding.status.slice(1)}`)}
          </span>
        </p>
        {explanation && <p className="mt-1 text-ink-muted">{explanation}</p>}
      </div>
    </li>
  );
}

/**
 * The half that makes this a lead engine rather than a giveaway. It appears
 * only once there is a result worth sending, so it asks for an address after
 * the visitor has already been given something.
 */
function ReportRequest({ domain, locale }: { domain: string; locale: string }) {
  const t = useTranslations('securityCheck');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<ReportResult extends { ok: true } ? never : string>('' as never);
  const honeypot = useRef<HTMLInputElement>(null);

  const ERROR_KEY = {
    invalid: 'reportErrorInvalid',
    'rate-limited': 'reportErrorRateLimited',
    unreachable: 'reportErrorInvalid',
    failed: 'reportErrorFailed',
  } as const;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setState('sending');
    try {
      const result = await emailReport({
        domain, email, name, locale,
        website: honeypot.current?.value ?? '',
      });
      if (result.ok) {
        setState('sent');
        track('security_report_sent');
      } else {
        setError(t(ERROR_KEY[result.error]) as never);
        setState('error');
      }
    } catch {
      setError(t('reportErrorFailed') as never);
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <div role="status" className="mt-8 rounded-md border border-hairline bg-surface-alt p-6">
        <p className="text-ink">{t('reportSent')}</p>
      </div>
    );
  }

  const field = 'w-full rounded-md border border-hairline bg-surface px-3 py-2 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link';
  return (
    <form onSubmit={submit} className="mt-8 rounded-md border border-hairline bg-surface-alt p-6" noValidate>
      <h3 className="text-xl font-bold text-ink">{t('reportHeading')}</h3>
      <p className="mt-2 text-ink-muted">{t('reportBody')}</p>
      <input ref={honeypot} type="text" tabIndex={-1} autoComplete="off" aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="report-name" className="text-sm font-medium text-ink">{t('nameLabel')}</label>
          <input id="report-name" className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </div>
        <div>
          <label htmlFor="report-email" className="text-sm font-medium text-ink">{t('emailLabel')}</label>
          <input id="report-email" type="email" required className={field} value={email}
            onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
      </div>
      <button type="submit" disabled={state === 'sending'}
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-on-primary disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link">
        {state === 'sending' ? <Loader2 aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" /> : <Mail aria-hidden="true" className="h-4 w-4" />}
        {state === 'sending' ? t('reportSending') : t('reportSubmit')}
      </button>
      <p className="mt-3 text-sm text-ink-muted">{t('reportPrivacy')}</p>
      {state === 'error' && <p data-testid="report-error" role="alert" className="mt-3 text-sm text-ink">{error}</p>}
    </form>
  );
}

export function SecurityCheckForm() {
  const t = useTranslations('securityCheck');
  const locale = useLocale();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const scan = await checkSite(value, locale);
      setResult(scan);
      if (scan.ok) track('security_check', { grade: scan.grade });
    } catch {
      setResult({ ok: false, error: 'failed' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row" noValidate>
        <div className="flex-1">
          <label htmlFor="scan-domain" className="sr-only">{t('inputLabel')}</label>
          <input
            id="scan-domain"
            name="domain"
            type="text"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('placeholder')}
            aria-describedby="scan-disclaimer"
            className="w-full rounded-md border border-hairline bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-white disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        >
          {busy && <Loader2 aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" />}
          {busy ? t('checking') : t('submit')}
        </button>
      </form>

      <p id="scan-disclaimer" className="mt-3 text-sm text-ink-muted">{t('disclaimer')}</p>

      <div aria-live="polite">
        {result && !result.ok && (
          <p role="alert" className="mt-8 rounded-md border border-hairline bg-surface-alt p-4 text-ink">
            {t(`errors.${ERROR_KEY[result.error]}`)}
          </p>
        )}

        {result?.ok && (
          <section className="mt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-hairline pb-4">
              <h2 className="text-2xl font-bold text-ink">{t('resultHeading', { domain: result.domain })}</h2>
              <p className="text-ink-muted">
                {t('scoreLabel')}{' '}
                <span className={`text-3xl font-extrabold tabular-nums ${GRADE_TONE[result.grade]}`}>{result.grade}</span>
                <span className="ml-2 tabular-nums">{result.points}/100</span>
              </p>
            </div>

            {result.headline.length > 0 ? (
              <div className="mt-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-accent">{t('fixFirstHeading')}</h3>
                <ul className="mt-2 divide-y divide-hairline">
                  {result.headline.map((f) => <FindingRow key={f.id} finding={f} />)}
                </ul>
              </div>
            ) : (
              <div className="mt-8 rounded-md bg-surface-alt p-6">
                <h3 className="font-bold text-ink">{t('allClearHeading')}</h3>
                <p className="mt-2 text-ink-muted">{t('allClearBody')}</p>
              </div>
            )}

            <div className="mt-10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-accent">{t('detailHeading')}</h3>
              <ul className="mt-2 divide-y divide-hairline">
                {result.findings.map((f) => (
                  <FindingRow key={f.id} finding={f} compact={result.headline.some((h) => h.id === f.id)} />
                ))}
              </ul>
            </div>

            <ReportRequest domain={result.domain} locale={locale} />

            <div className="mt-10 rounded-md border border-hairline bg-surface-alt p-6">
              <h3 className="text-xl font-bold text-ink">{t('ctaHeading')}</h3>
              <p className="mt-2 text-ink-muted">{t('ctaBody')}</p>
              <Link
                href="/contact"
                className="mt-4 inline-block rounded-md bg-primary px-6 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
              >
                {t('ctaButton')}
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
