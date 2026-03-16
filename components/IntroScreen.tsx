'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ParticleBackground from './ParticleBackground';
import { initAudio, playWhoosh, playPing, playTick } from '@/lib/sounds';

interface IntroScreenProps {
  onComplete: () => void;
}

/* ═══════════════════════════════════════════════
   Boot sequence steps — shown after "시작하기"
   ═══════════════════════════════════════════════ */
const BOOT_STEPS = [
  { label: 'Neural Engine', status: 'connecting', icon: '🧠' },
  { label: 'Phaser.js Runtime', status: 'loading', icon: '🎮' },
  { label: 'Three.js Renderer', status: 'loading', icon: '🎨' },
  { label: 'WebGL 2.0 Pipeline', status: 'initializing', icon: '⚡' },
  { label: 'Audio Synthesizer', status: 'calibrating', icon: '🔊' },
  { label: 'AI Code Generator', status: 'ready', icon: '✨' },
];

type Phase = 'idle' | 'booting' | 'done';

/* ═══════════════════════════════════════════════
   IntroScreen — GitHub Education bright theme
   ═══════════════════════════════════════════════ */
export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [reveal, setReveal] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [bootStep, setBootStep] = useState(-1);
  const [bootDone, setBootDone] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setMounted(true);
    const delays = [400, 900, 1300, 1700, 2100, 2500];
    const timers = delays.map((ms, i) =>
      setTimeout(() => setReveal(i + 1), ms)
    );
    timersRef.current = timers;
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  /* ── Boot sequence after "시작하기" ── */
  const handleStart = useCallback(() => {
    if (phase !== 'idle') return;
    initAudio();
    playTick();
    setPhase('booting');
    setBootStep(-1);

    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setBootStep(i);
        playPing();
      }, 400 + i * 450));
    });

    const totalTime = 400 + BOOT_STEPS.length * 450 + 600;
    timers.push(setTimeout(() => {
      setBootDone(true);
      playWhoosh();
    }, totalTime));

    timers.push(setTimeout(() => {
      setFadeOut(true);
    }, totalTime + 600));

    timers.push(setTimeout(() => {
      onComplete();
    }, totalTime + 1400));

    timersRef.current.push(...timers);
  }, [phase, onComplete]);

  /* ── Skip: click during boot to jump ahead ── */
  const handleSkip = useCallback(() => {
    if (phase !== 'booting') return;
    timersRef.current.forEach(clearTimeout);
    setBootStep(BOOT_STEPS.length - 1);
    setBootDone(true);
    playWhoosh();
    setTimeout(() => setFadeOut(true), 400);
    setTimeout(() => onComplete(), 1000);
  }, [phase, onComplete]);

  const shown = (step: number) => reveal >= step;

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.8s ease-out',
    }}>
      <ParticleBackground />

      <div style={{
        position: 'relative',
        zIndex: 2,
        width: 'min(480px, 90vw)',
        opacity: mounted && shown(1) ? 1 : 0,
        transform: mounted && shown(1) ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
      }}>
        <div
          onClick={phase === 'booting' ? handleSkip : undefined}
          style={{
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(40px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
            borderRadius: '28px',
            border: '1px solid rgba(255,255,255,0.6)',
            padding: '52px 44px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: phase === 'booting' ? 'pointer' : 'default',
            minHeight: phase === 'booting' ? '380px' : undefined,
            transition: 'min-height 0.5s ease',
          }}
        >
          {/* ═══ Phase: idle — reveal sequence ═══ */}
          {phase === 'idle' && (
            <>
              {/* Badge */}
              <div style={{
                opacity: shown(2) ? 1 : 0,
                transform: shown(2) ? 'translateY(0)' : 'translateY(6px)',
                transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
                marginBottom: '28px',
              }}>
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  padding: '5px 14px',
                  borderRadius: '100px',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
                  border: '1px solid rgba(99,102,241,0.15)',
                  color: '#6366f1',
                }}>
                  CLOSED BETA · BUILD 2026.03
                </span>
              </div>

              {/* Title */}
              <div style={{
                textAlign: 'center',
                opacity: shown(3) ? 1 : 0,
                transform: shown(3) ? 'translateY(0)' : 'translateY(6px)',
                transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
                marginBottom: '28px',
              }}>
                <h1 style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(30px, 6vw, 46px)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                  color: '#1e293b',
                  margin: 0,
                }}>
                  VIBE CODING
                </h1>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '15px',
                  fontWeight: 600,
                  letterSpacing: '0.35em',
                  color: '#6366f1',
                  marginTop: '8px',
                }}>
                  WORKSHOP
                </div>
              </div>

              {/* Divider */}
              <div style={{
                width: shown(4) ? '48px' : '0px',
                height: '2px',
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                borderRadius: '1px',
                transition: 'width 0.4s ease-out',
                marginBottom: '28px',
              }} />

              {/* Description */}
              <div style={{
                textAlign: 'center',
                opacity: shown(5) ? 1 : 0,
                transform: shown(5) ? 'translateY(0)' : 'translateY(6px)',
                transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
                marginBottom: '36px',
              }}>
                <p style={{
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontSize: '16px',
                  fontWeight: 400,
                  color: '#475569',
                  lineHeight: 1.8,
                  margin: 0,
                }}>
                  말로 설명하면 AI가 코드를 작성하고,
                  <br />
                  코드가 현실이 됩니다.
                </p>
              </div>

              {/* Start button */}
              <button
                onClick={handleStart}
                style={{
                  width: '100%',
                  height: '56px',
                  background: shown(6)
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'transparent',
                  border: 'none',
                  borderRadius: '16px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '15px',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  color: '#fff',
                  cursor: shown(6) ? 'pointer' : 'default',
                  opacity: shown(6) ? 1 : 0,
                  transform: shown(6) ? 'translateY(0)' : 'translateY(6px)',
                  transition: 'all 0.5s ease-out',
                  pointerEvents: shown(6) ? 'auto' : 'none',
                  boxShadow: shown(6) ? '0 4px 20px rgba(99,102,241,0.35)' : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!shown(6)) return;
                  e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,0.45)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.35)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                시작하기
              </button>
            </>
          )}

          {/* ═══ Phase: booting — system initialization ═══ */}
          {(phase === 'booting' || phase === 'done') && (
            <div style={{
              width: '100%',
              animation: 'introFadeIn 0.5s ease both',
            }}>
              {/* Mini title */}
              <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  color: '#94a3b8',
                }}>
                  SYSTEM INITIALIZATION
                </span>
              </div>

              {/* Boot steps */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}>
                {BOOT_STEPS.map((step, i) => {
                  const isActive = i <= bootStep;
                  const isCurrent = i === bootStep && !bootDone;
                  const isComplete = i < bootStep || bootDone;

                  return (
                    <div
                      key={step.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        background: isComplete
                          ? 'rgba(99,102,241,0.06)'
                          : isCurrent
                            ? 'rgba(99,102,241,0.04)'
                            : 'transparent',
                        opacity: isActive ? 1 : 0.25,
                        transform: isActive ? 'translateX(0)' : 'translateX(-6px)',
                        transition: 'all 0.4s ease-out',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}>
                        {/* Status indicator */}
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isComplete
                            ? '#10b981'
                            : isCurrent
                              ? '#6366f1'
                              : '#e2e8f0',
                          boxShadow: isComplete
                            ? '0 0 8px rgba(16,185,129,0.4)'
                            : isCurrent
                              ? '0 0 10px rgba(99,102,241,0.4)'
                              : 'none',
                          transition: 'all 0.3s ease',
                          animation: isCurrent ? 'introPulse 1.5s ease-in-out infinite' : 'none',
                        }} />

                        <span style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '14px',
                          fontWeight: 500,
                          color: isActive ? '#1e293b' : '#cbd5e1',
                          transition: 'color 0.3s ease',
                        }}>
                          {step.label}
                        </span>
                      </div>

                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '10px',
                        fontWeight: 500,
                        letterSpacing: '0.05em',
                        color: isComplete
                          ? '#10b981'
                          : isCurrent
                            ? '#6366f1'
                            : '#e2e8f0',
                        transition: 'color 0.3s ease',
                      }}>
                        {isComplete ? '✓ ready' : isCurrent ? step.status : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div style={{
                marginTop: '28px',
                height: '4px',
                background: '#f1f5f9',
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: bootDone
                    ? '100%'
                    : bootStep >= 0
                      ? `${Math.min(100, ((bootStep + 1) / BOOT_STEPS.length) * 100)}%`
                      : '0%',
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  borderRadius: '2px',
                  transition: 'width 0.4s ease-out',
                }} />
              </div>

              {/* Completion message */}
              {bootDone && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '24px',
                  animation: 'introFadeIn 0.4s ease both',
                }}>
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: '#10b981',
                  }}>
                    ✨ ALL SYSTEMS READY
                  </span>
                </div>
              )}

              {/* Skip hint */}
              {!bootDone && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '20px',
                }}>
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '11px',
                    color: '#94a3b8',
                    letterSpacing: '0.05em',
                  }}>
                    탭하여 건너뛰기
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer badges — outside card */}
        {phase === 'idle' && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginTop: '24px',
            opacity: shown(6) ? 0.5 : 0,
            transition: 'opacity 0.5s ease-out 0.2s',
          }}>
            {['ONLINE', 'PHASER.JS', 'THREE.JS', 'WEBGL 2.0'].map((label, i) => (
              <div key={label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: '100px',
              }}>
                {i === 0 && <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#10b981',
                }} />}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  fontWeight: 500,
                  color: i === 0 ? '#10b981' : '#64748b',
                  letterSpacing: '0.08em',
                }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Version */}
        {phase === 'idle' && (
          <div style={{
            textAlign: 'center',
            marginTop: '12px',
            opacity: shown(6) ? 0.35 : 0,
            transition: 'opacity 0.5s ease-out 0.3s',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: '#64748b',
              letterSpacing: '0.08em',
            }}>
              AI GAME FACTORY — PROTOTYPE v0.4.0
            </span>
          </div>
        )}
      </div>

      {/* ═══ Keyframes ═══ */}
      <style>{`
        @keyframes introFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes introPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(99,102,241,0.3); }
          50%      { opacity: 0.5; box-shadow: 0 0 14px rgba(99,102,241,0.5); }
        }
      `}</style>
    </div>
  );
}
