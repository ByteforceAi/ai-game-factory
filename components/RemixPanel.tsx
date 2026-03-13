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
    // Small delay for feel
    setTimeout(() => {
      onApplyRemix(modified, preset.label);
      setApplying(null);
    }, 300);
  };

  return (
    <div style={{
      padding: '20px',
      background: '#161b22',
      borderTop: '1px solid #21262d',
      maxHeight: '50vh',
      overflowY: 'auto',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <h3 style={{
          color: '#e6edf3',
          fontSize: '16px',
          fontWeight: 600,
          margin: 0,
        }}>
          ✨ 바이브 코딩하기
        </h3>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#8b949e',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          닫기 ✕
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '10px',
      }}>
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleApply(preset)}
            disabled={applying !== null}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '6px',
              padding: '14px',
              background: applying === preset.id
                ? 'rgba(88,166,255,0.15)'
                : 'rgba(255,255,255,0.04)',
              border: applying === preset.id
                ? '1px solid #58a6ff'
                : '1px solid #21262d',
              borderRadius: '12px',
              cursor: applying ? 'wait' : 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '24px' }}>{preset.icon}</span>
            <span style={{ color: '#e6edf3', fontSize: '13px', fontWeight: 600 }}>
              {preset.label}
            </span>
            <span style={{ color: '#8b949e', fontSize: '11px', lineHeight: 1.3 }}>
              {preset.description}
            </span>
          </button>
        ))}
      </div>

      <p style={{
        color: '#484f58',
        fontSize: '11px',
        marginTop: '14px',
        textAlign: 'center',
      }}>
        프리셋을 선택하면 AI가 코드를 수정합니다
      </p>
    </div>
  );
}
