'use client';

import { useState, useEffect, useRef } from 'react';
import { timeline, type TimelineEvent } from '@/lib/timelineRecorder';

interface TimelineReplayProps {
  open: boolean;
  onClose: () => void;
}

function formatTime(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return `${min}:${String(s).padStart(2, '0')}`;
}

const TYPE_COLORS: Record<string, string> = {
  user: '#6366f1',
  ai: '#e07a5f',
  vibe: '#22c55e',
  theme: '#eab308',
  'game-start': '#22d3ee',
  'game-over': '#ef4444',
  system: '#94a3b8',
};

const TYPE_ICONS: Record<string, string> = {
  user: '👤',
  ai: '🤖',
  vibe: '⚡',
  theme: '🎨',
  'game-start': '🎮',
  'game-over': '🏆',
  system: '⚙️',
};

export default function TimelineReplay({ open, onClose }: TimelineReplayProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [playbackPos, setPlaybackPos] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setEvents(timeline.getEvents());
    const unsub = timeline.subscribe(() => {
      setEvents(timeline.getEvents());
    });
    return unsub;
  }, [open]);

  const duration = events.length > 0 ? events[events.length - 1].timestamp : 0;

  const handleExport = () => {
    const json = timeline.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-[90vw] max-w-[520px] max-h-[70vh] rounded-claude-lg overflow-hidden flex flex-col animate-msg-in"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[14px]">🎬</span>
            <span className="text-[14px] font-semibold text-[var(--text-primary)]">
              학습 타임라인
            </span>
            <span className="text-[11px] text-[var(--text-muted)] ml-1">
              {events.length}개 이벤트 · {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="text-[11px] px-2 py-1 rounded cursor-pointer hover:opacity-80"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              📥 내보내기
            </button>
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg cursor-pointer"
              style={{ border: 'none', background: 'transparent' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Timeline progress bar */}
        {duration > 0 && (
          <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div
              className="h-2 rounded-full overflow-hidden cursor-pointer relative"
              style={{ background: 'var(--bg-surface)' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                setPlaybackPos(ratio * duration);
              }}
            >
              {/* Event dots */}
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="absolute top-0 w-[3px] h-full rounded-full"
                  style={{
                    left: `${(ev.timestamp / duration) * 100}%`,
                    background: TYPE_COLORS[ev.type] || '#94a3b8',
                    opacity: 0.6,
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-[var(--text-muted)] font-mono">
              <span>0:00</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Event list */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-3">
          {events.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              아직 이벤트가 없어요. 대화를 시작하면 자동 기록됩니다.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {events.map((ev, i) => {
                const isHighlighted = playbackPos !== null &&
                  ev.timestamp <= playbackPos &&
                  (i === events.length - 1 || events[i + 1].timestamp > playbackPos);

                return (
                  <div
                    key={ev.id}
                    className="flex items-start gap-2 py-1.5 px-2 rounded transition-all duration-200"
                    style={{
                      background: isHighlighted ? 'var(--bg-surface)' : 'transparent',
                      borderLeft: `2px solid ${TYPE_COLORS[ev.type] || '#94a3b8'}`,
                    }}
                  >
                    <span className="text-[11px] font-mono text-[var(--text-muted)] w-[36px] flex-shrink-0 text-right">
                      {formatTime(ev.timestamp)}
                    </span>
                    <span className="text-[12px]">{TYPE_ICONS[ev.type] || '·'}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] text-[var(--text-primary)]">
                        {ev.label}
                      </span>
                      {ev.score && (
                        <span className="ml-1 text-[10px]" style={{ color: TYPE_COLORS.user }}>
                          {'★'.repeat(ev.score)}{'☆'.repeat(5 - ev.score)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
