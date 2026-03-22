'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface DashboardVar {
  key: string;
  label: string;
  value: number;
  max: number;
  color: string;
  icon: string;
}

interface LiveDashboardProps {
  gameId: string;
  open: boolean;
  onClose: () => void;
}

// Per-game variable definitions
const GAME_VARS: Record<string, Omit<DashboardVar, 'value'>[]> = {
  'neon-shooter': [
    { key: 'score', label: '점수', max: 10000, color: '#6366f1', icon: '🏆' },
    { key: 'playerX', label: '위치', max: 800, color: '#22d3ee', icon: '🚀' },
    { key: 'speed', label: '속도', max: 20, color: '#f59e0b', icon: '⚡' },
    { key: 'enemies', label: '적 수', max: 30, color: '#ef4444', icon: '👾' },
    { key: 'fireRate', label: '연사', max: 10, color: '#22c55e', icon: '🔥' },
  ],
  'tetris': [
    { key: 'score', label: '점수', max: 5000, color: '#6366f1', icon: '🏆' },
    { key: 'level', label: '레벨', max: 20, color: '#22c55e', icon: '📊' },
    { key: 'lines', label: '줄', max: 200, color: '#22d3ee', icon: '📏' },
    { key: 'speed', label: '속도', max: 20, color: '#f59e0b', icon: '⚡' },
  ],
  'cat-jump': [
    { key: 'score', label: '점수', max: 5000, color: '#6366f1', icon: '🏆' },
    { key: 'lives', label: '목숨', max: 9, color: '#ef4444', icon: '❤️' },
    { key: 'jumpForce', label: '점프력', max: 30, color: '#22c55e', icon: '🦘' },
    { key: 'speed', label: '속도', max: 15, color: '#f59e0b', icon: '⚡' },
  ],
  'temple-runner': [
    { key: 'score', label: '점수', max: 10000, color: '#6366f1', icon: '🏆' },
    { key: 'distance', label: '거리', max: 5000, color: '#22d3ee', icon: '📏' },
    { key: 'coins', label: '코인', max: 500, color: '#f59e0b', icon: '💰' },
    { key: 'speed', label: '속도', max: 20, color: '#22c55e', icon: '⚡' },
  ],
  'farm-garden': [
    { key: 'gold', label: '골드', max: 9999, color: '#f59e0b', icon: '💰' },
    { key: 'water', label: '물', max: 100, color: '#22d3ee', icon: '💧' },
    { key: 'growSpeed', label: '성장속도', max: 10, color: '#22c55e', icon: '🌱' },
    { key: 'level', label: '레벨', max: 10, color: '#6366f1', icon: '⭐' },
  ],
};

// Default vars for games not in the map
const DEFAULT_VARS: Omit<DashboardVar, 'value'>[] = [
  { key: 'score', label: '점수', max: 10000, color: '#6366f1', icon: '🏆' },
  { key: 'speed', label: '속도', max: 20, color: '#f59e0b', icon: '⚡' },
  { key: 'level', label: '레벨', max: 20, color: '#22c55e', icon: '📊' },
];

export default function LiveDashboard({ gameId, open, onClose }: LiveDashboardProps) {
  const [vars, setVars] = useState<DashboardVar[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollVars = useCallback(() => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe');
    if (!iframe?.contentWindow) return;

    // Request state from game
    iframe.contentWindow.postMessage({ type: 'GET_STATE' }, '*');
  }, []);

  useEffect(() => {
    if (!open) return;

    const defs = GAME_VARS[gameId] || DEFAULT_VARS;
    setVars(defs.map(d => ({ ...d, value: 0 })));

    // Listen for state responses
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'STATE_REPORT') {
        const state = e.data.state;
        if (!state) return;
        setVars(prev => prev.map(v => ({
          ...v,
          value: typeof state[v.key] === 'number' ? state[v.key] : v.value,
        })));
      }
    };
    window.addEventListener('message', handleMessage);

    // Poll every 500ms
    pollVars();
    intervalRef.current = setInterval(pollVars, 500);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, gameId, pollVars]);

  if (!open) return null;

  return (
    <div
      className="absolute top-12 right-3 z-50 w-[220px] rounded-claude-lg overflow-hidden animate-msg-in"
      style={{
        background: 'rgba(30,30,30,0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase">
          📊 Live Dashboard
        </span>
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm cursor-pointer"
          style={{ border: 'none', background: 'transparent' }}
        >
          ✕
        </button>
      </div>

      {/* Variables */}
      <div className="p-3 flex flex-col gap-2.5">
        {vars.map(v => {
          const pct = Math.min(100, (v.value / v.max) * 100);
          return (
            <div key={v.key}>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-[var(--text-secondary)]">
                  {v.icon} {v.label}
                </span>
                <span
                  className="font-mono font-semibold tabular-nums"
                  style={{ color: v.color }}
                >
                  {Math.round(v.value)}
                </span>
              </div>
              <div
                className="h-[6px] rounded-full overflow-hidden"
                style={{ background: 'var(--bg-surface)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${v.color}, ${v.color}80)`,
                    boxShadow: `0 0 8px ${v.color}40`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Hint */}
      <div
        className="px-3 py-2 text-[9px] text-[var(--text-muted)]"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        채팅으로 수정하면 실시간 반영됩니다
      </div>
    </div>
  );
}
