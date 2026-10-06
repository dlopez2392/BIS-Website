'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { framePose, type Focus } from '@/lib/tour-pose';

export interface StoryFrame {
  /** The step this frame belongs to — the `data-tour-step` it follows. */
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  /** A few words naming what the zoom is showing, drawn on the frame. */
  label: string;
  focus: Focus;
  labelTop?: boolean;
}

const noSubscribe = () => () => {};

/**
 * The /platform tour told as one story: the steps scroll, the product does
 * not. On a wide screen a single frame stays pinned beside the words and,
 * as each step reaches the middle of the screen, swaps to that step's
 * capture and zooms to the part of it the words are about.
 *
 * What it deliberately is not:
 * - Not scroll-jacking. The page scrolls at the reader's speed; the frame
 *   only follows where they already are.
 * - Not a dependency. An IntersectionObserver picks the step and CSS
 *   transitions do the moving. (The browser's own scroll-driven animations
 *   were the first choice; Firefox does not ship them, and a story that
 *   silently stops for a fifth of visitors is worse than this.)
 * - Not required. The server renders every step with its own capture inline,
 *   which is the whole page on a phone and without JavaScript. Only once
 *   this has hydrated, on a screen wide enough, does `data-live` switch the
 *   layout over and the inline captures step aside for the frame.
 * - Not motion for its own sake. Under `prefers-reduced-motion` the frame
 *   still follows the story, but cuts instead of easing (globals.css).
 */
export function TourStory({ frames, caption, children }: {
  frames: StoryFrame[];
  caption: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const live = useSyncExternalStore(noSubscribe, () => true, () => false) && frames.length > 0;
  const [active, setActive] = useState(frames[0]?.id);

  useEffect(() => {
    const el = root.current;
    if (!el || !live) return;
    // A thin band across the middle of the viewport: whichever step crosses
    // it is the one being read. Steps without a capture still claim the band,
    // and the frame simply holds the last capture it had.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).dataset.tourStep;
          if (id && frames.some((f) => f.id === id)) setActive(id);
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    el.querySelectorAll<HTMLElement>('[data-tour-step]').forEach((step) => io.observe(step));
    return () => io.disconnect();
  }, [live, frames]);

  const index = Math.max(0, frames.findIndex((f) => f.id === active));

  return (
    <div ref={root} className="tour" data-tour data-live={live ? 'true' : undefined}>
      <div className="tour-steps">{children}</div>
      {live ? (
        <div className="tour-frame-col">
          <figure className="tour-frame m-0">
            <div className="tour-view">
              {frames.map((f, i) => {
                const on = i === index;
                return (
                  <div
                    key={f.id}
                    className="tour-layer"
                    data-active={on ? 'true' : undefined}
                    aria-hidden={on ? undefined : true}
                    style={on ? framePose(f.focus, f.width / f.height) : undefined}
                  >
                    {/* Sized for the ZOOMED width: the frame is ~40rem, and a
                        layer at 2x shows half the capture across all of it.
                        Sized for the frame alone, the browser fetched a file
                        the zoom then stretched, and the text went soft. */}
                    <Image
                      src={f.src} alt={f.alt} width={f.width} height={f.height}
                      sizes={`(min-width: 64rem) ${Math.ceil(40 * f.focus.scale)}rem, 1px`}
                    />
                  </div>
                );
              })}
              <p className="tour-label" data-top={frames[index]?.labelTop ? 'true' : undefined} aria-live="polite">
                <span className="tour-dot" aria-hidden="true" />
                {frames[index]?.label}
              </p>
              <p className="tour-count" aria-hidden="true">
                {index + 1} / {frames.length}
              </p>
            </div>
            <figcaption className="mt-2 text-xs text-ink-muted">{caption}</figcaption>
          </figure>
        </div>
      ) : null}
    </div>
  );
}
