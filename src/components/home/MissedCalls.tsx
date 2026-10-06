'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { track } from '@vercel/analytics';
import { Link } from '@/i18n/navigation';
import { missedCalls, JOB_SHARE } from '@/lib/estimate/missed-calls';
import { CALL_CAPTURE_RATE } from '@/lib/estimate/hours';

/**
 * What the calls you miss are worth — three numbers, answered as you type.
 *
 * Runs entirely in the browser: nothing is posted, so there is nothing to
 * consent to before a visitor sees their own number. The typed field is the
 * control a keyboard and a screen reader use; the slider beside it is the same
 * value for a thumb, hidden from assistive tech so nothing is announced twice
 * (the pattern the full tool on /tools/first-hour-back already uses).
 */
function Field({
  label, help, value, onChange, max, step, prefix, suffix,
}: {
  label: string; help: string; value: number; onChange: (n: number) => void;
  max: number; step: number; prefix?: string; suffix?: string;
}) {
  const id = useId();
  return (
    <div className="calc-field">
      <label htmlFor={id}>{label}</label>
      <p id={`${id}-help`}>{help}</p>
      <div className="calc-row">
        <span className="calc-num">
          {prefix ? <span aria-hidden="true">{prefix}</span> : null}
          <input
            id={id} type="number" inputMode="numeric" min={0} max={max} step={step}
            value={value === 0 ? '' : value} placeholder="0"
            aria-describedby={`${id}-help`}
            onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          />
          {suffix ? <span aria-hidden="true">{suffix}</span> : null}
        </span>
        <input
          type="range" aria-hidden="true" tabIndex={-1} min={0} max={max} step={step}
          value={Math.min(value || 0, max)} onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

export function MissedCalls() {
  const t = useTranslations('missedCalls');
  const locale = useLocale();
  // The owner's own week, so these start where most small shops are and are
  // theirs to change. The job value starts EMPTY: that one is a price, and a
  // price BIS chose would be a price BIS has to defend.
  const [calls, setCalls] = useState(30);
  const [missed, setMissed] = useState(20);
  const [job, setJob] = useState(0);
  const counted = useRef(false);

  const r = useMemo(
    () => missedCalls({ callsPerWeek: calls, missedPercent: missed, jobValue: job }),
    [calls, missed, job],
  );
  const money = useMemo(
    () => new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    }),
    [locale],
  );

  // One event per visit, on the first change, so the number is "people who
  // used it" and not "slider ticks".
  const touch = <T,>(set: (v: T) => void) => (v: T) => {
    if (!counted.current) {
      counted.current = true;
      track('calc_used');
    }
    set(v);
  };

  return (
    <div className="calc" data-calc>
      <div className="calc-inputs">
        <Field label={t('callsLabel')} help={t('callsHelp')} value={calls} onChange={touch(setCalls)} max={300} step={1} />
        <Field label={t('missedLabel')} help={t('missedHelp')} value={missed} onChange={touch(setMissed)} max={100} step={5} suffix="%" />
        <Field label={t('jobLabel')} help={t('jobHelp')} value={job} onChange={touch(setJob)} max={20000} step={25} prefix="$" />
      </div>

      <div className="calc-out" aria-live="polite">
        {!r.hasInput ? (
          <p className="calc-empty">{t('empty')}</p>
        ) : (
          <>
            {r.lostPerMonth !== null ? (
              <p className="calc-big" data-calc-lost>
                {t('lostLine', { amount: money.format(r.lostPerMonth) })}
              </p>
            ) : (
              <p className="calc-big">{t('missedLine', { n: r.missedPerMonth })}</p>
            )}
            <ul className="calc-lines">
              {r.lostPerMonth !== null ? <li>{t('missedLine', { n: r.missedPerMonth })}</li> : null}
              <li>{t('jobsLine', { n: r.jobsPerMonth })}</li>
              {r.recoverablePerMonth !== null ? (
                <li>{t('recoverLine', {
                  amount: money.format(r.recoverablePerMonth),
                  rate: Math.round(CALL_CAPTURE_RATE * 100),
                })}</li>
              ) : (
                <li className="calc-hint">{t('setJob')}</li>
              )}
            </ul>
            <p className="calc-assume">{t('assumption', { share: Math.round(1 / JOB_SHARE) })}</p>
          </>
        )}
        <div className="calc-ctas">
          <a href="#close" className="hm-btn hm-btn-primary hm-btn-sm">{t('cta')}</a>
          <Link href="/tools/first-hour-back" className="hm-more">{t('more')} <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </div>
  );
}
