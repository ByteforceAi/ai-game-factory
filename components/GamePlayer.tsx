'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { getGameExtensionsScript } from '@/lib/gameExtensions';
import LeaderboardOverlay from './LeaderboardOverlay';

interface GamePlayerProps {
  gameCode: string;
  gameId?: string;
  onReset: () => void;
  onEditCode: () => void;
  activeTab: 'play' | 'edit';
  setActiveTab: (tab: 'play' | 'edit') => void;
  children?: React.ReactNode;
}

export default function GamePlayer({
  gameCode,
  gameId = 'custom',
  onReset,
  onEditCode,
  activeTab,
  setActiveTab,
  children,
}: GamePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'shared'>('idle');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const writeGameToIframe = useCallback(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(gameCode);
    doc.close();

    // Inject touch controls + game over detection after a brief delay
    setTimeout(() => {
      try {
        const innerDoc = iframeRef.current?.contentDocument;
        if (innerDoc?.body) {
          const script = innerDoc.createElement('script');
          script.textContent = getGameExtensionsScript();
          innerDoc.body.appendChild(script);
        }
      } catch (e) {
        // Sandbox may block in some cases
      }
    }, 200);
  }, [gameCode]);

  useEffect(() => {
    if (gameCode && activeTab === 'play') {
      // Small delay when expanded changes so new iframe mounts first
      const t = setTimeout(() => writeGameToIframe(), 50);
      return () => clearTimeout(t);
    }
  }, [gameCode, activeTab, expanded, writeGameToIframe]);

  // Auto-expand on mobile when playing
  useEffect(() => {
    if (activeTab === 'play' && gameCode) {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setExpanded(true);
      }
    }
  }, [activeTab, gameCode]);

  // Lock body scroll when expanded
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [expanded]);

  // Listen for game over messages from iframe
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
    writeGameToIframe();
  };

  const toggleExpand = () => setExpanded(prev => !prev);

  const shareGame = async () => {
    setShareStatus('sharing');
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: gameCode, title: 'AI Generated Game' }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        await navigator.clipboard.writeText(data.url);
        setShareStatus('shared');
        setTimeout(() => setShareStatus('idle'), 3000);
      } else {
        setShareStatus('idle');
      }
    } catch {
      setShareStatus('idle');
    }
  };

  // Expanded (fullscreen-like) mode — covers entire viewport
  if (expanded && activeTab === 'play') {
    return (
      <div
        ref={gameContainerRef}
        className="fixed inset-0 z-[9999] bg-black flex flex-col"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-black/80 backdrop-blur-sm shrink-0">
          <button
            onClick={() => { setExpanded(false); onReset(); }}
            className="text-white/60 text-[12px] px-2 py-1 rounded-lg hover:bg-white/10"
          >
            ← 나가기
          </button>
          <button
            onClick={restartGame}
            className="text-white/80 text-[12px] px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20"
          >
            ↻ 다시
          </button>
          <button
            onClick={toggleExpand}
            className="text-white/60 text-[12px] px-2 py-1 rounded-lg hover:bg-white/10"
          >
            ⊡ 축소
          </button>
        </div>

        {/* Game area — fills remaining space */}
        <div className="flex-1 relative flex items-center justify-center min-h-0">
          <iframe
            ref={iframeRef}
            title="game"
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0"
          />

          {/* Leaderboard Overlay */}
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
    );
  }

  return (
    <div className="animate-slide-up">
      <div className="liquid-glass overflow-hidden relative">
        {/* Tab bar */}
        <div className="relative z-10 flex items-center gap-1 px-4 py-3 border-b border-black/[0.06]">
          <button
            onClick={() => setActiveTab('play')}
            className={`px-4 py-2 rounded-[10px] text-[13px] font-medium transition-all ${
              activeTab === 'play'
                ? 'bg-glass-accent/10 text-glass-accent'
                : 'text-glass-text-secondary hover:text-glass-text hover:bg-black/[0.03]'
            }`}
          >
            🎮 게임 플레이
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 rounded-[10px] text-[13px] font-medium transition-all ${
              activeTab === 'edit'
                ? 'bg-glass-accent/10 text-glass-accent'
                : 'text-glass-text-secondary hover:text-glass-text hover:bg-black/[0.03]'
            }`}
          >
            ✏️ 코드 편집
          </button>
          {activeTab === 'play' && (
            <button
              onClick={toggleExpand}
              className="ml-auto px-3 py-2 rounded-[10px] text-[13px] font-medium text-glass-text-secondary hover:text-glass-text hover:bg-black/[0.03] transition-all"
            >
              ⊞ 전체화면
            </button>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10 p-2 md:p-4">
          {activeTab === 'play' ? (
            <div className="relative flex justify-center">
              <iframe
                ref={iframeRef}
                title="game"
                sandbox="allow-scripts allow-same-origin"
                className="w-full aspect-[3/2] max-w-[620px] border border-black/[0.06] rounded-[14px] bg-black shadow-sm"
              />

              {/* Leaderboard Overlay */}
              {showLeaderboard && (
                <LeaderboardOverlay
                  gameId={gameId}
                  score={gameScore}
                  onRestart={restartGame}
                  onClose={() => setShowLeaderboard(false)}
                />
              )}
            </div>
          ) : (
            children
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2.5 mt-4 justify-center">
        <button onClick={onReset} className="btn-glass-secondary text-[13px]">
          ← 새 게임
        </button>
        <button onClick={restartGame} className="btn-glass text-[13px]">
          ↻ 다시 시작
        </button>
        <button
          onClick={shareGame}
          disabled={shareStatus === 'sharing'}
          className="btn-glass-secondary text-[13px]"
        >
          {shareStatus === 'sharing'
            ? '공유 중...'
            : shareStatus === 'shared'
            ? '✓ 링크 복사됨!'
            : '🔗 공유하기'}
        </button>
      </div>

      {/* Tips */}
      <div className="mt-5 liquid-glass-sm p-4">
        <div className="relative z-10 flex flex-wrap gap-4 text-[13px] text-glass-text-secondary">
          <span>🎮 방향키/WASD 또는 터치로 조작</span>
          <span>🏆 게임 오버 시 순위 등록</span>
          <span>📤 친구에게 공유하고 대결하기</span>
        </div>
      </div>
    </div>
  );
}
