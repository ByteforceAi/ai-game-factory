'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface GameItem {
  id: string;
  title: string;
  createdAt: number;
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export default function GalleryPage() {
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gallery')
      .then((res) => res.json())
      .then((data) => setGames(data.games || []))
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gradient tracking-tight">갤러리</h1>
          <p className="text-[13px] text-glass-text-secondary mt-1">커뮤니티가 만든 게임들</p>
        </div>
        <Link href="/" className="btn-glass text-[13px]">
          + 게임 만들기
        </Link>
      </div>

      {loading ? (
        <div className="liquid-glass p-16 text-center">
          <div className="relative z-10">
            <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-glass-accent/20 border-t-glass-accent animate-spin" />
            <p className="text-[14px] text-glass-text-secondary">로딩 중...</p>
          </div>
        </div>
      ) : games.length === 0 ? (
        <div className="liquid-glass p-16 text-center">
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-glass-accent/10 flex items-center justify-center text-3xl">
              🎮
            </div>
            <p className="text-[16px] font-semibold text-glass-text mb-2">
              아직 공유된 게임이 없습니다
            </p>
            <p className="text-[14px] text-glass-text-secondary mb-6">
              첫 번째 게임을 만들어보세요!
            </p>
            <Link href="/" className="btn-glass text-[14px]">
              게임 만들러 가기
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/play/${game.id}`}
              className="liquid-glass p-5 group cursor-pointer"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-[12px] bg-glass-accent/10 flex items-center justify-center text-lg">
                    🎮
                  </div>
                  <h3 className="text-[14px] font-semibold text-glass-text truncate group-hover:text-glass-accent transition-colors flex-1">
                    {game.title}
                  </h3>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-glass-text-muted">
                    {timeAgo(game.createdAt)}
                  </span>
                  <span className="text-[12px] text-glass-accent/60 group-hover:text-glass-accent transition-colors font-medium">
                    플레이 →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
