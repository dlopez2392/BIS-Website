import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { WORDMARK } from '@/lib/brand';
import { artSlots, hasArt } from '@/lib/art';

/**
 * The share card — what a link to any page looks like on WhatsApp, Facebook,
 * iMessage and LinkedIn, which in this market is how a page most often
 * arrives. It used to be a white card in a fallback sans: the 800 weight it
 * asked for was never registered, so the headline rendered regular, and the
 * company name was printed twice while the strap said nothing useful.
 *
 * It is now the site's ground with Hanken Grotesk registered from the two
 * TTFs beside this file, the title live (never baked: an /es page gets its
 * Spanish title), a strap that carries what a stranger can act on, and — once
 * `public/art/og-plate.1.jpg` exists — the Señal plate briefed for it, dark
 * down the left where the type sits. `locale` picks the strap's language.
 */
const FONTS = path.join(process.cwd(), 'src', 'app', 'og', 'fonts');
const STRAP = {
  en: 'Harlingen, Texas · (956) 506-1545 · in English y en español',
  es: 'Harlingen, Texas · (956) 506-1545 · en inglés y en español',
} as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('title') ?? 'Bespoke Intelligent Solutions';
  // A long insight title used to stop mid-word at 120 characters.
  const title = raw.length > 96 ? `${raw.slice(0, 95).trimEnd()}…` : raw;
  const locale = searchParams.get('locale') === 'es' ? 'es' : 'en';

  const [bold, semi] = await Promise.all([
    readFile(path.join(FONTS, 'HankenGrotesk-800.ttf')),
    readFile(path.join(FONTS, 'HankenGrotesk-600.ttf')),
  ]);
  const plate = hasArt('ogPlate')
    ? `data:image/jpeg;base64,${(await readFile(path.join(process.cwd(), 'public', 'art', artSlots.ogPlate.file))).toString('base64')}`
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative', height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: '72px 80px',
          background: '#0b0a18',
          backgroundImage: plate ? undefined : 'linear-gradient(118deg, #221247 0%, #0b0a18 46%, #08202a 100%)',
          fontFamily: 'Hanken Grotesk', color: '#ffffff',
        }}
      >
        {plate && (
          // eslint-disable-next-line @next/next/no-img-element -- satori, not the DOM
          <img src={plate} width={1200} height={630} alt="" style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover' }} />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #7c3aed 0%, #0e7490 100%)', borderRadius: 14,
            }}
          >
            <div style={{ width: 24, height: 24, borderRight: '7px solid #ffffff', borderTop: '7px solid #ffffff', transform: 'rotate(45deg)', marginLeft: -8 }} />
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>{WORDMARK}</div>
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2, maxWidth: 820 }}>{title}</div>
        <div style={{ fontSize: 26, fontWeight: 600, color: '#a78bfa' }}>{STRAP[locale]}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Hanken Grotesk', data: bold, weight: 800, style: 'normal' },
        { name: 'Hanken Grotesk', data: semi, weight: 600, style: 'normal' },
      ],
    },
  );
}
