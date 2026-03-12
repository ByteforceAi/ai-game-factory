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
    <div className="min-h-screen relative overflow-hidden">
      <header className="relative z-10 pt-8 pb-4 text-center">
        <Link href="/">
          <h1 className="font-orbitron text-xl md:text-2xl font-extrabold tracking-[6px] bg-gradient-to-r from-cyber-cyan via-cyber-text to-cyber-cyan bg-clip-text text-transparent">
            AI GAME FACTORY
          </h1>
        </Link>
        <p className="font-mono text-[11px] text-cyber-cyan/50 tracking-[4px] mt-2">
          COMMUNITY GALLERY
        </p>
      </header>

      <main className="relative z-10 max-w-[1000px] mx-auto px-4 md:px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="font-orbitron text-[13px] text-cyber-cyan tracking-[2px]">
              RECENT.GAMES
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-cyber-cyan/30 to-transparent ml-3 w-20" />
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-cyber-cyan/8 border border-cyber-cyan/20 rounded-lg text-cyber-cyan text-[11px] font-orbitron tracking-[2px] transition-all hover:bg-cyber-cyan/15"
          >
            + 게임 만들기
          </Link>
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center">
            <div className="w-10 h-10 mx-auto mb-4 rounded-full border-[3px] border-cyber-cyan/10 border-t-cyber-cyan animate-spin" />
            <p className="font-mono text-sm text-cyber-text/40">로딩 중...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="font-orbitron text-lg text-cyber-cyan/40 tracking-[3px] mb-3">
              NO GAMES YET
            </p>
            <p className="text-sm text-cyber-text/40 mb-6">
              아직 공유된 게임이 없습니다. 첫 번째 게임을 만들어보세요!
            </p>
            <Link href="/" className="inline-block px-6 py-3 btn-neon text-[13px]">
              게임 만들러 가기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/play/${game.id}`}
                className="glass-card p-5 group cursor-pointer transition-all hover:border-cyber-cyan/30 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyber-cyan/20 to-cyber-cyan/5 flex items-center justify-center text-cyber-cyan text-sm">
                    🎮
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-body text-cyber-text truncate group-hover:text-cyber-cyan transition-colors">
                      {game.title}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-cyber-text/30">
                    {timeAgo(game.createdAt)}
                  </span>
                  <span className="font-mono text-[10px] text-cyber-cyan/40 group-hover:text-cyber-cyan transition-colors tracking-wider">
                    PLAY →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="relative z-10 text-center pb-8">
        <div className="w-48 h-px mx-auto mb-4 bg-gradient-to-r from-transparent via-cyber-cyan/20 to-transparent" />
        <span className="font-mono text-[10px] text-cyber-text/20 tracking-[3px]">
          POWERED BY BYTEFORCE × CLAUDE AI
        </span>
      </footer>
    </div>
  );
}
