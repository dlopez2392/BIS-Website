import type { Metadata } from 'next';
import Link from 'next/link';
import { hankenGrotesk, instrumentSerif } from '@/lib/fonts';
import { artProps } from '@/lib/art';
import { WORDMARK } from '@/lib/brand';
import './globals.css';

/**
 * Reached only by a URL outside the locale structure, so it renders its own
 * document and never sees the locale layout — no header, no theme provider,
 * no translations. It used to be three lines of system-ui on a white page:
 * a mistyped link or a stale search result landed a prospect on something
 * that looked like a server error, and in dark mode it was a white flash.
 *
 * Now it is the site's ground (dark in both themes, so it needs no theme
 * provider), bilingual because the visitor has not chosen a language yet, and
 * it offers four real ways out in each language plus the phone. With the two
 * Señal plates on disk it is art-directed: the wide "signal frays and does not
 * reconnect" on a laptop, the tall one on a phone, where a 16:9 crop would
 * lose the fray entirely.
 *
 * Its own title, because without one it fails WCAG 2.4.2 (Level A).
 */
export const metadata: Metadata = {
  title: 'Page not found · Página no encontrada — Bespoke Intelligent Solutions',
  robots: { index: false, follow: true },
};

const WAYS = {
  en: [['/en', 'Home'], ['/en/platform', 'The platform'], ['/en/services', 'Services'], ['/en/contact', 'Contact']],
  es: [['/es', 'Inicio'], ['/es/platform', 'La plataforma'], ['/es/services', 'Servicios'], ['/es/contact', 'Contacto']],
} as const;

export default function RootNotFound() {
  const wide = artProps('notFoundWide');
  const tall = artProps('notFoundTall');
  return (
    <html lang="en" className={`${hankenGrotesk.variable} ${instrumentSerif.variable}`}>
      <body className="ground m-0 min-h-screen font-sans" style={{ fontFamily: 'var(--font-hanken), system-ui, sans-serif' }}>
        {wide && (
          <picture>
            {tall && <source media="(max-width: 700px)" srcSet={tall.src} />}
            <img src={wide.src} width={wide.width} height={wide.height} alt="" aria-hidden="true" className="ground-art" />
          </picture>
        )}
        <div className="ground-veil" aria-hidden="true" />
        <header className="relative mx-auto flex max-w-5xl items-center px-6 py-5">
          <Link href="/en" className="ground-text text-lg font-bold no-underline">{WORDMARK}</Link>
        </header>
        <main className="relative mx-auto max-w-3xl px-6 pb-24 pt-16 text-center">
          <p className="ground-accent text-xs font-bold uppercase tracking-widest">404</p>
          <h1 className="ground-text mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Page not found</h1>
          <p lang="es" className="ground-muted mt-3 text-2xl" style={{ fontFamily: 'var(--font-instrument), Georgia, serif', fontStyle: 'italic' }}>
            Página no encontrada
          </p>
          <p className="ground-muted mx-auto mt-6 max-w-md">
            The signal stops here, but the rest of the site is one tap away.
            {' '}
            <span lang="es">La señal termina aquí; el resto del sitio está a un toque.</span>
          </p>
          <div className="mx-auto mt-10 grid max-w-md gap-8 text-left sm:grid-cols-2">
            {(['en', 'es'] as const).map((lang) => (
              <nav key={lang} lang={lang} aria-label={lang === 'en' ? 'English' : 'Español'}>
                <p className="ground-accent text-xs font-bold uppercase tracking-widest">{lang === 'en' ? 'English' : 'Español'}</p>
                <ul className="mt-3 space-y-2">
                  {WAYS[lang].map(([href, label]) => (
                    <li key={href}><Link href={href} className="ground-link">{label}</Link></li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
          <p className="ground-muted mt-10 text-sm">
            <a href="tel:+19565061545" className="ground-link">(956) 506-1545</a>
          </p>
        </main>
      </body>
    </html>
  );
}
