import { ImageResponse } from 'next/og';

/**
 * A 512x512 raster of the mark, for the places that will not take an SVG:
 * Google Business Profile, LinkedIn, a printer, an invoice template.
 * Reachable at /brand/mark.png — the extension keeps it out of the i18n
 * middleware's catch-all, the way icon.svg and sitemap.xml already are.
 */
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #7c3aed 0%, #0e7490 100%)',
          borderRadius: 112,
        }}
      >
        <div
          style={{
            width: 176,
            height: 176,
            borderRight: '52px solid #ffffff',
            borderTop: '52px solid #ffffff',
            transform: 'rotate(45deg)',
            marginLeft: -62,
          }}
        />
      </div>
    ),
    { width: 512, height: 512 },
  );
}
