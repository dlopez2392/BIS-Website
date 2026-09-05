'use client';
import { useMemo, useState, useId } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Clock, PhoneIncoming, Languages, Wallet } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import {
  estimate,
  CALL_CAPTURE_RATE,
  ADMIN_AUTOMATION_RATE,
  WORKING_WEEKS,
} from '@/lib/estimate/hours';

/**
 * The whole calculation runs in the browser. Nothing is posted, so there is
 * no endpoint to rate limit, nothing to protect from scripts, and nothing for
 * a visitor to consent to before they see their own number.
 */

function Field({
  label, help, value, onChange, min, max, step, prefix, suffix,
}: {
  label: string; help: string; value: number; onChange: (n: number) => void;
  min: number; max: number; step: number; prefix?: string; suffix?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block font-semibold text-ink">{label}</label>
      <p id={`${id}-help`} className="mt-1 text-sm text-ink-muted">{help}</p>
      <div className="mt-2 flex items-center gap-3">
        {prefix && <span aria-hidden="true" className="text-ink-muted">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : ''}
          aria-describedby={`${id}-help`}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className="w-28 rounded-md border border-hairline bg-surface px-3 py-2 tabular-nums text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        />
        {suffix && <span aria-hidden="true" className="text-ink-muted">{suffix}</span>}
        <input
          type="range"
          aria-hidden="true"
          tabIndex={-1}
          min={min}
          max={max}
          step={step}
          value={Math.min(value || 0, max)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1 flex-1 accent-primary"
        />
      </div>
    </div>
  );
}

function Line({ icon: Icon, headline, body }: { icon: typeof Clock; headline: string; body: string }) {
  return (
    <li className="flex gap-4 py-5">
      <Icon aria-hidden="true" className="mt-1 h-5 w-5 flex-none text-accent" />
      <div>
        <p className="text-xl font-bold tabular-nums text-ink">{headline}</p>
        <p className="mt-1 text-ink-muted">{body}</p>
      </div>
    </li>
  );
}

export function FirstHourBack() {
  const t = useTranslations('firstHourBack');
  const locale = useLocale();
  const [calls, setCalls] = useState(0);
  const [admin, setAdmin] = useState(0);
  const [rate, setRate] = useState(0);
  const [spanish, setSpanish] = useState(0);

  const result = useMemo(
    () => estimate({
      missedCallsPerWeek: calls,
      adminHoursPerWeek: admin,
      hourlyValue: rate,
      spanishSharePercent: spanish,
    }),
    [calls, admin, rate, spanish],
  );

  const money = useMemo(
    () => new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    }),
    [locale],
  );

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-2">
      <div className="flex flex-col gap-7">
        <Field label={t('callsLabel')} help={t('callsHelp')} value={calls} onChange={setCalls} min={0} max={50} step={1} />
        <Field label={t('adminLabel')} help={t('adminHelp')} value={admin} onChange={setAdmin} min={0} max={40} step={1} />
        <Field label={t('rateLabel')} help={t('rateHelp')} value={rate} onChange={setRate} min={0} max={300} step={5} prefix="$" />
        <Field label={t('spanishLabel')} help={t('spanishHelp')} value={spanish} onChange={setSpanish} min={0} max={100} step={5} suffix="%" />
      </div>

      <div aria-live="polite">
        {!result.hasInput ? (
          <div className="rounded-md border border-hairline bg-surface-alt p-6">
            <h2 className="font-bold text-ink">{t('emptyHeading')}</h2>
            <p className="mt-2 text-ink-muted">{t('emptyBody')}</p>
          </div>
        ) : (
          <>
            <h2 className="text-xs font-bold uppercase tracking-widest text-accent">{t('resultHeading')}</h2>
            <ul className="mt-2 divide-y divide-hairline border-y border-hairline">
              {result.hoursPerWeek > 0 && (
                <Line
                  icon={Clock}
                  headline={t('hoursLine', { hours: result.hoursPerWeek })}
                  body={t('hoursYear', { hoursYear: result.hoursPerYear, weeks: WORKING_WEEKS })}
                />
              )}
              {result.callsAnswered > 0 && (
                <Line icon={PhoneIncoming} headline={t('callsLine', { calls: result.callsAnswered })} body={t('callsBody')} />
              )}
              {result.valuePerYear !== null && (
                <Line icon={Wallet} headline={t('valueLine', { value: money.format(result.valuePerYear) })} body={t('valueBody')} />
              )}
              {result.bilingualMatters && (
                <Line icon={Languages} headline={t('bilingualHeading')} body={t('bilingualBody')} />
              )}
            </ul>

            <div className="mt-8 rounded-md bg-surface-alt p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-accent">{t('assumptionsHeading')}</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-muted">
                <li>{t('assumption1', { callRate: Math.round(CALL_CAPTURE_RATE * 100) })}</li>
                <li>{t('assumption2', { adminRate: Math.round(ADMIN_AUTOMATION_RATE * 100) })}</li>
                <li>{t('assumption3', { weeks: WORKING_WEEKS })}</li>
                <li>{t('assumption4')}</li>
              </ul>
            </div>

            <div className="mt-8 rounded-md border border-hairline p-6">
              <h3 className="text-xl font-bold text-ink">{t('ctaHeading')}</h3>
              <p className="mt-2 text-ink-muted">{t('ctaBody')}</p>
              <Link
                href="/contact"
                className="mt-4 inline-block rounded-md bg-primary px-6 py-3 font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
              >
                {t('ctaButton')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
