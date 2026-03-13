import type { Metadata, Viewport } from 'next';
import './globals.css';
import PWARegister from '@/components/PWARegister';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0d1117',
};

export const metadata: Metadata = {
  title: 'AI Game Factory — 게임 시뮬레이터',
  description: '게임을 선택하면 AI가 코드를 생성합니다. 이모지 햄버거, 3D 러너, 테트리스를 직접 만들어보세요!',
  keywords: ['AI', '게임 생성', 'HTML5 게임', '시뮬레이터', '게임 팩토리'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AI게임',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0, background: '#0d1117', minHeight: '100dvh' }}>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
