'use client';

import { useState } from 'react';
import { getRemixPresets, RemixPreset } from '@/lib/remixPresets';

interface RemixPanelProps {
  gameId: string;
  gameHtml: string;
  onApplyRemix: (newHtml: string, presetLabel: string) => void;
  onBack: () => void;
}

export default function RemixPanel({ gameId, gameHtml, onApplyRemix, onBack }: RemixPanelProps) {
  const presets = getRemixPresets(gameId);
  const [applying, setApplying] = useState<string | null>(null);

  const handleApply = (preset: RemixPreset) => {
    setApplying(preset.id);
    const modified = preset.apply(gameHtml);
    setTimeout(() => {
      onApplyRemix(modified, preset.label);
      setApplying(null);
    }, 300);
  };

  return (
    <div className="bar-cinematic" style={{
      padding: '20px',
      borderTop: '1px solid var(--border-dim)',
      maxHeight: '50vh',
      overflowY: 'auto',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div>
          <span className="mono-xs" style={{ fontSize: '9px', letterSpacing: '0.12em' }}>
            AI CODE MODIFICATION
          </span>
          <h3 style={{
            color: 'var(--text-bright)',
            fontSize: '15px',
            fontWeight: 600,
            margin: '4px 0 0',
          }}>
            바이브 코딩
          </h3>
        </div>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          CLOSE
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '10px',
      }}>
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleApply(preset)}
            disabled={applying !== null}
            className="card-cinematic"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '6px',
              padding: '14px',
              background: applying === preset.id
                ? 'rgba(99,102,241,0.1)'
                : 'var(--bg-surface)',
              borderColor: applying === preset.id
                ? 'var(--border-glow)'
                : 'var(--border-dim)',
              cursor: applying ? 'wait' : 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '20px' }}>{preset.icon}</span>
            <span style={{ color: 'var(--text-bright)', fontSize: '13px', fontWeight: 600 }}>
              {preset.label}
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: 1.3 }}>
              {preset.description}
            </span>
          </button>
        ))}
      </div>

      <p className="mono-xs" style={{
        marginTop: '14px',
        textAlign: 'center',
        fontSize: '8px',
      }}>
        SELECT A PRESET TO MODIFY GAME CODE
      </p>
    </div>
  );
}
