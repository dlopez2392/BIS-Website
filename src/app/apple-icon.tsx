import { ImageResponse } from 'next/og';

// iOS home-screen icon. Apple ignores SVG and does not round the corners for
// you, so this is a real 180x180 raster with the radius baked in.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
          borderRadius: 40,
        }}
      >
        {/* The chevron, drawn as two borders on a rotated square — Satori has no
            stroke-linecap, so a CSS shape is more predictable than an SVG path. */}
        <div
          style={{
            width: 62,
            height: 62,
            borderRight: '18px solid #ffffff',
            borderTop: '18px solid #ffffff',
            transform: 'rotate(45deg)',
            marginLeft: -22,
          }}
        />
      </div>
    ),
    size,
  );
}
