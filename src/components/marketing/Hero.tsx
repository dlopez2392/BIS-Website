'use client';
import { useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';

export function Hero({
  kicker, title, titleAccent, body, cta, cta2,
}: { kicker: string; title: string; titleAccent: string; body: string; cta: string; cta2: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf = 0, visible = true;
    let pts: { x: number; y: number; vx: number; vy: number }[] = [];
    const mouse = { x: -999, y: -999 };

    const size = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const seed = () => {
      const n = Math.min(70, Math.round((W * H) / 12000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      }));
    };
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        const dxm = p.x - mouse.x, dym = p.y - mouse.y, dm = Math.hypot(dxm, dym);
        if (dm < 110) { p.x += (dxm / dm) * 1.1; p.y += (dym / dm) * 1.1; }
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.7, 0, Math.PI * 2); ctx.fillStyle = '#a78bfa'; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(139,92,246,${(1 - d / 130) * 0.5})`; ctx.lineWidth = 0.8; ctx.stroke();
        }
      }
      if (!reduce && visible) raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf && !reduce) raf = requestAnimationFrame(frame); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const onMove = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const onLeave = () => { mouse.x = -999; mouse.y = -999; };
    const onResize = () => { size(); seed(); };

    size(); seed();
    if (reduce) frame(); else start();
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', onResize);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); else stop(); });
    io.observe(canvas);

    return () => {
      stop(); io.disconnect();
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <section className="hero-anim relative flex min-h-[560px] items-center overflow-hidden">
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div className="hero-vign pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <p className="hero-rise hero-d1 text-xs font-bold uppercase tracking-[0.2em] text-accent">{kicker}</p>
        <h1 className="hero-rise hero-d2 mt-4 max-w-3xl text-5xl font-extrabold tracking-tight text-ink">
          {title} <span className="hero-grad">{titleAccent}</span>
        </h1>
        <p className="hero-rise hero-d3 mt-5 max-w-xl text-lg text-ink-muted">{body}</p>
        <div className="hero-rise hero-d4 mt-7 flex flex-wrap items-center gap-4">
          <Link href="/services" className="rounded-lg bg-primary px-6 py-3 font-bold text-on-primary shadow-[0_8px_30px_-8px_var(--color-primary)]">{cta} →</Link>
          <Link href="/contact" className="rounded-lg border border-hairline px-5 py-3 font-semibold text-ink-muted hover:text-ink">{cta2}</Link>
        </div>
      </div>
    </section>
  );
}
