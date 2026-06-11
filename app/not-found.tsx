import Link from 'next/link';

// 공유 링크 만료(30일 TTL)·오타 URL에서 아이들이 만나는 화면 —
// 기본 영어 404 대신 브랜드 톤으로 다음 행동을 안내한다
export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: 'var(--bg-deep)',
        textAlign: 'center',
        padding: 24,
      }}
    >
      {/* 그린 커서 — 브랜드 시그니처 */}
      <div
        style={{
          width: 18,
          height: 26,
          borderRadius: 2,
          background: 'var(--accent-primary)',
          boxShadow: '0 0 20px rgba(34,197,94,0.35)',
          marginBottom: 8,
        }}
      />
      <h1
        style={{
          fontSize: '1.4rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em',
        }}
      >
        페이지를 찾을 수 없어요
      </h1>
      <p
        style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          maxWidth: 360,
        }}
      >
        주소가 바뀌었거나, 공유된 게임이 기간 만료(30일)로
        <br />
        정리되었을 수 있어요.
      </p>
      <Link
        href="/"
        style={{
          marginTop: 12,
          padding: '12px 28px',
          borderRadius: 10,
          background: 'var(--accent-primary)',
          color: '#0a0a0a',
          fontSize: '0.9rem',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        처음으로 돌아가기
      </Link>
      <div
        style={{
          marginTop: 24,
          fontSize: 10,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        vibe coding arena
      </div>
    </div>
  );
}
