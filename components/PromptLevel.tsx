'use client';

import { useEffect, useState } from 'react';

interface PromptLevelProps {
  score: number; // 1-5
  level: string;
  feedback: string;
  tip?: string;
}

export default function PromptLevel({ score, level, feedback, tip }: PromptLevelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (score <= 0) return null;

  const starColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#818cf8'];
  const color = starColors[Math.min(score - 1, 4)];

  return (
    <div
      className="flex items-center gap-2 mt-1 transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(4px)',
      }}
    >
      {/* Stars */}
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <span
            key={i}
            className="text-[12px] transition-all duration-300"
            style={{
              color: i <= score ? color : 'var(--text-muted)',
              transform: i <= score ? 'scale(1.1)' : 'scale(0.9)',
              animationDelay: `${i * 80}ms`,
            }}
          >
            {i <= score ? '★' : '☆'}
          </span>
        ))}
      </div>

      {/* Level badge */}
      <span
        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
        style={{
          background: `${color}20`,
          color: color,
          border: `1px solid ${color}40`,
        }}
      >
        {level}
      </span>

      {/* Feedback */}
      <span className="text-[11px] text-[var(--text-muted)]">{feedback}</span>

      {/* Tip */}
      {tip && (
        <span className="text-[10px] text-[var(--neon-amber)] ml-auto">
          💡 {tip}
        </span>
      )}
    </div>
  );
}
