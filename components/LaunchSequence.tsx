'use client';

import { useState, useEffect } from 'react';
import { playPing, playComplete, playWhoosh } from '@/lib/sounds';

interface LaunchSequenceProps {
  gameTitle: string;
  onComplete: () => void;
}

/**
 * 3...2...1...PLAY! countdown between code generation and game start.
 * Builds anticipation and gives a clear "wow moment" transition.
 */
export default function LaunchSequence({ gameTitle, onComplete }: LaunchSequenceProps) {
  const [count, setCount] = useState(3);
  const [phase, setPhase] = useState<'countdown' | 'play' | 'zoom'>('countdown');

  useEffect(() => {
    playPing();

    const t2 = setTimeout(() => { setCount(2); playPing(); }, 800);
    const t1 = setTimeout(() => { setCount(1); playPing(); }, 1600);
    const tPlay = setTimeout(() => {
      setPhase('play');
      playComplete();
    }, 2400);
    const tZoom = setTimeout(() => {
      setPhase('zoom');
      playWhoosh();
    }, 3200);
    const tDone = setTimeout(() => {
      onComplete();
    }, 3800);

    return () => {
      clearTimeout(t2);
      clearTimeout(t1);
      clearTimeout(tPlay);
      clearTimeout(tZoom);
      clearTimeout(tDone);
    };
  }, [onComplete]);

  return (
    <div style={{
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
    }}>
      {/* Radial pulse rings */}
      {phase === 'countdown' && (
        <>
          <div style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            border: '1px solid rgba(99,102,241,0.15)',
            animation: 'launchPulse 0.8s ease-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            border: '1px solid rgba(99,102,241,0.1)',
            animation: 'launchPulse 0.8s ease-out 0.2s infinite',
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
      {phase === 'countdown' && (
        <div
          key={count}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 'clamp(72px, 20vw, 120px)',
            fontWeight: 700,
            color: 'var(--text-bright)',
            lineHeight: 1,
            textShadow: '0 0 60px rgba(99,102,241,0.4), 0 0 120px rgba(99,102,241,0.15)',
            animation: 'countPop 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {count}
        </div>
      )}

      {/* PLAY! text */}
      {phase === 'play' && (
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
      )}

      {/* Subtitle */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '9px',
        letterSpacing: '0.15em',
        color: 'rgba(255,255,255,0.2)',
        marginTop: '32px',
      }}>
        {phase === 'countdown' ? 'INITIALIZING GAME ENGINE...' : 'CODE → REALITY'}
      </div>

      <style>{`
        @keyframes launchPulse {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes countPop {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
