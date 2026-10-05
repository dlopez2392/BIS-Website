'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { TalkToSofia } from '@/components/sofia/TalkToSofia';

/**
 * Sofía's section: an orb that moves with her ACTUAL voice, and the live
 * panel that lets a visitor talk to her.
 *
 * The orb idles with a slow breath until a session is live. Then TalkToSofia
 * hands over her incoming audio stream, an AnalyserNode reads its loudness,
 * and the orb's surface swells with what she is saying — not a loop that
 * plays whether or not she is talking. The analyser is never connected to the
 * speakers; the panel's own <audio> element is what plays her.
 *
 * Under reduced motion the orb draws once and stays still.
 */
export function SofiaSection({ heading, idle, talking, connected }: {
  heading: ReactNode; idle: string; talking: string; connected: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const level = useRef(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const onVoice = useCallback((s: MediaStream | null) => setStream(s), []);

  // Loudness of her voice, smoothed, into a ref the draw loop reads.
  useEffect(() => {
    level.current = 0;
    if (!stream) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ac = new Ctx();
    const analyser = ac.createAnalyser();
    analyser.fftSize = 512;
    ac.createMediaStreamSource(stream).connect(analyser);
    const buf = new Uint8Array(analyser.fftSize);
    // null, not false: the first reading always lands, so a new session
    // never inherits the last one's "speaking".
    let raf = 0, was: boolean | null = null;
    const tick = () => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) { const d = (v - 128) / 128; sum += d * d; }
      const rms = Math.sqrt(sum / buf.length);
      level.current = level.current * 0.8 + Math.min(1, rms * 4) * 0.2;
      const now = level.current > 0.04;
      if (now !== was) { was = now; setSpeaking(now); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); void ac.close(); };
  }, [stream]);

  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    let raf = 0, last = 0;
    const draw = (time: number) => {
      const css = getComputedStyle(root);
      const a = css.getPropertyValue('--sig-a').trim();
      const b = css.getPropertyValue('--sig-b').trim();
      const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2;
      ctx.clearRect(0, 0, W, H);
      const amp = 0.035 + level.current * 0.3;
      for (let layer = 0; layer < 3; layer++) {
        const base = W * (0.33 - layer * 0.05);
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const th = (i / 120) * Math.PI * 2;
          const n = Math.sin(th * 3 + time / (900 - layer * 150)) * 0.5
            + Math.sin(th * 5 - time / (700 + layer * 90)) * 0.3
            + Math.sin(th * 2 + time / 1300) * 0.2;
          const r = base * (1 + amp * n);
          const x = cx + Math.cos(th) * r, y = cy + Math.sin(th) * r;
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.closePath();
        const g = ctx.createRadialGradient(cx - base * 0.3, cy - base * 0.35, base * 0.1, cx, cy, base * 1.25);
        g.addColorStop(0, `rgba(${b}, ${0.55 - layer * 0.12})`);
        g.addColorStop(0.55, `rgba(${a}, ${0.55 - layer * 0.1})`);
        g.addColorStop(1, `rgba(${a}, 0)`);
        ctx.fillStyle = g;
        ctx.fill();
      }
    };
    if (reduced) {
      draw(0);
      const redraw = new MutationObserver(() => draw(0));
      redraw.observe(root, { attributes: true, attributeFilter: ['class'] });
      return () => redraw.disconnect();
    }
    // Only animate while the orb is on screen.
    let onScreen = false;
    const io = new IntersectionObserver(([en]) => {
      onScreen = en.isIntersecting;
      cancelAnimationFrame(raf);
      if (onScreen) raf = requestAnimationFrame(frame);
    });
    const frame = (time: number) => {
      if (time - last > 33) { draw(time); last = time; }
      if (onScreen) raf = requestAnimationFrame(frame);
    };
    draw(0);
    io.observe(cv);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);

  const label = !stream ? idle : speaking ? talking : connected;

  return (
    <div className="hm-wrap hm-sofia">
      <div className="hm-orb-box">
        <canvas ref={canvas} width={420} height={420} aria-hidden="true" />
        <span className="hm-orb-label" aria-hidden="true">{label}</span>
      </div>
      <div className="hm-stack">
        {heading}
        <TalkToSofia placement="home" bare onVoice={onVoice} />
      </div>
    </div>
  );
}
