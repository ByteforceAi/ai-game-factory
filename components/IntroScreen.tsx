'use client';

import { useState, useEffect, useCallback } from 'react';
import ParticleBackground from './ParticleBackground';

interface IntroScreenProps {
  onComplete: () => void;
}

const BOOT_LINES = [
  { text: 'NEURAL ENGINE v4.0', delay: 0 },
  { text: 'Initializing core modules...', delay: 200 },
  { text: 'Loading Phaser.js 3.80 runtime ✓', delay: 600 },
  { text: 'Loading Three.js r168 renderer ✓', delay: 900 },
  { text: 'WebGL 2.0 context acquired ✓', delay: 1200 },
  { text: 'Physics engine: Arcade ✓', delay: 1500 },
  { text: 'Touch input handler: ready ✓', delay: 1700 },
  { text: 'AI code generation pipeline: online ✓', delay: 2000 },
  { text: '', delay: 2300 },
  { text: 'All systems operational.', delay: 2400 },
  { text: 'VIBE CODING SIMULATOR — READY', delay: 2800 },
];

type Phase = 'idle' | 'booting' | 'transitioning';

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleStart = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('booting');

    // Show boot lines one by one
    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => {
        setVisibleLines(i + 1);
      }, line.delay);
    });

    // After all lines shown, start transition
    const lastDelay = BOOT_LINES[BOOT_LINES.length - 1].delay;
    setTimeout(() => {
      setPhase('transitioning');
      setFadeOut(true);
      setTimeout(() => onComplete(), 800);
    }, lastDelay + 600);
  }, [phase, onComplete]);

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: '#050510',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.8s ease-out',
    }}>
      <ParticleBackground />

      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Phase: idle — Show logo + start button */}
        {phase === 'idle' && (
          <>
            {/* Subtle top label */}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(99,102,241,0.5)',
            }}>
              AI-POWERED GAME DEVELOPMENT
            </span>

            {/* Main title */}
            <div style={{ textAlign: 'center' }}>
              <h1 style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 'clamp(28px, 6vw, 44px)',
                fontWeight: 700,
                letterSpacing: '0.15em',
                lineHeight: 1.2,
                color: 'var(--text-bright)',
                margin: 0,
                textShadow: '0 0 40px rgba(99,102,241,0.2), 0 0 80px rgba(99,102,241,0.08)',
              }}>
                VIBE CODING
              </h1>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 'clamp(12px, 2.5vw, 16px)',
                fontWeight: 300,
                letterSpacing: '0.4em',
                color: 'rgba(255,255,255,0.25)',
                marginTop: '8px',
              }}>
                SIMULATOR
              </div>
            </div>

            {/* Shimmer line */}
            <div className="shimmer-line" style={{ width: '120px' }} />

            {/* Start button — the main CTA */}
            <button
              onClick={handleStart}
              style={{
                background: 'transparent',
                border: '1px solid rgba(99,102,241,0.3)',
                color: 'rgba(255,255,255,0.7)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.2em',
                padding: '14px 48px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden',
                marginTop: '20px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.95)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(99,102,241,0.15), 0 0 60px rgba(99,102,241,0.05)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              START
            </button>

            {/* Subtle hint */}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: 'rgba(255,255,255,0.12)',
              letterSpacing: '0.08em',
              marginTop: '-20px',
            }}>
              press to initialize
            </span>
          </>
        )}

        {/* Phase: booting — Terminal boot sequence */}
        {(phase === 'booting' || phase === 'transitioning') && (
          <div style={{
            width: 'min(440px, 90vw)',
            background: 'rgba(5,5,16,0.8)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}>
            {/* Terminal header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#febc2e' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#28c840' }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: 'rgba(255,255,255,0.2)',
                marginLeft: '12px',
                letterSpacing: '0.05em',
              }}>
                system boot
              </span>
            </div>

            {/* Boot lines */}
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              lineHeight: 1.9,
              minHeight: '240px',
            }}>
              {BOOT_LINES.slice(0, visibleLines).map((line, i) => {
                const isLast = i === visibleLines - 1;
                const isReady = line.text.includes('READY');
                const hasCheck = line.text.includes('✓');

                if (line.text === '') return <div key={i} style={{ height: '12px' }} />;

                return (
                  <div
                    key={i}
                    style={{
                      color: isReady
                        ? 'var(--ai-emerald)'
                        : hasCheck
                          ? 'rgba(255,255,255,0.5)'
                          : i === 0
                            ? 'var(--ai-indigo)'
                            : 'rgba(255,255,255,0.3)',
                      opacity: isLast ? 1 : 0.8,
                      animation: isLast ? 'fadeSlideIn 0.3s ease-out' : undefined,
                      textShadow: isReady ? '0 0 20px rgba(16,185,129,0.4)' : undefined,
                      fontWeight: isReady || i === 0 ? 600 : 400,
                    }}
                  >
                    {!isReady && !hasCheck && i > 0 && (
                      <span style={{ color: 'rgba(99,102,241,0.4)', marginRight: '8px' }}>{'>'}</span>
                    )}
                    {hasCheck ? (
                      <>
                        <span>{line.text.replace(' ✓', '')}</span>
                        <span style={{ color: 'var(--ai-emerald)', marginLeft: '8px' }}>✓</span>
                      </>
                    ) : (
                      line.text
                    )}
                    {isLast && phase === 'booting' && (
                      <span style={{
                        display: 'inline-block',
                        width: '7px',
                        height: '14px',
                        background: 'var(--ai-indigo)',
                        animation: 'blink 0.6s ease-in-out infinite',
                        marginLeft: '4px',
                        verticalAlign: 'middle',
                        borderRadius: '1px',
                      }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress bar at bottom */}
            {phase === 'booting' && (
              <div style={{
                marginTop: '16px',
                height: '2px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '1px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round((visibleLines / BOOT_LINES.length) * 100)}%`,
                  background: 'linear-gradient(90deg, var(--ai-indigo), var(--ai-violet), var(--ai-cyan))',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer-bar 2s linear infinite',
                  transition: 'width 0.3s ease',
                  borderRadius: '1px',
                }} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom version label */}
      {phase === 'idle' && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px',
          color: 'rgba(255,255,255,0.08)',
          letterSpacing: '0.1em',
          zIndex: 2,
        }}>
          v4.0 — AI GAME FACTORY
        </div>
      )}
    </div>
  );
}
