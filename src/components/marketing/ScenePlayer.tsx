'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * The stage a ServiceScene plays on. Its only job beyond the markup is to stop
 * the loop while the scene is off screen, so three looping scenes on one page
 * cost nothing until the reader reaches them. Without JavaScript the scene
 * simply plays.
 */
export function ScenePlayer({ kind, band = false, children }: { kind: string; band?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { rootMargin: '120px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={band ? 'scene scene-band' : 'scene'} data-scene={kind} data-paused={onScreen ? undefined : ''} aria-hidden="true">
      {children}
    </div>
  );
}
