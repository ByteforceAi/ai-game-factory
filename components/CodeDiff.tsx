'use client';

import { useEffect, useRef, useState } from 'react';

interface CodeDiffProps {
  oldCode: string;
  newCode: string;
  label: string;
  onDone?: () => void;
}

/**
 * Shows an animated diff between old and new code
 * Red lines = removed, Green lines = added
 */
export default function CodeDiff({ oldCode, newCode, label, onDone }: CodeDiffProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'showing' | 'done'>('showing');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';

    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');

    // Simple line-by-line diff
    const diffs: { type: 'same' | 'removed' | 'added'; text: string }[] = [];

    // Find changed lines
    const maxLen = Math.max(oldLines.length, newLines.length);
    const matched = new Set<number>();

    for (let i = 0; i < oldLines.length; i++) {
      const idx = newLines.indexOf(oldLines[i]);
      if (idx !== -1 && !matched.has(idx)) {
        matched.add(idx);
        diffs.push({ type: 'same', text: oldLines[i] });
      } else {
        diffs.push({ type: 'removed', text: oldLines[i] });
      }
    }

    for (let i = 0; i < newLines.length; i++) {
      if (!matched.has(i)) {
        // Insert after the last same/removed line
        diffs.push({ type: 'added', text: newLines[i] });
      }
    }

    // Render with animation
    let idx = 0;
    const renderNext = () => {
      if (idx >= diffs.length) {
        setPhase('done');
        setTimeout(() => onDone?.(), 1500);
        return;
      }

      const d = diffs[idx];
      const div = document.createElement('div');
      div.style.fontFamily = 'var(--font-mono)';
      div.style.fontSize = '12px';
      div.style.padding = '2px 8px';
      div.style.borderRadius = '3px';
      div.style.opacity = '0';
      div.style.animation = 'lineFadeIn 0.2s ease forwards';
      div.style.whiteSpace = 'pre';

      if (d.type === 'removed') {
        div.style.background = 'rgba(239,68,68,0.12)';
        div.style.color = '#fca5a5';
        div.style.borderLeft = '3px solid #ef4444';
        div.textContent = `- ${d.text}`;
      } else if (d.type === 'added') {
        div.style.background = 'rgba(34,197,94,0.12)';
        div.style.color = '#86efac';
        div.style.borderLeft = '3px solid #22c55e';
        div.textContent = `+ ${d.text}`;
      } else {
        div.style.color = 'var(--text-muted)';
        div.textContent = `  ${d.text}`;
      }

      el.appendChild(div);
      el.scrollTop = el.scrollHeight;
      idx++;
      setTimeout(renderNext, d.type === 'same' ? 20 : 80);
    };

    setTimeout(renderNext, 300);
  }, [oldCode, newCode, label, onDone]);

  return (
    <div
      className="mt-3 rounded-claude-md overflow-hidden"
      style={{
        border: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 text-[11px] font-mono"
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
        }}
      >
        <span style={{ color: 'var(--neon-amber)' }}>⚡</span>
        코드 변경사항 — {label}
        {phase === 'done' && (
          <span className="ml-auto text-[var(--accent-green)]">✓ 적용 완료</span>
        )}
      </div>

      {/* Diff body */}
      <div
        ref={containerRef}
        className="overflow-y-auto p-2"
        style={{ maxHeight: '200px', lineHeight: 1.6 }}
      />
    </div>
  );
}
