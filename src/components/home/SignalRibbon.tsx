'use client';
import { useEffect, useRef } from 'react';

/**
 * One ribbon of light behind the home page, in the two brand colours. It is
 * the page's only decoration, and it carries the section breaks the cards used
 * to: where the ribbon sits on screen follows how far down the page the reader
 * is, so each section is lit from a slightly different height.
 *
 * Cheap on purpose: ~30 frames a second, a device-pixel ratio capped at 1.5,
 * and nothing drawn while the tab is hidden. Under reduced motion it draws
 * one still frame and redraws only on scroll and resize — no drift.
 *
 * The colours come from `--sig-a`/`--sig-b`/`--sig-strength`, so the light
 * theme's dimmer ribbon is a token, not a branch here.
 */
export function SignalRibbon() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const root = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1, raf = 0, last = 0;

    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = cv.width = Math.floor(window.innerWidth * dpr);
      H = cv.height = Math.floor(window.innerHeight * dpr);
    };

    const draw = (time: number) => {
      const css = getComputedStyle(root);
      const a = css.getPropertyValue('--sig-a').trim();
      const b = css.getPropertyValue('--sig-b').trim();
      const k = parseFloat(css.getPropertyValue('--sig-strength')) || 1;
      ctx.clearRect(0, 0, W, H);
      const span = Math.max(1, root.scrollHeight - window.innerHeight);
      const sy = window.scrollY / span;
      const baseY = H * (0.26 + 0.5 * (0.5 - 0.5 * Math.cos(sy * Math.PI * 3)));
      ctx.globalCompositeOperation = root.classList.contains('dark') ? 'lighter' : 'source-over';
      const strands: Array<[number, number]> = [[64 * dpr, 0.05], [26 * dpr, 0.09], [9 * dpr, 0.16], [2.2 * dpr, 0.5]];
      for (let s = 0; s < 2; s++) {
        for (const [w, alpha] of strands) {
          ctx.beginPath();
          for (let x = -40; x <= W + 40; x += 18 * dpr) {
            const u = x / W;
            const y = baseY
              + Math.sin(u * 3.2 + time / 5200 + s * 1.7) * H * 0.11
              + Math.sin(u * 7.1 - time / 3900 + s) * H * 0.03
              + (s ? H * 0.06 : 0);
            if (x === -40) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          const strength = alpha * k * (s ? 0.55 : 1);
          const g = ctx.createLinearGradient(0, 0, W, 0);
          g.addColorStop(0, `rgba(${a}, 0)`);
          g.addColorStop(0.25, `rgba(${a}, ${strength})`);
          g.addColorStop(0.7, `rgba(${b}, ${strength})`);
          g.addColorStop(1, `rgba(${b}, 0)`);
          ctx.strokeStyle = g;
          ctx.lineWidth = w;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    const frame = (time: number) => {
      if (time - last > 33) { draw(time); last = time; }
      raf = requestAnimationFrame(frame);
    };
    const still = () => draw(0);

    size();
    const onResize = () => { size(); if (reduced) still(); };
    window.addEventListener('resize', onResize);
    // The theme toggle flips `.dark` on <html>; the colours and the blend
    // mode both follow it.
    const themeWatch = new MutationObserver(() => { if (reduced) still(); });
    themeWatch.observe(root, { attributes: true, attributeFilter: ['class'] });

    if (reduced) {
      still();
      window.addEventListener('scroll', still, { passive: true });
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', still);
      themeWatch.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="hm-signal" aria-hidden="true" />;
}
