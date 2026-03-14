'use client';

import { useState, useEffect } from 'react';
import { DEMO_GAMES, DemoGame } from '@/lib/demoGames';
import ParticleBackground from './ParticleBackground';

interface GameSelectorProps {
  onSelect: (game: DemoGame) => void;
}

export default function GameSelector({ onSelect }: GameSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [latency, setLatency] = useState(42);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const iv = setInterval(() => setLatency(35 + Math.floor(Math.random() * 20)), 2000);
    return () => clearInterval(iv);
  }, []);

  const handleSelect = (game: DemoGame) => {
    setSelectedId(game.id);
    setTimeout(() => onSelect(game), 500);
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <ParticleBackground />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>

        {/* Title Block */}
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div className="mono-xs" style={{ marginBottom: '16px', color: 'var(--ai-cyan)', letterSpacing: '0.2em' }}>
            NEURAL ENGINE v3.2
          </div>
          <h1 style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 'clamp(24px, 6vw, 36px)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            margin: 0,
            lineHeight: 1.2,
          }}>
            <span className="text-glow-indigo">VIBE CODING</span>
            <br />
            <span style={{ color: 'var(--text-body)', fontSize: '0.6em', letterSpacing: '0.15em' }}>
              SIMULATOR
            </span>
          </h1>
          <div className="shimmer-line" style={{ width: '80px', margin: '16px auto' }} />
          <p style={{ color: 'var(--text-dim)', fontSize: '13px', margin: 0 }}>
            AI가 실시간으로 게임 코드를 생성합니다
          </p>
        </div>

        {/* System Status */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {[
            { dot: 'status-dot-green', label: 'ONLINE', color: 'var(--ai-emerald)' },
            { dot: '', label: `LATENCY ${latency}ms`, color: 'var(--text-dim)' },
            { dot: '', label: `${DEMO_GAMES.length} MISSIONS`, color: 'var(--text-dim)' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-dim)',
              borderRadius: '100px',
            }}>
              {item.dot && <span className={item.dot} />}
              <span className="mono-xs" style={{ color: item.color, fontSize: '8px' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Mission Cards */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: '100%',
        }}>
          {DEMO_GAMES.map((game, idx) => {
            const isHovered = hoveredId === game.id;
            const isSelected = selectedId === game.id;

            return (
              <button
                key={game.id}
                onClick={() => handleSelect(game)}
                onMouseEnter={() => setHoveredId(game.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="card-cinematic"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '18px 20px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderColor: isSelected
                    ? game.accentColor
                    : isHovered
                      ? 'var(--border-glow)'
                      : 'var(--border-dim)',
                  boxShadow: isSelected
                    ? `0 0 30px ${game.accentColor}30, inset 0 0 20px ${game.accentColor}08`
                    : isHovered
                      ? '0 0 30px rgba(99,102,241,0.08), 0 8px 32px rgba(0,0,0,0.3)'
                      : 'none',
                  transform: isSelected ? 'scale(0.98)' : isHovered ? 'translateY(-2px)' : 'none',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${game.accentColor}10`,
                  border: `1px solid ${game.accentColor}20`,
                  borderRadius: '12px',
                  flexShrink: 0,
                  transition: 'all 0.3s',
                  boxShadow: isHovered ? `0 0 20px ${game.accentColor}20` : 'none',
                }}>
                  <span style={{
                    color: game.accentColor,
                    fontSize: '18px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    textShadow: isHovered ? `0 0 10px ${game.accentColor}60` : 'none',
                  }}>
                    {game.icon}
                  </span>
                  <span className="mono-xs" style={{ fontSize: '7px', marginTop: '2px', color: 'var(--text-muted)' }}>
                    MSN-{String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: 'var(--text-bright)',
                    fontSize: '15px',
                    fontWeight: 600,
                    marginBottom: '3px',
                  }}>
                    {game.title}
                  </div>
                  <div style={{
                    color: 'var(--text-dim)',
                    fontSize: '12px',
                    lineHeight: 1.4,
                  }}>
                    {game.description}
                  </div>
                </div>

                {/* Arrow */}
                <span style={{
                  color: game.accentColor,
                  fontSize: '18px',
                  opacity: isHovered || isSelected ? 1 : 0.2,
                  transition: 'all 0.3s',
                  transform: isHovered ? 'translateX(4px)' : 'none',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  ⟩
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <p className="mono-xs" style={{
          marginTop: '32px',
          textAlign: 'center',
          fontSize: '8px',
          color: 'var(--text-muted)',
          letterSpacing: '0.15em',
        }}>
          SELECT A MISSION TO BEGIN VIBE CODING
        </p>
      </div>
    </div>
  );
}
