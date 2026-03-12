'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getGameExtensionsScript } from '@/lib/gameExtensions';
import LeaderboardOverlay from '@/components/LeaderboardOverlay';

interface PlayClientProps {
  gameHtml: string;
  gameTitle: string;
  gameId: string;
}

export default function PlayClient({ gameHtml, gameTitle, gameId }: PlayClientProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameScore, setGameScore] = useState(0);

  const writeGame = useCallback(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(gameHtml);
    doc.close();

    setTimeout(() => {
      try {
        const innerDoc = iframeRef.current?.contentDocument;
        if (innerDoc?.body) {
          const script = innerDoc.createElement('script');
          script.textContent = getGameExtensionsScript();
          innerDoc.body.appendChild(script);
        }
      } catch {}
    }, 200);
  }, [gameHtml]);

  useEffect(() => {
    writeGame();
  }, [writeGame]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'gameOver' && typeof event.data.score === 'number') {
        setGameScore(event.data.score);
        setShowLeaderboard(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const restartGame = () => {
    setShowLeaderboard(false);
    setGameScore(0);
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: 'resetGameOver' }, '*');
    } catch {}
    writeGame();
  };

  return (
    <div className="max-w-[700px] mx-auto px-4 py-6 md:py-10">
      <div className="flex items-center gap-2 mb-5 text-[13px] text-glass-text-secondary">
        <Link href="/" className="hover:text-glass-accent transition-colors">홈</Link>
        <span className="text-glass-text-muted">/</span>
        <span className="text-glass-text">{gameTitle}</span>
      </div>

      <div className="liquid-glass overflow-hidden relative">
        <div className="relative z-10 p-4 md:p-5 flex justify-center">
          <iframe
            ref={iframeRef}
            title="shared-game"
            sandbox="allow-scripts allow-same-origin"
            className="w-full max-w-[620px] h-[440px] border border-black/[0.06] rounded-[14px] bg-white shadow-sm"
          />
          {showLeaderboard && (
            <LeaderboardOverlay
              gameId={gameId}
              score={gameScore}
              onRestart={restartGame}
              onClose={() => setShowLeaderboard(false)}
            />
          )}
        </div>
      </div>

      <div className="flex gap-2.5 mt-4 justify-center">
        <Link href="/" className="btn-glass-secondary text-[13px]">
          ← 나도 만들기
        </Link>
        <button onClick={restartGame} className="btn-glass text-[13px]">
          ↻ 다시 시작
        </button>
      </div>

      <div className="mt-5 liquid-glass-sm p-4">
        <div className="relative z-10 flex flex-wrap gap-4 text-[13px] text-glass-text-secondary">
          <span>🎮 방향키/WASD 또는 터치로 조작</span>
          <span>🏆 게임 오버 시 순위 등록</span>
        </div>
      </div>
    </div>
  );
}
