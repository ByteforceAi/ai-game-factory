'use client';

import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  name: string;
  score: number;
  ts: number;
}

interface LeaderboardOverlayProps {
  gameId: string;
  score: number;
  onRestart: () => void;
  onClose: () => void;
}

export default function LeaderboardOverlay({
  gameId,
  score,
  onRestart,
  onClose,
}: LeaderboardOverlayProps) {
  const [name, setName] = useState('');
  const [phase, setPhase] = useState<'input' | 'submitting' | 'board'>('input');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState(0);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  // Load existing leaderboard (API with localStorage fallback)
  useEffect(() => {
    const localKey = `lb_${gameId}`;
    // Try API first, fall back to localStorage
    fetch(`/api/leaderboard?gameId=${gameId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.leaderboard?.length > 0) {
          setLeaderboard(data.leaderboard.slice(0, 10));
          try { localStorage.setItem(localKey, JSON.stringify(data.leaderboard.slice(0, 10))); } catch {}
        }
      })
      .catch(() => {
        // Fallback to localStorage
        try {
          const local = JSON.parse(localStorage.getItem(localKey) || '[]');
          if (local.length > 0) setLeaderboard(local);
        } catch {}
      });
  }, [gameId]);

  const submitScore = async () => {
    if (!name.trim()) return;
    setPhase('submitting');

    const localKey = `lb_${gameId}`;
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, name: name.trim(), score }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLeaderboard(data.leaderboard || []);
      setMyRank(data.rank || 0);
      try { localStorage.setItem(localKey, JSON.stringify(data.leaderboard || [])); } catch {}
      setPhase('board');
    } catch {
      // Fallback: save to localStorage
      try {
        const current: LeaderboardEntry[] = JSON.parse(localStorage.getItem(localKey) || '[]');
        const entry: LeaderboardEntry = { name: name.trim(), score, ts: Date.now() };
        current.push(entry);
        current.sort((a, b) => b.score - a.score || a.ts - b.ts);
        const trimmed = current.slice(0, 10);
        localStorage.setItem(localKey, JSON.stringify(trimmed));
        setLeaderboard(trimmed);
        const rank = trimmed.findIndex(e => e.name === entry.name && e.score === entry.score && e.ts === entry.ts);
        setMyRank(rank + 1);
      } catch {}
      setPhase('board');
    }
  };

  const shareWithScore = async () => {
    const url = window.location.origin;
    const text = `🎮 AI Game Factory에서 ${score}점을 기록했어요! 이 점수를 이길 수 있나요?\n${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'AI Game Factory', text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2000);
      } catch {}
    }
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-[14px]" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[380px] bg-white rounded-[20px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-glass-accent to-glass-indigo px-6 pt-6 pb-8 text-center text-white">
          <p className="text-[14px] font-medium opacity-80 mb-1">게임 오버!</p>
          <p className="text-[42px] font-bold tracking-tight leading-none">{score}</p>
          <p className="text-[13px] opacity-70 mt-1">점</p>
        </div>

        <div className="px-5 pb-5">
          {/* Name Input Phase */}
          {phase === 'input' && (
            <div className="-mt-4">
              <div className="bg-white rounded-[14px] shadow-lg p-4 border border-black/[0.06]">
                <p className="text-[13px] font-semibold text-glass-text mb-3">
                  🏆 리더보드에 이름을 등록하세요
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="닉네임 입력"
                    maxLength={20}
                    className="flex-1 px-3 py-2.5 bg-glass-bg border border-black/[0.08] rounded-[10px] text-[14px] text-glass-text focus:outline-none focus:border-glass-accent/40 focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-glass-text-muted"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitScore();
                    }}
                    autoFocus
                  />
                  <button
                    onClick={submitScore}
                    disabled={!name.trim()}
                    className="px-4 py-2.5 bg-glass-accent text-white text-[14px] font-semibold rounded-[10px] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#0071E3] transition-colors"
                  >
                    등록
                  </button>
                </div>
              </div>

              {/* Existing leaderboard preview */}
              {leaderboard.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold text-glass-text-muted tracking-wider uppercase mb-2 px-1">
                    현재 순위
                  </p>
                  <div className="space-y-1">
                    {leaderboard.slice(0, 5).map((entry, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-glass-bg/50">
                        <span className="text-[14px] w-8 text-center">{getRankEmoji(i + 1)}</span>
                        <span className="flex-1 text-[13px] text-glass-text truncate">{entry.name}</span>
                        <span className="text-[13px] font-semibold text-glass-accent">{entry.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submitting Phase */}
          {phase === 'submitting' && (
            <div className="-mt-4 text-center py-8">
              <div className="w-8 h-8 mx-auto rounded-full border-2 border-glass-accent/20 border-t-glass-accent animate-spin" />
              <p className="text-[14px] text-glass-text-secondary mt-3">등록 중...</p>
            </div>
          )}

          {/* Leaderboard Phase */}
          {phase === 'board' && (
            <div className="-mt-4">
              {myRank > 0 && (
                <div className="bg-glass-accent/10 rounded-[12px] px-4 py-3 mb-3 text-center">
                  <p className="text-[14px] font-semibold text-glass-accent">
                    🎉 {myRank}위 달성!
                  </p>
                </div>
              )}

              <div className="space-y-1 mb-4">
                {leaderboard.map((entry, i) => {
                  const isMe = entry.name === name.trim() && entry.score === score;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-[10px] transition-colors ${
                        isMe ? 'bg-glass-accent/10 border border-glass-accent/20' : 'bg-glass-bg/50'
                      }`}
                    >
                      <span className="text-[15px] w-8 text-center font-semibold">
                        {getRankEmoji(i + 1)}
                      </span>
                      <span className={`flex-1 text-[14px] truncate ${isMe ? 'font-semibold text-glass-accent' : 'text-glass-text'}`}>
                        {entry.name}
                        {isMe && <span className="ml-1 text-[11px]">← 나</span>}
                      </span>
                      <span className={`text-[14px] font-bold ${isMe ? 'text-glass-accent' : 'text-glass-text-secondary'}`}>
                        {entry.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={onRestart}
              className="flex-1 py-3 bg-glass-accent text-white text-[14px] font-semibold rounded-[12px] hover:bg-[#0071E3] transition-colors"
            >
              ↻ 다시 도전
            </button>
            <button
              onClick={shareWithScore}
              className="flex-1 py-3 bg-black/[0.04] text-glass-text text-[14px] font-semibold rounded-[12px] border border-black/[0.08] hover:bg-black/[0.07] transition-colors"
            >
              {shareStatus === 'copied' ? '✓ 복사됨!' : '📤 친구에게 도전'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
