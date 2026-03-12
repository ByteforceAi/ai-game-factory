import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Game Factory | 프롬프트로 게임을 만드는 AI',
  description: '자연어로 게임 아이디어를 입력하면 AI가 즉시 플레이 가능한 HTML5 게임을 생성합니다.',
  keywords: ['AI', '게임 생성', 'HTML5 게임', '코딩 교육', 'Claude AI', 'BYTEFORCE'],
  openGraph: {
    title: 'AI Game Factory',
    description: '프롬프트 → 게임 생성 → 즉시 플레이',
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
      <body>{children}</body>
    </html>
  );
}
