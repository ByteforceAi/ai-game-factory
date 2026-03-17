import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'AI Game Factory — 바이브 코딩 시뮬레이터';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #050510 0%, #0A0A1F 40%, #121230 70%, #0A0A1F 100%)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Corner glow - top left */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,122,255,0.15) 0%, transparent 70%)',
          }}
        />
        {/* Corner glow - bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(175,82,222,0.12) 0%, transparent 70%)',
          }}
        />
        {/* Subtle grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Top badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 20px',
            borderRadius: 20,
            background: 'rgba(0,122,255,0.1)',
            border: '1px solid rgba(0,122,255,0.2)',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#34C759',
            }}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: 3,
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase' as const,
            }}
          >
            Preview Build
          </span>
        </div>

        {/* Main title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #FFFFFF 0%, #007AFF 50%, #AF52DE 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: -1,
            }}
          >
            AI Game Factory
          </span>
          <span
            style={{
              fontSize: 24,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: 1,
            }}
          >
            바이브 코딩 시뮬레이터
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: 32,
            padding: '12px 28px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span
            style={{
              fontSize: 18,
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 400,
            }}
          >
            AI가 실시간으로 게임을 만드는 체험
          </span>
        </div>

        {/* Bottom border glow line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '10%',
            right: '10%',
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(0,122,255,0.4), rgba(175,82,222,0.4), transparent)',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
