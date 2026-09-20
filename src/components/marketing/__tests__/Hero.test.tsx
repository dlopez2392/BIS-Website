import type React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { Hero, pickVideoSource } from '../Hero';
import { DWELL_MS } from '../HeroStage';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, ...p }: { children?: React.ReactNode } & Record<string, unknown>) => <a {...p}>{children}</a>,
}));

const STATS = ['One point of contact', 'Fully bilingual, EN/ES', 'AI that ships to production'] as const;

const STAGE = {
  copy: {
    dashboard: { label: 'Dashboard', alt: 'The dashboard for a sample company' },
    calls: { label: 'Calls', alt: 'The call log' },
    pipeline: { label: 'Opportunities', alt: 'The opportunity board' },
    spanish: { label: 'A call in Spanish', alt: 'A call detail screen in Spanish' },
  },
  note: 'Sample account — invented company and data.',
  tabsLabel: 'Choose a screen',
  pauseLabel: 'Pause',
  resumeLabel: 'Play',
} as const;

function renderHero(stage: typeof STAGE & { first?: 'dashboard' | 'calls' | 'pipeline' | 'spanish' } = STAGE) {
  return render(
    <Hero kicker="Kick" title="Let us Be your" titleAccent="Intelligent Solution."
      body="Body copy" cta="See how we do it" cta2="Book a free assessment" stats={STATS} stage={stage} />,
  );
}

/** The frames after the first mount 600ms after `load`; jsdom is already loaded. */
function arm() {
  act(() => { vi.advanceTimersByTime(700); });
}

const litAlt = (container: HTMLElement) => container.querySelector('.stage-screens img.is-on')?.getAttribute('alt');

/**
 * jsdom has no matchMedia and no IntersectionObserver, and without both the
 * carousel effect returns before the timer exists — which is exactly why the
 * first version of these tests passed while the timer had a real bug in it.
 * These stubs give the effect a browser to run in and hand back the knobs.
 */
function browser({ reduce = false } = {}) {
  const mql = (query: string) => ({
    matches: query.includes('reduced-motion') ? reduce : false,
    media: query, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  });
  vi.stubGlobal('matchMedia', vi.fn(mql));
  let intersect: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
  const disconnect = vi.fn();
  // A plain function, not an arrow: the component calls it with `new`.
  vi.stubGlobal('IntersectionObserver', function FakeIO(cb: typeof intersect) {
    intersect = cb;
    return { observe: vi.fn(), disconnect, unobserve: vi.fn() };
  });
  return { setOnScreen: (on: boolean) => act(() => { intersect?.([{ isIntersecting: on }]); }), disconnect };
}

describe('Hero', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('renders the full headline as ONE accessible name across its two masked lines, both CTAs, and the three stats', () => {
    renderHero();
    // The two lines are separate blocks; without the explicit space between
    // them the name would read "Be yourIntelligent" and the e2e regex breaks.
    expect(screen.getByRole('heading', { level: 1, name: /Let us Be your Intelligent Solution\./i })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Book a free assessment' }).getAttribute('href')).toBe('/contact');
    expect(screen.getByRole('link', { name: 'See how we do it' }).getAttribute('href')).toBe('/services');
    for (const s of STATS) expect(screen.getByText(s)).toBeTruthy();
  });

  it('keeps the backdrop decorative and never fetches the video in a narrow or non-animating environment', () => {
    const { container } = renderHero();
    const photo = container.querySelector('.hero-photo');
    expect(photo?.getAttribute('aria-hidden')).toBe('true');
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    // jsdom's matchMedia mock reports no match, so the 9 MB file must not be requested.
    expect(video?.getAttribute('src')).toBeNull();
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('pins every entrance element visible when no animation runs (the no-blank-hero guarantee)', async () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 1; });
    try {
      const { container } = renderHero();
      await act(async () => {});
      const items = Array.from(container.querySelectorAll('.appear'));
      expect(items.length).toBeGreaterThan(5);
      expect(items.every((el) => el.classList.contains('is-in'))).toBe(true);
    } finally {
      raf.mockRestore();
    }
  });

  it('serves VP9 WebM only to browsers that can probably decode it, H.264 MP4 otherwise', () => {
    const says = (answer: (type: string) => CanPlayTypeResult) => ({ canPlayType: answer });
    expect(pickVideoSource(says((t) => (t.startsWith('video/webm') ? 'probably' : 'maybe')))).toBe('/hero/bis-hero.1.webm');
    expect(pickVideoSource(says((t) => (t.startsWith('video/mp4') ? 'probably' : '')))).toBe('/hero/bis-hero.1.mp4');
    expect(pickVideoSource(says(() => ''))).toBe('/hero/bis-hero.1.mp4');
  });

  describe('the product stage', () => {
    it('mounts only the first frame until the page has loaded, then all four, with exactly one lit', () => {
      const { container } = renderHero();
      // Frame 0 alone at first: the other three cost 137 KB on a retina
      // laptop and nobody sees them for 3.8s.
      expect(container.querySelectorAll('.stage-screens img')).toHaveLength(1);
      arm();
      const shots = Array.from(container.querySelectorAll('.stage-screens img'));
      expect(shots).toHaveLength(4);
      // One `.is-on` and three not: the cross-fade is opacity-driven, so a
      // second lit frame would stack two screenshots rather than fail loudly.
      expect(shots.filter((el) => el.classList.contains('is-on'))).toHaveLength(1);
      expect(shots.filter((el) => el.getAttribute('aria-hidden') === 'true')).toHaveLength(3);
      // Four different captures, four different descriptions.
      expect(new Set(shots.map((el) => el.getAttribute('alt'))).size).toBe(4);
      for (const label of ['Dashboard', 'Calls', 'Opportunities', 'A call in Spanish', 'Pause']) {
        expect(screen.getByRole('button', { name: label })).toBeTruthy();
      }
      expect(screen.getByText(STAGE.note)).toBeTruthy();
    });

    it('opens the loop on the screen the page asks for, keeping the rest in order', () => {
      const { container } = renderHero({ ...STAGE, first: 'spanish' });
      arm();
      const alts = Array.from(container.querySelectorAll('.stage-screens img')).map((el) => el.getAttribute('alt'));
      // /es leads with the one capture that is in Spanish; the others follow
      // in their original order, so the loop is a rotation, not a reshuffle.
      expect(alts).toEqual([
        STAGE.copy.spanish.alt, STAGE.copy.dashboard.alt, STAGE.copy.calls.alt, STAGE.copy.pipeline.alt,
      ]);
      expect(litAlt(container)).toBe(STAGE.copy.spanish.alt);
    });

    it('advances after each dwell and wraps at the end', () => {
      browser();
      const { container } = renderHero();
      arm();
      expect(litAlt(container)).toBe(STAGE.copy.dashboard.alt);
      for (const alt of [STAGE.copy.calls.alt, STAGE.copy.pipeline.alt, STAGE.copy.spanish.alt, STAGE.copy.dashboard.alt]) {
        act(() => { vi.advanceTimersByTime(DWELL_MS); });
        expect(litAlt(container)).toBe(alt);
      }
    });

    it('stops permanently on a bare click, with no pointer or focus event to lean on', () => {
      browser();
      const { container } = renderHero();
      arm();
      // `fireEvent.click` is a bare click — what `HTMLElement.click()`, voice
      // control and some AT activation paths produce. The first version only
      // stopped because pointerenter happened to fire first.
      fireEvent.click(screen.getByRole('button', { name: 'Opportunities' }));
      expect(litAlt(container)).toBe(STAGE.copy.pipeline.alt);
      expect(screen.getByRole('button', { name: 'Opportunities' }).getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByRole('button', { name: 'Dashboard' }).getAttribute('aria-pressed')).toBe('false');
      act(() => { vi.advanceTimersByTime(DWELL_MS * 4); });
      expect(litAlt(container)).toBe(STAGE.copy.pipeline.alt);
      // The choice is announced; an auto-advance never is.
      expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('Opportunities');
    });

    it('never starts the timer under prefers-reduced-motion', () => {
      browser({ reduce: true });
      const setInterval = vi.spyOn(globalThis, 'setInterval');
      const { container } = renderHero();
      arm();
      act(() => { vi.advanceTimersByTime(DWELL_MS * 3); });
      expect(litAlt(container)).toBe(STAGE.copy.dashboard.alt);
      expect(setInterval).not.toHaveBeenCalled();
    });

    it('pauses on the button, resumes on it again, and rests while a pointer is on it or it is off screen', () => {
      const { setOnScreen } = browser();
      const { container } = renderHero();
      arm();
      fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
      expect(screen.getByRole('button', { name: 'Play' }).getAttribute('aria-pressed')).toBe('true');
      act(() => { vi.advanceTimersByTime(DWELL_MS * 2); });
      expect(litAlt(container)).toBe(STAGE.copy.dashboard.alt);
      fireEvent.click(screen.getByRole('button', { name: 'Play' }));
      act(() => { vi.advanceTimersByTime(DWELL_MS); });
      expect(litAlt(container)).toBe(STAGE.copy.calls.alt);

      const root = container.querySelector('[data-hero-stage]')!;
      fireEvent.pointerEnter(root);
      act(() => { vi.advanceTimersByTime(DWELL_MS * 2); });
      expect(litAlt(container)).toBe(STAGE.copy.calls.alt);
      fireEvent.pointerLeave(root);
      act(() => { vi.advanceTimersByTime(DWELL_MS); });
      expect(litAlt(container)).toBe(STAGE.copy.pipeline.alt);

      setOnScreen(false);
      act(() => { vi.advanceTimersByTime(DWELL_MS * 2); });
      expect(litAlt(container)).toBe(STAGE.copy.pipeline.alt);
      setOnScreen(true);
      act(() => { vi.advanceTimersByTime(DWELL_MS); });
      expect(litAlt(container)).toBe(STAGE.copy.spanish.alt);
    });

    it('clears its interval and observer on unmount', () => {
      const { disconnect } = browser();
      const clearInterval = vi.spyOn(globalThis, 'clearInterval');
      const { unmount } = renderHero();
      arm();
      unmount();
      expect(clearInterval).toHaveBeenCalled();
      expect(disconnect).toHaveBeenCalledTimes(1);
    });
  });
});
