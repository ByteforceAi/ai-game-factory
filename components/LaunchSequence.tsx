'use client';

import { useState, useCallback } from 'react';
import { playPing, playComplete, playWhoosh } from '@/lib/sounds';

interface LaunchSequenceProps {
  gameTitle: string;
  onComplete: () => void;
}

/**
 * Interactive 3-tap launch ritual.
 * User taps 3 times → PLAY! → zoom into game.
 * Each tap triggers sound + haptic + visual pulse for maximum "I did this" feeling.
 */
export default function LaunchSequence({ gameTitle, onComplete }: LaunchSequenceProps) {
  const [tapsLeft, setTapsLeft] = useState(3);
  const [phase, setPhase] = useState<'waiting' | 'play' | 'zoom'>('waiting');
  const [ripple, setRipple] = useState(false);

  const handleTap = useCallback(() => {
    if (phase !== 'waiting') return;

    // Haptic feedback on mobile
    if (navigator.vibrate) navigator.vibrate(30);

    // Visual ripple
    setRipple(true);
    setTimeout(() => setRipple(false), 400);

    playPing();

    const next = tapsLeft - 1;
    setTapsLeft(next);

    if (next <= 0) {
      // All taps done → PLAY!
      setTimeout(() => {
        setPhase('play');
        playComplete();
        if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
      }, 300);

      setTimeout(() => {
        setPhase('zoom');
        playWhoosh();
      }, 1200);

      setTimeout(() => {
        onComplete();
      }, 1800);
    }
  }, [phase, tapsLeft, onComplete]);

  const displayNumber = tapsLeft;
  const progress = 3 - tapsLeft; // 0, 1, 2, 3

  const tapMessages = [
    '화면을 터치하세요',
    '좋아요! 에너지 충전 중... ⚡',
    '거의 다 됐어요! 한 번만 더! 🔥',
  ];

  return (
    <div
      onClick={handleTap}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, rgba(15,15,35,0.98) 0%, rgba(2,2,8,1) 100%)',
        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: phase === 'zoom' ? 0 : 1,
        transform: phase === 'zoom' ? 'scale(1.3)' : 'scale(1)',
        cursor: phase === 'waiting' ? 'pointer' : 'default',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Tap ripple effect */}
      {ripple && (
        <div style={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          border: '2px solid rgba(99,102,241,0.5)',
          animation: 'tapRipple 0.5s ease-out forwards',
        }} />
      )}

      {/* Progress rings — fills as you tap */}
      {phase === 'waiting' && (
        <>
          <div style={{
            position: 'absolute',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            border: `2px solid rgba(99,102,241,${progress >= 1 ? 0.4 : 0.08})`,
            transition: 'all 0.4s ease-out',
            transform: progress >= 1 ? 'scale(1)' : 'scale(0.95)',
          }} />
          <div style={{
            position: 'absolute',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            border: `2px solid rgba(99,102,241,${progress >= 2 ? 0.5 : 0.06})`,
            transition: 'all 0.4s ease-out',
            transform: progress >= 2 ? 'scale(1)' : 'scale(0.95)',
          }} />
          <div style={{
            position: 'absolute',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            border: `2px solid rgba(99,102,241,${progress >= 3 ? 0.6 : 0.04})`,
            transition: 'all 0.4s ease-out',
            transform: progress >= 3 ? 'scale(1)' : 'scale(0.95)',
          }} />
        </>
      )}

      {/* Game title - small */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '10px',
        fontWeight: 500,
        letterSpacing: '0.2em',
        color: 'rgba(99,102,241,0.5)',
        marginBottom: '24px',
        textTransform: 'uppercase',
      }}>
        {gameTitle}
      </div>

      {/* Countdown number */}
      {phase === 'waiting' && (
        <div
          key={displayNumber}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 'clamp(72px, 20vw, 120px)',
            fontWeight: 700,
            color: 'var(--text-bright)',
            lineHeight: 1,
            textShadow: `0 0 ${30 + progress * 20}px rgba(99,102,241,${0.2 + progress * 0.15}), 0 0 ${60 + progress * 30}px rgba(99,102,241,0.1)`,
            animation: 'countPop 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {displayNumber}
        </div>
      )}

      {/* PLAY! text */}
      {phase === 'play' && (
        <>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 'clamp(48px, 15vw, 80px)',
            fontWeight: 700,
            letterSpacing: '0.15em',
            background: 'linear-gradient(135deg, #6366f1, #a855f7, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'countPop 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: 'drop-shadow(0 0 40px rgba(99,102,241,0.5))',
          }}>
            PLAY!
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            color: 'rgba(255,255,255,0.5)',
            marginTop: '16px',
            animation: 'fadeSlideIn 0.3s ease 0.2s both',
          }}>
            당신의 게임이 완성됐어요! 🎉
          </div>
        </>
      )}

      {/* AI Companion bubble during taps */}
      {phase === 'waiting' && progress > 0 && (
        <div
          key={progress}
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            marginTop: '30px',
            animation: 'companionSlide 0.3s ease both',
          }}
        >
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            AI
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            color: 'rgba(255,255,255,0.7)',
          }}>
            {tapMessages[progress]}
          </span>
        </div>
      )}

      {/* Instruction / subtitle */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: phase === 'waiting' ? '12px' : '9px',
        letterSpacing: '0.15em',
        color: phase === 'waiting' ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.2)',
        marginTop: phase === 'waiting' && progress > 0 ? '16px' : phase === 'waiting' ? '40px' : '32px',
        transition: 'all 0.3s',
        animation: phase === 'waiting' ? 'tapHint 1.5s ease-in-out infinite' : 'none',
      }}>
        {phase === 'waiting'
          ? tapMessages[0]
          : 'CODE → REALITY'}
      </div>

      {/* Tap progress dots */}
      {phase === 'waiting' && (
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '20px',
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: i < progress
                  ? 'rgba(99,102,241,0.8)'
                  : 'rgba(99,102,241,0.15)',
                transition: 'all 0.3s ease-out',
                transform: i < progress ? 'scale(1.2)' : 'scale(1)',
                boxShadow: i < progress ? '0 0 12px rgba(99,102,241,0.5)' : 'none',
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes tapRipple {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes countPop {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes tapHint {
          0%, 100% { opacity: 0.6; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes companionSlide {
          0% { opacity: 0; transform: translateY(12px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
