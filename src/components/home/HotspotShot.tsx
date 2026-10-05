'use client';
import Image from 'next/image';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface Spot {
  /** Where the marker sits, as percentages of the capture. */
  left: number;
  top: number;
  title: string;
  body: string;
  /** The marker's accessible name, e.g. "Explain point 1". */
  label: string;
}

/**
 * The real dashboard capture with three numbered markers on it. A marker
 * opens a short note pinned beside it, so the screenshot explains itself
 * without a paragraph per feature beside it.
 *
 * One note at a time; Esc, a second tap on the same marker, or a tap anywhere
 * else closes it. The note is placed by measuring, not by CSS alone, because a
 * marker near the right or top edge has to flip its note inward.
 */
export function HotspotShot({ src, width, height, alt, spots, caption }: {
  src: string; width: number; height: number; alt: string; spots: readonly Spot[]; caption: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const markers = useRef<Array<HTMLButtonElement | null>>([]);

  const place = useCallback(() => {
    if (open === null || !frame.current || !pop.current) return;
    const marker = markers.current[open];
    if (!marker) return;
    const fr = frame.current.getBoundingClientRect();
    const sp = marker.getBoundingClientRect();
    const pw = pop.current.offsetWidth, ph = pop.current.offsetHeight;
    let left = sp.left - fr.left + 22, top = sp.top - fr.top - ph - 10;
    if (left + pw > fr.width) left = sp.left - fr.left - pw + 8;
    if (left < 8) left = 8;
    if (top < 8) top = sp.top - fr.top + 34;
    setPos({ left, top });
  }, [open]);

  useLayoutEffect(() => { place(); }, [place]);

  useEffect(() => {
    if (open === null) return;
    const close = () => setOpen(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      markers.current[open]?.focus();
      close();
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (pop.current?.contains(t) || markers.current.some((m) => m?.contains(t))) return;
      close();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  const current = open === null ? null : spots[open];

  return (
    <div data-hotspot-shot>
      <div ref={frame} className="hm-frame">
        <Image src={src} width={width} height={height} alt={alt} sizes="(min-width: 1200px) 1120px, 100vw" />
        {spots.map((s, i) => (
          <button
            key={i}
            ref={(el) => { markers.current[i] = el; }}
            type="button"
            className="hm-spot"
            style={{ left: `${s.left}%`, top: `${s.top}%` }}
            aria-expanded={open === i}
            aria-controls="hm-spot-note"
            aria-label={s.label}
            onClick={() => { setPos(null); setOpen(open === i ? null : i); }}
          >
            {i + 1}
          </button>
        ))}
        <div
          ref={pop}
          id="hm-spot-note"
          className="hm-pop"
          role="note"
          hidden={!current}
          style={pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden' }}
          aria-live="polite"
        >
          {current ? <><strong>{current.title}</strong>{current.body}</> : null}
        </div>
      </div>
      <p className="hm-caption">{caption}</p>
    </div>
  );
}
