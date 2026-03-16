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
  { label: 'Neural Engine', status: 'connecting' },
  { label: 'Phaser.js Runtime', status: 'loading' },
  { label: 'Three.js Renderer', status: 'loading' },
  { label: 'WebGL 2.0 Pipeline', status: 'initializing' },
  { label: 'Audio Synthesizer', status: 'calibrating' },
  { label: 'AI Code Generator', status: 'ready' },
];

type Phase = 'idle' | 'booting' | 'done';

/* ═══════════════════════════════════════════════
   IntroScreen — "이건 진짜 프로덕트다" 첫인상
   ═══════════════════════════════════════════════ */
export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [reveal, setReveal] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [bootStep, setBootStep] = useState(-1);
  const [bootDone, setBbootDone] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setMounted(true);
    const delays = [500, 1300, 1700, 2200, 2600, 3100];
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

    // Each step reveals after a staggered delay
    BOOT_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setBootStep(i);
        playPing();
      }, 400 + i * 450));
    });

    // All done
    const totalTime = 400 + BOOT_STEPS.length * 450 + 600;
    timers.push(setTimeout(() => {
      setBbootDone(true);
      playWhoosh();
    }, totalTime));

    // Fade out and transition
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
    setBbootDone(true);
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
      background: '#050510',
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
            background: 'rgba(10,10,20,0.6)',
            backdropFilter: 'blur(48px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(48px) saturate(1.2)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '48px 40px',
            boxShadow: '0 0 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
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
                marginBottom: '32px',
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 400,
                  letterSpacing: '0.08em',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.4)',
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
                marginBottom: '32px',
              }}>
                <h1 style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 'clamp(28px, 6vw, 44px)',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  lineHeight: 1.2,
                  color: '#f0f0f5',
                  margin: 0,
                  textShadow: '0 0 40px rgba(99,102,241,0.15)',
                }}>
                  VIBE CODING
                </h1>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                  fontWeight: 400,
                  letterSpacing: '8px',
                  color: 'rgba(0,229,255,0.6)',
                  marginTop: '10px',
                }}>
                  WORKSHOP
                </div>
              </div>

              {/* Divider */}
              <div style={{
                width: shown(4) ? '48px' : '0px',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.3), transparent)',
                transition: 'width 0.4s ease-out',
                marginBottom: '32px',
              }} />

              {/* Description */}
              <div style={{
                textAlign: 'center',
                opacity: shown(5) ? 1 : 0,
                transform: shown(5) ? 'translateY(0)' : 'translateY(6px)',
                transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
                marginBottom: '40px',
              }}>
                <p style={{
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontSize: '15px',
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.6)',
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
                  height: '52px',
                  background: shown(6) ? 'rgba(0,229,255,0.1)' : 'transparent',
                  border: `1px solid ${shown(6) ? 'rgba(0,229,255,0.25)' : 'transparent'}`,
                  borderRadius: '14px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                  fontWeight: 500,
                  letterSpacing: '4px',
                  color: '#00E5FF',
                  cursor: shown(6) ? 'pointer' : 'default',
                  opacity: shown(6) ? 1 : 0,
                  transform: shown(6) ? 'translateY(0)' : 'translateY(6px)',
                  transition: 'all 0.5s ease-out',
                  pointerEvents: shown(6) ? 'auto' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!shown(6)) return;
                  e.currentTarget.style.background = 'rgba(0,229,255,0.15)';
                  e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)';
                  e.currentTarget.style.boxShadow = '0 0 24px rgba(0,229,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,229,255,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(0,229,255,0.25)';
                  e.currentTarget.style.boxShadow = 'none';
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
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 400,
                  letterSpacing: '0.15em',
                  color: 'rgba(255,255,255,0.35)',
                }}>
                  SYSTEM INITIALIZATION
                </span>
              </div>

              {/* Boot steps */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
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
                        opacity: isActive ? 1 : 0.15,
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
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: isComplete
                            ? '#00E5FF'
                            : isCurrent
                              ? '#00E5FF'
                              : 'rgba(255,255,255,0.15)',
                          boxShadow: isComplete
                            ? '0 0 8px rgba(0,229,255,0.4)'
                            : isCurrent
                              ? '0 0 12px rgba(0,229,255,0.6)'
                              : 'none',
                          transition: 'all 0.3s ease',
                          animation: isCurrent ? 'introPulse 1.5s ease-in-out infinite' : 'none',
                        }} />

                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '13px',
                          fontWeight: 400,
                          color: isActive ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)',
                          transition: 'color 0.3s ease',
                        }}>
                          {step.label}
                        </span>
                      </div>

                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '10px',
                        fontWeight: 400,
                        letterSpacing: '0.05em',
                        color: isComplete
                          ? 'rgba(0,229,255,0.7)'
                          : isCurrent
                            ? 'rgba(255,255,255,0.4)'
                            : 'rgba(255,255,255,0.1)',
                        transition: 'color 0.3s ease',
                      }}>
                        {isComplete ? 'ready' : isCurrent ? step.status : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div style={{
                marginTop: '32px',
                height: '2px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '1px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: bootDone
                    ? '100%'
                    : bootStep >= 0
                      ? `${Math.min(100, ((bootStep + 1) / BOOT_STEPS.length) * 100)}%`
                      : '0%',
                  background: 'linear-gradient(90deg, #00E5FF, #8b5cf6)',
                  borderRadius: '1px',
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
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '12px',
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    color: '#00E5FF',
                    textShadow: '0 0 16px rgba(0,229,255,0.3)',
                  }}>
                    ALL SYSTEMS READY
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
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '9px',
                    color: 'rgba(255,255,255,0.15)',
                    letterSpacing: '0.08em',
                  }}>
                    TAP TO SKIP
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
            opacity: shown(6) ? 0.2 : 0,
            transition: 'opacity 0.5s ease-out 0.2s',
          }}>
            {['ONLINE', 'PHASER.JS', 'THREE.JS', 'WEBGL 2.0'].map((label, i) => (
              <div key={label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '100px',
              }}>
                {i === 0 && <span style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: '#22c55e',
                }} />}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '7px',
                  color: i === 0 ? '#22c55e' : 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.1em',
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
            opacity: shown(6) ? 0.15 : 0,
            transition: 'opacity 0.5s ease-out 0.3s',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '7px',
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.1em',
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
          0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(0,229,255,0.4); }
          50%      { opacity: 0.5; box-shadow: 0 0 16px rgba(0,229,255,0.7); }
        }
      `}</style>
    </div>
  );
}
