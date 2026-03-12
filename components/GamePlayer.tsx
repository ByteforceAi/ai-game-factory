'use client';

import { useRef, useEffect, useState } from 'react';

interface GamePlayerProps {
  gameCode: string;
  onReset: () => void;
  onEditCode: () => void;
  activeTab: 'play' | 'edit';
  setActiveTab: (tab: 'play' | 'edit') => void;
  children?: React.ReactNode; // For code editor slot
}

export default function GamePlayer({
  gameCode,
  onReset,
  onEditCode,
  activeTab,
  setActiveTab,
  children,
}: GamePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'shared'>('idle');
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (gameCode && iframeRef.current && activeTab === 'play') {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(gameCode);
        doc.close();
      }
    }
  }, [gameCode, activeTab]);

  const restartGame = () => {
    if (iframeRef.current?.contentDocument) {
      const doc = iframeRef.current.contentDocument;
      doc.open();
      doc.write(gameCode);
      doc.close();
    }
  };

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
        setShareUrl(data.url);
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

  return (
    <div className="animate-[slideUp_0.6s_ease]">
      <div className="glass-card overflow-hidden animate-glow-pulse hud-bracket">
        {/* Title bar with tabs */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-cyber-cyan/10 bg-black/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyber-green shadow-[0_0_6px_rgba(0,230,118,0.5)]" />
              <span className="font-orbitron text-[11px] text-cyber-cyan tracking-[2px]">
                GAME.RUNTIME
              </span>
            </div>
            {/* Tabs */}
            <div className="flex gap-1 ml-2">
              <button
                onClick={() => setActiveTab('play')}
                className={`px-3 py-1 rounded text-[10px] font-mono tracking-wider transition-all ${
                  activeTab === 'play'
                    ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30'
                    : 'text-cyber-text/40 hover:text-cyber-text/60'
                }`}
              >
                게임 플레이
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1 rounded text-[10px] font-mono tracking-wider transition-all ${
                  activeTab === 'edit'
                    ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30'
                    : 'text-cyber-text/40 hover:text-cyber-text/60'
                }`}
              >
                코드 편집
              </button>
            </div>
          </div>
          <span className="font-mono text-[10px] text-cyber-text/30">
            STATUS: ACTIVE
          </span>
        </div>

        {/* Content area */}
        <div className="p-4 bg-black/20">
          {activeTab === 'play' ? (
            <div className="flex justify-center">
              <iframe
                ref={iframeRef}
                title="game"
                sandbox="allow-scripts"
                className="w-full max-w-[620px] h-[440px] border border-cyber-cyan/10 rounded-lg bg-black"
              />
            </div>
          ) : (
            children
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        <button
          onClick={onReset}
          className="px-5 py-3 bg-cyber-cyan/8 border border-cyber-cyan/20 rounded-lg text-cyber-cyan text-[13px] font-orbitron tracking-[2px] cursor-pointer transition-all hover:bg-cyber-cyan/15 hover:shadow-[0_0_20px_rgba(0,229,255,0.2)]"
        >
          ← 새 게임
        </button>
        <button
          onClick={restartGame}
          className="px-5 py-3 btn-neon text-[13px]"
        >
          ↻ 다시 시작
        </button>
        <button
          onClick={shareGame}
          disabled={shareStatus === 'sharing'}
          className="px-5 py-3 bg-cyber-cyan/8 border border-cyber-cyan/20 rounded-lg text-cyber-cyan text-[13px] font-orbitron tracking-[2px] cursor-pointer transition-all hover:bg-cyber-cyan/15 hover:shadow-[0_0_20px_rgba(0,229,255,0.2)] disabled:opacity-50"
        >
          {shareStatus === 'sharing'
            ? '공유 중...'
            : shareStatus === 'shared'
            ? '✓ 링크 복사됨!'
            : '🔗 공유하기'}
        </button>
      </div>

      {/* Tips */}
      <div className="mt-5 p-4 bg-cyber-cyan/3 border border-cyber-cyan/8 rounded-[10px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-orbitron text-[11px] text-cyber-cyan tracking-[2px]">
            TIPS
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-cyber-text/50">
          <span>• 방향키 또는 WASD로 조작</span>
          <span>• 코드 편집 탭에서 게임 수정 가능</span>
          <span>• 공유하기로 친구에게 보내기</span>
        </div>
      </div>
    </div>
  );
}
