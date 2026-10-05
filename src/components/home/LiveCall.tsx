'use client';
import { useEffect, useRef, useState } from 'react';
import {
  SAMPLE_CALLS, SAMPLE_CONTACT, MONDAY_BEFORE, MONDAY_AFTER, CALL_SECONDS, VISIBLE_LINES,
  formatClock, finishedLines, type CallLang, type Speaker,
} from '@/lib/home/calls';

export interface LiveCallStrings {
  label: string; business: string; live: string; ended: string; meta: string;
  crmTitle: string; crmContact: string; crmNeed: string; crmLang: string; crmOutcome: string; crmBooked: string;
  need: string; langEs: string; langEn: string;
  mondayK: string; mondayCalls: string; mondayDelta: string;
  note: string; replay: string; langLabel: string; caller: string;
}

interface Line { id: number; who: Speaker; text: string; typing?: boolean }

interface CallState {
  /** Which playback wrote this state (`lang:run`), so a new one starts empty. */
  key: string;
  lines: Line[];
  seconds: number;
  ended: boolean;
  crmOn: boolean;
  /** How many of the four CRM fields have filled in. */
  filled: number;
  monday: number;
}

const FIELDS = 4;

function finished(lang: CallLang): CallState {
  return {
    key: 'finished',
    lines: finishedLines(lang).map(([who, text], id) => ({ id, who, text })),
    seconds: CALL_SECONDS, ended: true, crmOn: true, filled: FIELDS, monday: MONDAY_AFTER,
  };
}

const EMPTY: CallState = { key: '', lines: [], seconds: 0, ended: false, crmOn: false, filled: 0, monday: MONDAY_BEFORE };

class Stale extends Error {}

/**
 * The hero's proof: a call coming in after hours, Sofía answering it, and the
 * CRM record and Monday's count it leaves behind — the whole product in one
 * object, before a visitor has scrolled.
 *
 * It renders FINISHED on the server and for anyone who asked for reduced
 * motion: the last four lines, the record filled, the count moved. Playback is
 * an enhancement that starts only while the player is on screen, so a reader
 * further down the page is not paying for a typing animation they cannot see,
 * and stops the moment it scrolls away.
 */
export function LiveCall({ strings, initialLang = 'es' }: { strings: LiveCallStrings; initialLang?: CallLang }) {
  const [lang, setLang] = useState<CallLang>(initialLang);
  const [state, setState] = useState<CallState>(() => finished(initialLang));
  const [run, setRun] = useState(0);
  const [visible, setVisible] = useState(false);
  const [motion, setMotion] = useState(false);
  const box = useRef<HTMLElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setMotion(!mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([en]) => {
      setVisible(en.isIntersecting);
      // Scrolled away: the next time it is on screen is a new playback, so it
      // starts from the top rather than resuming a half-typed line.
      if (!en.isIntersecting) setRun((r) => r + 1);
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!motion || !visible) return;
    let live = true;
    const key = `${lang}:${run}`;
    const wait = (ms: number) => new Promise<void>((res, rej) => {
      setTimeout(() => (live ? res() : rej(new Stale())), ms);
    });
    const patch = (fn: (s: CallState) => CallState) => {
      if (live) setState((s) => ({ ...fn(s.key === key ? s : { ...EMPTY, key }), key }));
    };
    let nextId = 0;
    const push = (line: Omit<Line, 'id'>) => {
      const id = nextId++;
      patch((s) => ({ ...s, lines: [...s.lines, { ...line, id }].slice(-VISIBLE_LINES) }));
    };
    const editLast = (line: Omit<Line, 'id'>) => patch((s) => {
      const last = s.lines[s.lines.length - 1];
      return last ? { ...s, lines: [...s.lines.slice(0, -1), { ...line, id: last.id }] } : s;
    });

    let secs = 0;
    const clock = setInterval(() => {
      secs = Math.min(secs + 4, CALL_SECONDS);
      patch((s) => (s.ended ? s : { ...s, seconds: secs }));
    }, 280);

    (async () => {
      await wait(500);
      for (const [who, text] of SAMPLE_CALLS[lang]) {
        if (who === 'sofia') {
          push({ who, text: '', typing: true });
          for (let i = 1; i <= text.length; i++) {
            editLast({ who, text: text.slice(0, i), typing: true });
            await wait(text[i - 1] === ' ' ? 14 : 22);
          }
          editLast({ who, text });
        } else {
          await wait(420);
          push({ who, text });
        }
        await wait(who === 'sofia' ? 520 : 380);
      }
      clearInterval(clock);
      patch((s) => ({ ...s, seconds: CALL_SECONDS, ended: true }));
      await wait(300);
      patch((s) => ({ ...s, crmOn: true }));
      for (let f = 1; f <= FIELDS; f++) {
        await wait(320);
        patch((s) => ({ ...s, filled: f }));
      }
      await wait(700);
      patch((s) => ({ ...s, monday: MONDAY_AFTER }));
      await wait(9000);
      if (live) setRun((r) => r + 1);
    })().catch((e) => { if (!(e instanceof Stale)) throw e; });

    return () => { live = false; clearInterval(clock); };
  }, [lang, run, motion, visible]);

  // Off screen or under reduced motion, the call is simply finished — derived,
  // not stored. While playing, a state written by an earlier playback (another
  // language, a replay, a previous pass on screen) is never shown: the new
  // one starts empty from its first frame.
  const playing = motion && visible;
  const view = !playing ? finished(lang) : state.key === `${lang}:${run}` ? state : EMPTY;
  const moved = view.monday === MONDAY_AFTER;
  const fill = (i: number) => String(view.filled > i);

  return (
    <figure ref={box} className="hm-call" aria-label={strings.label} data-live-call>
      <div className="hm-call-head">
        <span className="hm-live" data-ended={String(view.ended)}>
          <span className="hm-dot" aria-hidden="true" />
          {view.ended ? strings.ended : strings.live}
        </span>
        <div className="hm-call-who">
          <div className="hm-call-biz">{strings.business}</div>
          <div className="hm-call-meta">{strings.meta}</div>
        </div>
        <span className="hm-timer" aria-hidden="true">{formatClock(view.seconds)}</span>
      </div>

      <ol className="hm-transcript" lang={lang}>
        {view.lines.map((l) => (
          <li key={`${run}-${lang}-${l.id}`} className="hm-msg" data-who={l.who}>
            <span className="hm-spk">{l.who === 'sofia' ? 'Sofía' : strings.caller}</span>
            <span className="hm-txt">
              {l.text}
              {l.typing ? <span className="hm-caret" aria-hidden="true" /> : null}
            </span>
          </li>
        ))}
      </ol>

      <div className="hm-crm" data-on={String(view.crmOn)}>
        <p className="hm-crm-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
          {strings.crmTitle}
        </p>
        <dl>
          <dt>{strings.crmContact}</dt><dd data-on={fill(0)}>{SAMPLE_CONTACT}</dd>
          <dt>{strings.crmNeed}</dt><dd data-on={fill(1)}>{strings.need}</dd>
          <dt>{strings.crmLang}</dt><dd data-on={fill(2)}>{lang === 'es' ? strings.langEs : strings.langEn}</dd>
          <dt>{strings.crmOutcome}</dt>
          <dd data-on={fill(3)}><span className="hm-chip"><i aria-hidden="true" />{strings.crmBooked}</span></dd>
        </dl>
      </div>

      <div className="hm-monday">
        <span className="hm-k">{strings.mondayK}</span>
        <span><span className="hm-n">{view.monday}</span> {strings.mondayCalls}</span>
        {moved ? <span>{strings.mondayDelta}</span> : null}
      </div>

      <figcaption className="hm-call-foot">
        <span className="hm-call-note">{strings.note}</span>
        <div className="hm-seg" role="group" aria-label={strings.langLabel}>
          {(['es', 'en'] as const).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => { setLang(l); setRun((r) => r + 1); }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        {/* Under reduced motion the call is always shown finished, so there
            is nothing to replay. */}
        {motion ? (
          <button type="button" className="hm-btn hm-btn-ghost hm-btn-sm" onClick={() => setRun((r) => r + 1)}>
            {strings.replay}
          </button>
        ) : null}
      </figcaption>
    </figure>
  );
}
