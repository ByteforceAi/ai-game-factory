'use client';

import { useState } from 'react';
import { getRemixPresets, RemixPreset } from '@/lib/remixPresets';
import {
  VISUAL_THEMES,
  VisualTheme,
  ThemeCategory,
  CATEGORY_LABELS,
  applyVisualTheme,
} from '@/lib/visualThemes';

interface RemixPanelProps {
  gameId: string;
  gameHtml: string;
  onApplyRemix: (newHtml: string, presetLabel: string, codeSnippet?: string) => void;
  onBack: () => void;
}

type PanelTab = 'gameplay' | 'visual';

export default function RemixPanel({ gameId, gameHtml, onApplyRemix, onBack }: RemixPanelProps) {
  const gameplayPresets = getRemixPresets(gameId);
  const [tab, setTab] = useState<PanelTab>(gameplayPresets.length > 0 ? 'gameplay' : 'visual');
  const [applying, setApplying] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ThemeCategory>('color');
  const [appliedThemes, setAppliedThemes] = useState<Set<string>>(new Set());

  const handleApplyGameplay = (preset: RemixPreset) => {
    setApplying(preset.id);
    const modified = preset.apply(gameHtml);
    setTimeout(() => {
      onApplyRemix(modified, preset.label);
      setApplying(null);
    }, 300);
  };

  const handleApplyVisual = (theme: VisualTheme) => {
    setApplying(theme.id);
    const modified = applyVisualTheme(gameHtml, theme);
    const newApplied = new Set(appliedThemes);
    newApplied.add(theme.id);
    setAppliedThemes(newApplied);
    setTimeout(() => {
      // Pass the CSS as codeSnippet for the overlay materializer effect
      onApplyRemix(modified, theme.label, theme.css.trim());
      setApplying(null);
    }, 300);
  };

  const categories = Object.entries(CATEGORY_LABELS) as [ThemeCategory, { label: string; icon: string }][];
  const filteredThemes = VISUAL_THEMES.filter(t => t.category === activeCategory);

  return (
    <div className="bar-cinematic" style={{
      padding: '16px 16px 12px',
      borderTop: '1px solid var(--border-dim)',
      maxHeight: '55vh',
      overflowY: 'auto',
      background: 'rgba(5,5,16,0.97)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <div>
          <span className="mono-xs" style={{ fontSize: '8px', letterSpacing: '0.12em', color: 'var(--text-dim)' }}>
            AI CODE MODIFICATION
          </span>
          <h3 style={{
            color: 'var(--text-bright)',
            fontSize: '14px',
            fontWeight: 600,
            margin: '2px 0 0',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            ✨ 바이브 코딩
          </h3>
        </div>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-dim)',
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: '6px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Tab Switcher */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '10px',
        padding: '3px',
      }}>
        {gameplayPresets.length > 0 && (
          <button
            onClick={() => setTab('gameplay')}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: '8px',
              border: 'none',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: tab === 'gameplay' ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: tab === 'gameplay' ? 'var(--ai-indigo)' : 'var(--text-muted)',
              borderBottom: tab === 'gameplay' ? '2px solid var(--ai-indigo)' : '2px solid transparent',
            }}
          >
            🎮 게임플레이
          </button>
        )}
        <button
          onClick={() => setTab('visual')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '8px',
            border: 'none',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: tab === 'visual' ? 'rgba(16,185,129,0.2)' : 'transparent',
            color: tab === 'visual' ? '#6ee7b7' : 'var(--text-muted)',
            borderBottom: tab === 'visual' ? '2px solid #10b981' : '2px solid transparent',
          }}
        >
          🎨 비주얼 테마
          <span style={{
            marginLeft: '4px',
            fontSize: '9px',
            padding: '1px 5px',
            borderRadius: '8px',
            background: 'rgba(16,185,129,0.15)',
            color: '#6ee7b7',
          }}>
            {VISUAL_THEMES.length}
          </span>
        </button>
      </div>

      {/* GAMEPLAY TAB */}
      {tab === 'gameplay' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '8px',
        }}>
          {gameplayPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyGameplay(preset)}
              disabled={applying !== null}
              className="card-cinematic"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '5px',
                padding: '12px',
                background: applying === preset.id
                  ? 'rgba(99,102,241,0.1)'
                  : 'var(--bg-surface)',
                borderColor: applying === preset.id
                  ? 'var(--border-glow)'
                  : 'var(--border-dim)',
                cursor: applying ? 'wait' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '18px' }}>{preset.icon}</span>
              <span style={{ color: 'var(--text-bright)', fontSize: '12px', fontWeight: 600 }}>
                {preset.label}
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: '10px', lineHeight: 1.3 }}>
                {preset.description}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* VISUAL TAB */}
      {tab === 'visual' && (
        <>
          {/* Category Pills */}
          <div style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '10px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}>
            {categories.map(([cat, info]) => {
              const count = VISUAL_THEMES.filter(t => t.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: activeCategory === cat ? 'rgba(16,185,129,0.4)' : 'var(--border-dim)',
                    background: activeCategory === cat ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
                    color: activeCategory === cat ? '#6ee7b7' : 'var(--text-muted)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{info.icon}</span>
                  <span>{info.label}</span>
                  <span style={{
                    fontSize: '8px',
                    opacity: 0.6,
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Theme Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '8px',
          }}>
            {filteredThemes.map((theme) => {
              const isApplied = appliedThemes.has(theme.id);
              return (
                <button
                  key={theme.id}
                  onClick={() => handleApplyVisual(theme)}
                  disabled={applying !== null}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '5px',
                    padding: '12px',
                    background: isApplied
                      ? 'rgba(16,185,129,0.08)'
                      : 'rgba(255,255,255,0.02)',
                    border: '1px solid',
                    borderColor: applying === theme.id
                      ? '#10b981'
                      : isApplied
                        ? 'rgba(16,185,129,0.3)'
                        : 'var(--border-dim)',
                    borderRadius: '10px',
                    cursor: applying ? 'wait' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Preview gradient strip */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: theme.preview,
                    opacity: isApplied ? 1 : 0.6,
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                    <span style={{ fontSize: '16px' }}>{theme.icon}</span>
                    {isApplied && (
                      <span style={{
                        fontSize: '8px',
                        padding: '1px 5px',
                        borderRadius: '6px',
                        background: 'rgba(16,185,129,0.2)',
                        color: '#6ee7b7',
                        fontFamily: "'JetBrains Mono', monospace",
                        marginLeft: 'auto',
                      }}>
                        ON
                      </span>
                    )}
                  </div>
                  <span style={{
                    color: isApplied ? '#6ee7b7' : 'var(--text-bright)',
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {theme.label}
                  </span>
                  <span style={{
                    color: 'var(--text-dim)',
                    fontSize: '9px',
                    lineHeight: 1.3,
                  }}>
                    {theme.description}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Footer */}
      <p className="mono-xs" style={{
        marginTop: '12px',
        textAlign: 'center',
        fontSize: '8px',
        color: 'var(--text-dim)',
      }}>
        {tab === 'gameplay'
          ? 'SELECT A PRESET TO MODIFY GAME CODE'
          : `${VISUAL_THEMES.length} VISUAL THEMES · STACKABLE`
        }
      </p>
    </div>
  );
}
