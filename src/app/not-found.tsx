import type { Metadata } from 'next';
import Link from 'next/link';

/**
 * Reached only by a URL outside the locale structure, so it renders its own
 * document and never sees the locale layout — which is why it needs its own
 * title. Without one it fails WCAG 2.4.2 (Level A), and it is the page a
 * mistyped link lands on, so it is the one most likely to be met cold.
 * Bilingual, because a visitor who lands here has not chosen a language yet.
 */
export const metadata: Metadata = {
  title: 'Page not found · Página no encontrada — Bespoke Intelligent Solutions',
  robots: { index: false, follow: true },
};

export default function RootNotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: '4rem 1.5rem', textAlign: 'center', background: '#faf9ff', color: '#171528' }}>
        <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Page not found</h1>
        <p lang="es" style={{ margin: '0.5rem 0 1.5rem', color: '#4a4763' }}>Página no encontrada</p>
        <Link href="/en" style={{ color: '#7c3aed' }}>Back home</Link>
        <span aria-hidden="true" style={{ color: '#4a4763' }}> · </span>
        <Link href="/es" lang="es" style={{ color: '#7c3aed' }}>Volver al inicio</Link>
      </body>
    </html>
  );
}
