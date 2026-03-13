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
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    }}>
      {/* AI Chat Bubble */}
      <div style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '20px 28px',
        marginBottom: '32px',
        maxWidth: '420px',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.12)',
      }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🤖</div>
        <h1 style={{
          color: '#fff',
          fontSize: '22px',
          fontWeight: 700,
          lineHeight: 1.4,
          margin: 0,
        }}>
          어떤 게임을 만들어볼까요?
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '14px',
          marginTop: '8px',
        }}>
          아래에서 첫 번째 게임을 선택하세요
        </p>
      </div>

      {/* Game Cards */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '420px',
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
                  ? `linear-gradient(135deg, ${game.accentColor}33, ${game.accentColor}11)`
                  : isHovered
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(255,255,255,0.06)',
                border: isSelected
                  ? `2px solid ${game.accentColor}`
                  : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.3s ease',
                transform: isSelected ? 'scale(0.97)' : isHovered ? 'scale(1.02)' : 'scale(1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{
                fontSize: '40px',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${game.accentColor}22`,
                borderRadius: '14px',
                flexShrink: 0,
              }}>
                {game.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  color: '#fff',
                  fontSize: '17px',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}>
                  {game.title}
                </div>
                <div style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '13px',
                  lineHeight: 1.4,
                }}>
                  {game.description}
                </div>
              </div>
              <div style={{
                color: game.accentColor,
                fontSize: '20px',
                opacity: isHovered || isSelected ? 1 : 0.4,
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
        color: 'rgba(255,255,255,0.3)',
        fontSize: '12px',
        marginTop: '28px',
        textAlign: 'center',
      }}>
        게임을 선택하면 AI가 코드를 생성합니다
      </p>
    </div>
  );
}
