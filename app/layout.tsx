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
  title: 'Claude 맛보기 — AI 체험 시뮬레이터',
  description:
    'Claude와 대화하는 방법을 직접 체험해보세요. AI 개념 설명, 코딩 체험, 이야기 만들기 등 다양한 시나리오를 경험할 수 있습니다.',
  keywords: [
    'Claude',
    'AI 체험',
    '시뮬레이터',
    'AI 교육',
    'Anthropic',
    '맛보기',
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
