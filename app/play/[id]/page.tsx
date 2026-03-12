import { kv } from '@vercel/kv';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PlayClient from './PlayClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getGame(id: string) {
  const raw = await kv.get(`game:${id}`) as string | null;
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(id);
  return {
    title: game ? `${game.title} | AI Game Factory` : 'Game Not Found',
    description: 'AI Game Factory에서 생성된 게임을 플레이해보세요!',
    openGraph: {
      title: game?.title || 'AI Game Factory',
      description: '프롬프트로 만든 HTML5 게임',
      type: 'website',
    },
  };
}

export default async function PlayPage({ params }: PageProps) {
  const { id } = await params;
  const game = await getGame(id);

  if (!game) {
    notFound();
  }

  return <PlayClient gameHtml={game.html} gameTitle={game.title} gameId={id} />;
}
