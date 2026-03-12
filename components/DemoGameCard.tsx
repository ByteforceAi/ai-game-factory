'use client';

import type { DemoGame } from '@/lib/demoGames';

interface DemoGameCardProps {
  game: DemoGame;
  onPlay: (game: DemoGame) => void;
}

export default function DemoGameCard({ game, onPlay }: DemoGameCardProps) {
  return (
    <button
      onClick={() => onPlay(game)}
      className="liquid-glass group text-left w-full cursor-pointer"
    >
      <div className="relative z-10 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-[12px] flex items-center justify-center text-2xl"
            style={{
              background: `linear-gradient(135deg, ${game.accentColor}18, ${game.accentColor}08)`,
              boxShadow: `0 4px 12px ${game.accentColor}10`,
            }}
          >
            {game.icon}
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-glass-text group-hover:text-glass-accent transition-colors tracking-tight">
              {game.title}
            </h3>
          </div>
        </div>

        {/* Show the prompt that "generates" this game */}
        <div className="bg-black/[0.03] rounded-[10px] px-3 py-2.5 mb-4 border border-black/[0.04]">
          <p className="text-[12px] text-glass-text-secondary font-mono leading-relaxed">
            &ldquo;{game.prompt}&rdquo;
          </p>
        </div>

        <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: game.accentColor }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          AI로 생성 체험하기
        </div>
      </div>
    </button>
  );
}
