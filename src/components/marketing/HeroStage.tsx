'use client';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

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
 * resting on it, and — permanently — a visitor who picks a tab, because taking
 * control and then being overridden four seconds later is the worst of both.
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
const DWELL_MS = 3800;

export function HeroStage({
  copy, note, tabsLabel,
}: {
  /** Tab label + alt text per frame, from the `platform` namespace. */
  copy: Readonly<Record<StageId, { label: string; alt: string }>>;
  /** "Sample account — invented company and data." Load-bearing; see above. */
  note: string;
  tabsLabel: string;
}) {
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  // Set once a visitor picks a tab, and never cleared: their choice outranks
  // the carousel for the rest of the visit.
  const takenOver = useRef(false);

  const pick = useCallback((i: number) => {
    takenOver.current = true;
    setActive(i);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window.matchMedia !== 'function') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    let timer: ReturnType<typeof setInterval> | undefined;
    let onScreen = true;
    let resting = false;

    const stop = () => {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    };
    const sync = () => {
      const want = !takenOver.current && !reduce.matches && onScreen && !resting
        && (typeof document === 'undefined' || !document.hidden);
      if (want && timer === undefined) {
        timer = setInterval(() => setActive((i) => (i + 1) % STAGE_FRAMES.length), DWELL_MS);
      } else if (!want) {
        stop();
      }
    };

    const rest = (on: boolean) => () => { resting = on; sync(); };
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
      io?.disconnect();
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('focusin', onEnter);
      root.removeEventListener('focusout', onLeave);
      document.removeEventListener('visibilitychange', sync);
      reduce.removeEventListener?.('change', sync);
    };
  }, []);

  return (
    <div ref={rootRef} className="hero-stage" data-hero-stage>
      <div className="stage-frame">
        <div className="stage-chrome" aria-hidden="true">
          <span className="stage-dot" /><span className="stage-dot" /><span className="stage-dot" />
          <span className="stage-url">app.bis-rgv.com</span>
        </div>
        <div className="stage-screens">
          {STAGE_FRAMES.map((frame, i) => (
            <Image
              key={frame.id}
              src={frame.file}
              alt={copy[frame.id].alt}
              width={FRAME_W}
              height={FRAME_H}
              /* The first frame is above the fold on every viewport that shows
                 the stage, so it is the one image on the page worth preloading;
                 the other three arrive while the visitor reads the headline. */
              priority={i === 0}
              loading={i === 0 ? undefined : 'lazy'}
              sizes="(min-width: 1100px) 52vw, 92vw"
              className={i === active ? 'is-on' : undefined}
              aria-hidden={i === active ? undefined : 'true'}
            />
          ))}
        </div>
      </div>

      <div className="stage-foot">
        <ul className="stage-tabs" aria-label={tabsLabel}>
          {STAGE_FRAMES.map((frame, i) => (
            <li key={frame.id}>
              <button
                type="button"
                className={i === active ? 'stage-tab is-on' : 'stage-tab'}
                aria-current={i === active ? 'true' : undefined}
                onClick={() => pick(i)}
              >
                {copy[frame.id].label}
              </button>
            </li>
          ))}
        </ul>
        <p className="stage-note">{note}</p>
      </div>
    </div>
  );
}
