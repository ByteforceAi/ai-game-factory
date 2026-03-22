import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2b2b2b',
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://ai-game-factory.vercel.app'
  ),
  title: '바이브코딩 아레나 — AI 코딩 플레이그라운드',
  description:
    '말로 설명하면 AI가 코드를 만들어줘요. 게임, 수학, 과학, 시뮬레이션을 직접 만들고 수정하는 바이브코딩 체험 플랫폼.',
  keywords: [
    '바이브코딩',
    'AI 코딩',
    '플레이그라운드',
    'AI 교육',
    'ByteForce',
    '아레나',
  ],
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: '100dvh',
          background: '#2b2b2b',
          color: '#ececec',
        }}
      >
        {children}
      </body>
    </html>
  );
}
