import type { Metadata, Viewport } from 'next';
import './globals.css';
import PWARegister from '@/components/PWARegister';
import PreviewOverlay from '@/components/PreviewOverlay';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050510',
};

export const metadata: Metadata = {
  title: 'VIBE CODING SIMULATOR — AI Game Factory',
  description: 'AI가 실시간으로 게임을 만드는 바이브 코딩 시뮬레이터. 직접 체험해보세요!',
  keywords: ['AI', '바이브 코딩', 'HTML5 게임', '시뮬레이터', '게임 팩토리'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VIBE SIM',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body style={{
        margin: 0,
        padding: 0,
        minHeight: '100dvh',
        background: '#050510',
        color: '#e2e8f0',
      }}>
        <PWARegister />
        <PreviewOverlay />
        {children}
      </body>
    </html>
  );
}
