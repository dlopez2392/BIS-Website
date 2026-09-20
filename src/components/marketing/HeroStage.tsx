'use client';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * The product, in the hero, moving.
 *
 * The site's first screen used to be an aurora and a sentence. A visitor had
 * to read three sections before learning that BIS writes its own CRM. This is
 * that claim made in the place claims are cheapest to disbelieve — with the
 * software on screen, navigating itself.
 *
 * WHY OUR OWN WINDOW CHROME. Each frame is a real capture of app.bis-rgv.com,
 * cropped below the app's own topbar (see the crop in the commit): the topbar
 * carries the agency-side account switcher, which reads "No organization
 * selected" when an agency operator is viewing a client. True, and meaningless
 * to a visitor. Our chrome bar puts the product's address there instead, which
 * is the one thing about that strip worth saying.
 *
 * THE CAPTURES ARE OF AN INVENTED COMPANY. Same rule as `PlatformProof` and
 * the /platform tour: the caption says so, every time, unprompted. A hero that
 * implies a real client's board is a fabricated case study.
 *
 * MOTION. The frames advance on their own because a still screenshot in a hero
 * reads as a stock image, and because the argument here is that this is a
 * system with sections, not one screen. It stops for: a reduced-motion
 * preference, a hidden tab, a hero scrolled out of view, a pointer or focus
 * resting on it, the pause button, and — permanently — a visitor who picks a
 * tab, because taking control and then being overridden four seconds later is
 * the worst of both. The pause button exists because WCAG 2.2.2 asks for a
 * control, and because on a 375px phone the tabs sit below the fold while the
 * window above it is already cycling.
 *
 * Tabs are buttons with `aria-pressed`, not a tablist: a real tablist obliges
 * roving tabindex and arrow keys and would turn the auto-advance into a
 * focus-moving tab change, which is its own 2.2.2 problem. Measured in the
 * Chromium AX tree, `aria-current` exposed nothing; `aria-pressed` does.
 */
const STAGE_FRAMES = [
  { id: 'dashboard', file: '/hero/stage/stage-dashboard.1.webp' },
  { id: 'calls', file: '/hero/stage/stage-calls.1.webp' },
  { id: 'pipeline', file: '/hero/stage/stage-pipeline.1.webp' },
  { id: 'spanish', file: '/hero/stage/stage-spanish.1.webp' },
] as const;

export type StageId = (typeof STAGE_FRAMES)[number]['id'];

/** Intrinsic size of every frame, so `next/image` reserves the box exactly. */
const FRAME_W = 1600;
const FRAME_H = 933;
export const DWELL_MS = 3800;

export function HeroStage({
  copy, note, tabsLabel, pauseLabel, resumeLabel, first = 'dashboard',
}: {
  /** Tab label + alt text per frame, from the `platform` namespace. */
  copy: Readonly<Record<StageId, { label: string; alt: string }>>;
  /** "Sample account — invented company and data." Load-bearing; see above. */
  note: string;
  tabsLabel: string;
  pauseLabel: string;
  resumeLabel: string;
  /**
   * Which screen opens the loop. Three of the four captures are of the
   * product in English; on /es the loop opens on the one that is not, so a
   * Spanish-speaking visitor's first sight of the software is in their
   * language rather than four seconds away. The order after it is unchanged.
   */
  first?: StageId;
}) {
  const frames = useMemo(() => {
    const start = Math.max(0, STAGE_FRAMES.findIndex((f) => f.id === first));
    return [...STAGE_FRAMES.slice(start), ...STAGE_FRAMES.slice(0, start)];
  }, [first]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  // The label of the screen a visitor CHOSE, for the live region. State, not
  // the `takenOver` ref, because a ref read during render is stale by design.
  const [chosen, setChosen] = useState<string | null>(null);
  // The three frames after the first are not in the DOM until the page has
  // loaded: `loading="lazy"` was a no-op (Chromium's threshold is well past a
  // hero), and on a retina laptop they cost 137 KB in the first 200ms for
  // screens nobody sees until t=3.8s. The box is reserved by `aspect-ratio`,
  // so adding them later shifts nothing.
  const [armed, setArmed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // Set once a visitor picks a tab, and never cleared: their choice outranks
  // the carousel for the rest of the visit.
  const takenOver = useRef(false);
  const pausedRef = useRef(false);
  // The timer lives in a []-dep effect; anything that changes what it should
  // be doing calls this so the interval is re-evaluated NOW, not on the next
  // incidental pointer event.
  const syncRef = useRef<() => void>(() => {});

  const pick = useCallback((i: number) => {
    takenOver.current = true;
    setActive(i);
    setChosen(copy[frames[i].id].label);
    syncRef.current();
  }, [copy, frames]);

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    syncRef.current();
  }, []);

  useEffect(() => {
    const go = () => setArmed(true);
    if (document.readyState === 'complete') {
      const t = setTimeout(go, 600);
      return () => clearTimeout(t);
    }
    window.addEventListener('load', go, { once: true });
    return () => window.removeEventListener('load', go);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window.matchMedia !== 'function') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const count = frames.length;

    let timer: ReturnType<typeof setInterval> | undefined;
    let onScreen = true;
    let resting = false;

    const stop = () => {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    };
    const sync = () => {
      const want = !takenOver.current && !pausedRef.current && !reduce.matches
        && onScreen && !resting && !document.hidden;
      if (want && timer === undefined) {
        timer = setInterval(() => {
          // Belt and braces: even if a caller forgets to sync, a taken-over
          // stage never advances again.
          if (takenOver.current) { stop(); return; }
          setActive((i) => (i + 1) % count);
        }, DWELL_MS);
      } else if (!want) {
        stop();
      }
    };
    syncRef.current = sync;

    // Moving focus between two tabs fires focusout then focusin; without the
    // relatedTarget check each hop destroyed and recreated the interval and
    // silently restarted the dwell.
    const rest = (on: boolean) => (e: Event) => {
      const related = (e as FocusEvent).relatedTarget;
      if (related instanceof Node && root.contains(related)) return;
      resting = on;
      sync();
    };
    const onEnter = rest(true);
    const onLeave = rest(false);
    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('focusin', onEnter);
    root.addEventListener('focusout', onLeave);
    document.addEventListener('visibilitychange', sync);
    reduce.addEventListener?.('change', sync);

    // A hero below the fold on a short window still animates without this.
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === 'function') {
      io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }, { threshold: 0.15 });
      io.observe(root);
    }
    sync();

    return () => {
      stop();
      syncRef.current = () => {};
      io?.disconnect();
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('focusin', onEnter);
      root.removeEventListener('focusout', onLeave);
      document.removeEventListener('visibilitychange', sync);
      reduce.removeEventListener?.('change', sync);
    };
  }, [frames.length]);

  return (
    <div ref={rootRef} className="hero-stage" data-hero-stage>
      <div className="stage-frame">
        <div className="stage-chrome" aria-hidden="true">
          <span className="stage-dot" /><span className="stage-dot" /><span className="stage-dot" />
          <span className="stage-url">app.bis-rgv.com</span>
        </div>
        <div className="stage-screens" id="hero-stage-screens">
          {frames.map((frame, i) => (i === 0 || armed) && (
            <Image
              key={frame.id}
              src={frame.file}
              alt={copy[frame.id].alt}
              width={FRAME_W}
              height={FRAME_H}
              /* The first frame is above the fold on every viewport that shows
                 the stage and is the LCP element wherever the backdrop video
                 is gated off, so it is the one image on the page worth
                 preloading. */
              priority={i === 0}
              sizes="(min-width: 1180px) and (max-height: 760px) 620px, (min-width: 1180px) 52vw, (min-width: 1000px) and (max-height: 800px) 48vw, 92vw"
              className={i === active ? 'is-on' : undefined}
              aria-hidden={i === active ? undefined : 'true'}
            />
          ))}
        </div>
      </div>

      <div className="stage-foot">
        {/* `role="list"` is not redundant: `list-style: none` makes WebKit drop
            the list role, and the group's name with it. */}
        <ul className="stage-tabs" role="list" aria-label={tabsLabel}>
          {frames.map((frame, i) => (
            <li key={frame.id}>
              <button
                type="button"
                className={i === active ? 'stage-tab is-on' : 'stage-tab'}
                aria-pressed={i === active}
                aria-controls="hero-stage-screens"
                onClick={() => pick(i)}
              >
                {copy[frame.id].label}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="stage-tab stage-pause"
              aria-pressed={paused}
              onClick={togglePause}
            >
              {paused ? resumeLabel : pauseLabel}
            </button>
          </li>
        </ul>
        {/* Announces the screen a visitor CHOSE. It can never fire on an
            auto-advance, because a click sets `takenOver` first, and the live
            region only carries the label after that. */}
        <p className="sr-only" aria-live="polite">{chosen ?? ''}</p>
        <p className="stage-note">{note}</p>
      </div>
    </div>
  );
}
