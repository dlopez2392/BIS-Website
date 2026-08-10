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
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 68,
              height: 68,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #7c3aed 0%, #0e7490 100%)',
              borderRadius: 15,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRight: '8px solid #ffffff',
                borderTop: '8px solid #ffffff',
                transform: 'rotate(45deg)',
                marginLeft: -9,
              }}
            />
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, color: '#171528' }}>bis&gt;</div>
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, color: '#171528', lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 30, color: '#7c3aed', fontWeight: 700 }}>
          Bespoke Intelligent Solutions · Rio Grande Valley
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
