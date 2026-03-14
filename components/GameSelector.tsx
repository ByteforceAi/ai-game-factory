'use client';

import { useState } from 'react';
import { DEMO_GAMES, DemoGame } from '@/lib/demoGames';

interface GameSelectorProps {
  onSelect: (game: DemoGame) => void;
}

export default function GameSelector({ onSelect }: GameSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (game: DemoGame) => {
    setSelectedId(game.id);
    setTimeout(() => onSelect(game), 400);
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
      {/* Animated gradient orbs */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '60vw',
        height: '60vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float1 8s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-10%',
        width: '50vw',
        height: '50vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float2 10s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '20%',
        width: '40vw',
        height: '40vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float3 12s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* AI Chat Bubble — frosted glass */}
      <div style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderRadius: '24px',
        padding: '24px 32px',
        marginBottom: '32px',
        maxWidth: '420px',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 8px 32px rgba(139,92,246,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🤖</div>
        <h1 style={{
          color: '#1e1b4b',
          fontSize: '22px',
          fontWeight: 700,
          lineHeight: 1.4,
          margin: 0,
        }}>
          어떤 게임을 만들어볼까요?
        </h1>
        <p style={{
          color: '#6b7280',
          fontSize: '14px',
          marginTop: '8px',
          marginBottom: 0,
        }}>
          아래에서 첫 번째 게임을 선택하세요
        </p>
      </div>

      {/* Game Cards */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        zIndex: 1,
      }}>
        {DEMO_GAMES.map((game) => {
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
                padding: '20px',
                background: isSelected
                  ? `rgba(255,255,255,0.75)`
                  : isHovered
                    ? 'rgba(255,255,255,0.65)'
                    : 'rgba(255,255,255,0.45)',
                border: isSelected
                  ? `2px solid ${game.accentColor}`
                  : '1px solid rgba(255,255,255,0.5)',
                borderRadius: '18px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.3s ease',
                transform: isSelected ? 'scale(0.97)' : isHovered ? 'scale(1.02)' : 'scale(1)',
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                boxShadow: isHovered
                  ? '0 12px 40px rgba(139,92,246,0.12), 0 4px 12px rgba(0,0,0,0.06)'
                  : '0 4px 16px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{
                fontSize: '40px',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${game.accentColor}18`,
                borderRadius: '14px',
                flexShrink: 0,
              }}>
                {game.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  color: '#1e1b4b',
                  fontSize: '17px',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}>
                  {game.title}
                </div>
                <div style={{
                  color: '#6b7280',
                  fontSize: '13px',
                  lineHeight: 1.4,
                }}>
                  {game.description}
                </div>
              </div>
              <div style={{
                color: game.accentColor,
                fontSize: '20px',
                opacity: isHovered || isSelected ? 1 : 0.5,
                transition: 'opacity 0.2s',
              }}>
                ▶
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <p style={{
        color: '#9ca3af',
        fontSize: '12px',
        marginTop: '28px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        게임을 선택하면 AI가 코드를 생성합니다
      </p>

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 20px) scale(1.1); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, -30px) scale(1.05); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15px, -25px) scale(1.08); }
        }
      `}</style>
    </div>
  );
}
