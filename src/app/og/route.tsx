import { ImageResponse } from 'next/og';

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') ?? 'Bespoke Intelligent Solutions').slice(0, 120);
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', background: '#faf9ff', padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 800, color: '#171528' }}>bis&gt;</div>
        <div style={{ fontSize: 64, fontWeight: 800, color: '#171528', lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 30, color: '#7c3aed', fontWeight: 700 }}>
          Bespoke Intelligent Solutions · Rio Grande Valley
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
