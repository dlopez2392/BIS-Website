'use client';
import type { CSSProperties } from 'react';
import { useEffect, useRef } from 'react';
import { Languages, UserRound, Zap } from 'lucide-react';
import { Link } from '@/i18n/navigation';

// Self-hosted (public/hero), encoded twice: VP9 WebM (~3 MB) for browsers
// that decode it and H.264 MP4 (~5 MB, fast-start) for the rest. The site
// never depends on a third-party CDN for its first paint, and the file only
// leaves the server for visitors who will see it: the effect below sets `src`
// at runtime for wide viewports that have not asked for reduced motion or
// data saving. Phones get the gradient.
const VIDEO_SOURCES = [
  { src: '/hero/bis-hero.webm', type: 'video/webm; codecs="vp9"' },
  { src: '/hero/bis-hero.mp4', type: 'video/mp4; codecs="avc1.640029"' },
] as const;

/** First source the browser says it can probably play; MP4 when it will not say. */
export function pickVideoSource(video: Pick<HTMLVideoElement, 'canPlayType'>): string {
  const probable = VIDEO_SOURCES.find((s) => video.canPlayType(s.type) === 'probably');
  return (probable ?? VIDEO_SOURCES[VIDEO_SOURCES.length - 1]).src;
}

/** Per-element entrance delay (and optional duration), read by `.appear` in globals.css. */
function delay(d: string, dur?: string): CSSProperties {
  return { '--d': d, ...(dur ? { '--dur': dur } : {}) } as CSSProperties;
}

export function Hero({
  kicker, title, titleAccent, body, cta, cta2, stats,
}: {
  kicker: string;
  title: string;
  titleAccent: string;
  body: string;
  /** Secondary action: "See how we do it" → /services. */
  cta: string;
  /** Primary action: "Book a free assessment" → /contact. One primary per page. */
  cta2: string;
  /** Three true statements, shown as the hero's footer row. */
  stats: readonly [string, string, string];
}) {
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Entrance choreography. Each `.appear` element rests at opacity 1 so the
  // hero is never blank if animations fail; when its own animation ends it is
  // pinned with `.is-in`. If, two frames in, no animation is running at all
  // (an old browser, a test runner, a blocked stylesheet), everything is
  // pinned at once rather than left waiting for an event that will not come.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>('.appear'));
    const pin = (el: HTMLElement) => el.classList.add('is-in');
    const handlers = items.map((el) => {
      const onEnd = () => pin(el);
      el.addEventListener('animationend', onEnd, { once: true });
      return () => el.removeEventListener('animationend', onEnd);
    });
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const running = items.some((el) =>
          typeof el.getAnimations === 'function'
          && el.getAnimations().some((a) => a.playState === 'running' || a.playState === 'finished'));
        if (!running) items.forEach(pin);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      handlers.forEach((off) => off());
    };
  }, []);

  // The backdrop video, loaded only where it earns its weight.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof window.matchMedia !== 'function') return;
    const wide = window.matchMedia('(min-width: 901px)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

    const apply = () => {
      const want = wide.matches && !reduce.matches && !saveData;
      if (want && !video.getAttribute('src')) {
        video.setAttribute('src', pickVideoSource(video));
        const p = video.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } else if (!want && video.getAttribute('src')) {
        video.pause();
        video.removeAttribute('src');
        video.load();
        video.classList.remove('is-in');
      }
    };
    const onLoaded = () => video.classList.add('is-in');
    video.addEventListener('loadeddata', onLoaded);
    apply();
    wide.addEventListener?.('change', apply);
    reduce.addEventListener?.('change', apply);
    return () => {
      video.removeEventListener('loadeddata', onLoaded);
      wide.removeEventListener?.('change', apply);
      reduce.removeEventListener?.('change', apply);
    };
  }, []);

  return (
    <section ref={rootRef} className="hero" aria-labelledby="hero-title">
      <div className="hero-photo" aria-hidden="true">
        <video ref={videoRef} muted loop playsInline autoPlay preload="none" tabIndex={-1} />
        <div className="hero-tint" />
      </div>
      <div className="hero-grain" aria-hidden="true" />

      <div className="hero-copy">
        <p className="badge appear appear--pop" style={delay('0.22s')}>
          <svg className="badge-star" viewBox="0 0 24 24" width="18" height="20" fill="#ffffff" aria-hidden="true">
            <path d="M12 2.6C12.55 2.6 12.88 3.15 13.08 4.7c.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z" />
          </svg>
          {kicker}
        </p>

        <h1 id="hero-title" className="hero-h1">
          <span className="headline-line"><span className="appear appear--mask" style={delay('0.42s')}>{title}</span></span>
          {' '}
          <span className="headline-line"><span className="appear appear--mask" style={delay('0.62s')}><em className="hero-grad">{titleAccent}</em></span></span>
        </h1>

        <p className="lede appear appear--soft" style={delay('0.82s', '1.25s')}>{body}</p>

        <div className="hero-actions">
          <Link href="/contact" className="btn btn-solid appear appear--btn" style={delay('0.96s')}>{cta2}</Link>
          <Link href="/services" className="btn btn-ghost appear appear--side" style={delay('1.10s')}>{cta}</Link>
        </div>
      </div>

      <ul className="hero-stats">
        <li className="stat appear appear--stat" style={delay('1.12s')}><UserRound aria-hidden="true" />{stats[0]}</li>
        <li className="stat appear appear--stat" style={delay('1.28s')}><Languages aria-hidden="true" />{stats[1]}</li>
        <li className="stat appear appear--stat" style={delay('1.44s')}><Zap aria-hidden="true" />{stats[2]}</li>
      </ul>
    </section>
  );
}
