'use client';
import { Fragment, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from '@/i18n/navigation';
import { LiveCall, type LiveCallStrings } from './LiveCall';
import { FOCUS_IDS, type FocusId, type StillFocusId } from '@/lib/home/focus';

export interface StillPanel {
  head: string; meta: string; status: string;
  /** One exchange: the owner, then BIS. */
  lines: string[];
  recTitle: string;
  record: { k: string; v: string }[];
  stripK: string; strip: string;
  cta: string; href: string;
}

export interface FocusPanelStrings {
  tabsLabel: string; owner: string; us: string; note: string;
  tabs: Record<FocusId, { tab: string; title: string }>;
  panels: Record<StillFocusId, StillPanel>;
  call: LiveCallStrings;
}

/**
 * The hero's object, once per thing we do.
 *
 * The page was built on one three-layer card: a conversation, the record it
 * leaves, and the line under it that says what came of it. That card was only
 * ever the AI receptionist. Here the same three layers carry each of the five
 * areas, picked from a row of tabs, so a visitor who came for a website or a
 * security review sees their own case in the hero rather than a phone call.
 *
 * AI keeps the live call, the only one that plays. The other four are still:
 * an example of the first conversation (labelled as an example in its header
 * and its footnote, since nobody said these words), what we deliver, and
 * where to see it.
 */
export function FocusPanel({ strings, initial = 'ai' }: { strings: FocusPanelStrings; initial?: FocusId }) {
  const [active, setActive] = useState<FocusId>(initial);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = FOCUS_IDS.indexOf(active);
    const to = e.key === 'ArrowRight' ? at + 1 : e.key === 'ArrowLeft' ? at - 1
      : e.key === 'Home' ? 0 : e.key === 'End' ? FOCUS_IDS.length - 1 : -1;
    if (to < 0 && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (to + FOCUS_IDS.length) % FOCUS_IDS.length;
    setActive(FOCUS_IDS[next]);
    tabs.current[next]?.focus();
  };

  const still = active === 'ai' ? null : strings.panels[active];

  return (
    <div className="hm-focus" data-focus-panel={active}>
      <div className="hm-tabs" role="tablist" aria-label={strings.tabsLabel} onKeyDown={onKey}>
        {FOCUS_IDS.map((id, i) => (
          <button
            key={id} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab"
            id={`focus-tab-${id}`} aria-controls="focus-tabpanel" aria-selected={active === id}
            tabIndex={active === id ? 0 : -1} title={strings.tabs[id].title} onClick={() => setActive(id)}
          >
            {strings.tabs[id].tab}
          </button>
        ))}
      </div>
      <div id="focus-tabpanel" role="tabpanel" aria-labelledby={`focus-tab-${active}`}>
        {still ? (
          <figure className="hm-call" aria-label={strings.tabs[active].title}>
            <div className="hm-call-head">
              <span className="hm-live" data-ended="true">
                <span className="hm-dot" aria-hidden="true" />
                {still.status}
              </span>
              <div className="hm-call-who">
                <div className="hm-call-biz">{still.head}</div>
                <div className="hm-call-meta">{still.meta}</div>
              </div>
            </div>
            <ol className="hm-transcript hm-transcript--still">
              {still.lines.map((text, i) => (
                <li key={`${active}-${i}`} className="hm-msg" data-who={i % 2 === 0 ? 'caller' : 'sofia'}>
                  <span className="hm-spk">{i % 2 === 0 ? strings.owner : strings.us}</span>
                  <span className="hm-txt">{text}</span>
                </li>
              ))}
            </ol>
            <div className="hm-crm" data-on="true">
              <p className="hm-crm-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                {still.recTitle}
              </p>
              <dl>
                {still.record.map((row) => (
                  <Fragment key={row.k}>
                    <dt>{row.k}</dt><dd data-on="true">{row.v}</dd>
                  </Fragment>
                ))}
              </dl>
            </div>
            <div className="hm-monday">
              <span className="hm-k">{still.stripK}</span>
              <span>{still.strip}</span>
            </div>
            <figcaption className="hm-call-foot">
              <span className="hm-call-note">{strings.note}</span>
              <Link href={still.href} className="hm-btn hm-btn-ghost hm-btn-sm">{still.cta}</Link>
            </figcaption>
          </figure>
        ) : (
          <LiveCall strings={strings.call} />
        )}
      </div>
    </div>
  );
}
