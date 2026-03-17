'use client';

/**
 * PreviewOverlay — 앱 전체에 "Preview Build" 표시
 * 1) 상단 28px 띠 배너 (LIVE 펄스 도트 + 텍스트)
 * 2) 전체 화면 대각선 워터마크 (SVG 패턴, 극히 희미)
 * 3) 하단 정보 바
 */
export default function PreviewOverlay() {
  return (
    <>
      {/* ── Global keyframes ── */}
      <style jsx global>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
      `}</style>

      {/* ===== 1. 상단 띠 배너 ===== */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 28,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {/* LIVE 펄스 도트 */}
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#34C759',
            boxShadow: '0 0 6px rgba(52,199,89,0.6)',
            animation: 'livePulse 2s ease-in-out infinite',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: 2,
            textTransform: 'uppercase' as const,
            color: 'rgba(255,255,255,0.5)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          Preview Build&nbsp;&nbsp;·&nbsp;&nbsp;AI Game Factory
        </span>
      </div>

      {/* ===== 2. 전체 화면 대각선 워터마크 ===== */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          pointerEvents: 'none',
          overflow: 'hidden',
          /*
           * SVG 패턴: 45도 회전된 "PREVIEW" 텍스트
           * 200x80 타일로 반복, 극히 희미한 투명도 (0.03)
           */
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='80'%3E%3Ctext x='100' y='45' text-anchor='middle' font-family='-apple-system,BlinkMacSystemFont,SF Pro Text,Inter,sans-serif' font-size='14' font-weight='600' letter-spacing='8' fill='rgba(255,255,255,0.03)' transform='rotate(-35 100 40)'%3EPREVIEW%3C/text%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 80px',
        }}
      />

      {/* ===== 3. 하단 정보 바 ===== */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 6,
          paddingBottom: `max(6px, env(safe-area-inset-bottom))`,
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 400,
            letterSpacing: 1.5,
            color: 'rgba(255,255,255,0.3)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
          }}
        >
          예비창업패키지 심사용 · 비공개 프리뷰 · v0.9.1
        </span>
      </div>
    </>
  );
}
