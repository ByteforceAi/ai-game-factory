import type { Metadata, Viewport } from 'next';
import './globals.css';
import NavBar from '@/components/layout/NavBar';
import PWARegister from '@/components/PWARegister';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#007AFF',
};

export const metadata: Metadata = {
  title: 'AI Game Factory | AI 기반 실시간 게임 생성 플랫폼',
  description: '자연어 프롬프트를 입력하면 생성형 AI가 실시간으로 플레이 가능한 HTML5 게임을 생성합니다. Claude AI 기반 코드 생성 기술 데모.',
  keywords: ['AI', '게임 생성', 'HTML5 게임', '코딩 교육', 'Claude AI', 'BYTEFORCE', '생성형 AI', 'vibe coding', '프롬프트 기반', '게임 개발', '스타트업'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AI게임',
  },
  openGraph: {
    title: 'AI Game Factory - 텍스트로 게임을 만드는 AI 기술',
    description: '프롬프트 한 줄로 HTML5 게임을 실시간 생성하는 AI 플랫폼',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-glass-bg text-glass-text min-h-screen relative">
        <PWARegister />
        {/* Ambient background — soft colored orbs for depth */}
        <div className="ambient-bg">
          <div className="ambient-orb w-[600px] h-[600px] bg-blue-300/40 top-[-15%] left-[-10%] animate-float" />
          <div className="ambient-orb w-[500px] h-[500px] bg-purple-300/25 bottom-[-15%] right-[-10%] animate-float" style={{ animationDelay: '3s' }} />
          <div className="ambient-orb w-[400px] h-[400px] bg-cyan-200/20 top-[35%] right-[10%] animate-float" style={{ animationDelay: '5s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          <NavBar />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
