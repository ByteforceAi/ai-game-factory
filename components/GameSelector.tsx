'use client';

import { useState, useEffect } from 'react';
import { DEMO_GAMES, DemoGame } from '@/lib/demoGames';

interface GameSelectorProps {
  onSelect: (game: DemoGame) => void;
}

export default function GameSelector({ onSelect }: GameSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [latency, setLatency] = useState(42);

  // Fake latency metric that fluctuates
  useEffect(() => {
    const iv = setInterval(() => {
      setLatency(35 + Math.floor(Math.random() * 20));
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const handleSelect = (game: DemoGame) => {
    setSelectedId(game.id);
    setTimeout(() => onSelect(game), 400);
  };

  return (
    <div className="tech-grid" style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient orbs */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'float1 8s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'float2 10s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', right: '20%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'float3 12s ease-in-out infinite', pointerEvents: 'none' }} />

      {/* Header — AI Lab Branding */}
      <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
        <div className="mono-label" style={{ marginBottom: '12px', letterSpacing: '0.15em' }}>
          SELECT MISSION
        </div>
        <h1 style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          margin: 0,
          lineHeight: 1.2,
        }}>
          <span className="text-gradient-ai">AI GAME FACTORY</span>
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '14px',
          marginTop: '8px',
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          AI 코드 생성 시뮬레이터
        </p>
        {/* Shimmer line */}
        <div className="shimmer-line" style={{ width: '60px', margin: '16px auto 0' }} />
      </div>

      {/* System Status Pills */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '28px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '100px',
          border: '0.5px solid rgba(0,0,0,0.06)',
        }}>
          <span className="status-dot" />
          <span className="mono-label" style={{ fontSize: '9px', color: 'var(--ai-emerald)' }}>SYSTEM ONLINE</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '100px',
          border: '0.5px solid rgba(0,0,0,0.06)',
        }}>
          <span className="mono-label" style={{ fontSize: '9px' }}>MODEL: SIM-v3.2</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '100px',
          border: '0.5px solid rgba(0,0,0,0.06)',
        }}>
          <span className="mono-label" style={{ fontSize: '9px' }}>LATENCY: {latency}ms</span>
        </div>
      </div>

      {/* Mission Cards */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        zIndex: 1,
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '18px 20px',
                background: isSelected
                  ? 'rgba(255,255,255,0.75)'
                  : isHovered
                    ? 'rgba(255,255,255,0.65)'
                    : 'rgba(255,255,255,0.45)',
                border: isSelected
                  ? `2px solid ${game.accentColor}`
                  : isHovered
                    ? '1px solid rgba(99,102,241,0.2)'
                    : '0.5px solid rgba(255,255,255,0.5)',
                borderRadius: '16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isSelected ? 'scale(0.97)' : isHovered ? 'translateY(-1px)' : 'none',
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                boxShadow: isHovered
                  ? '0 8px 32px rgba(99,102,241,0.08), 0 2px 8px rgba(0,0,0,0.04)'
                  : '0 2px 8px rgba(0,0,0,0.02)',
                borderLeft: isHovered ? `3px solid ${game.accentColor}` : undefined,
              }}
            >
              {/* Icon */}
              <div style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${game.accentColor}0a`,
                borderRadius: '12px',
                flexShrink: 0,
              }}>
                <span style={{
                  color: game.accentColor,
                  fontSize: '18px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                }}>
                  {game.icon}
                </span>
                <span className="mono-label" style={{ fontSize: '7px', marginTop: '2px' }}>
                  MSN-{String(idx + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  fontWeight: 600,
                  marginBottom: '3px',
                }}>
                  {game.title}
                </div>
                <div style={{
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  lineHeight: 1.4,
                }}>
                  {game.description}
                </div>
              </div>

              {/* Arrow */}
              <span style={{
                color: game.accentColor,
                fontSize: '16px',
                opacity: isHovered || isSelected ? 1 : 0.3,
                transition: 'all 0.2s',
                transform: isHovered ? 'translateX(3px)' : 'none',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 300,
              }}>
                ⟩
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <p className="mono-label" style={{
        marginTop: '28px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        fontSize: '10px',
      }}>
        ▸ SELECT A MISSION TO INITIALIZE CODE GENERATION
      </p>
    </div>
  );
}
