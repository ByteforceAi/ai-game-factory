'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { initAudio, playWhoosh, playPing, playTick } from '@/lib/sounds';

interface IntroScreenProps {
  onComplete: () => void;
}

const BOOT_STEPS = [
  { label: 'Neural Engine', status: 'connecting', icon: '🧠' },
  { label: 'Phaser.js Runtime', status: 'loading', icon: '🎮' },
  { label: 'Three.js Renderer', status: 'loading', icon: '🎨' },
  { label: 'WebGL 2.0 Pipeline', status: 'initializing', icon: '⚡' },
  { label: 'Audio Synthesizer', status: 'calibrating', icon: '🔊' },
  { label: 'AI Code Generator', status: 'ready', icon: '✨' },
];

type Phase = 'idle' | 'booting' | 'done';

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
    const delays = [300, 700, 1000, 1300, 1600, 1900];
    const timers = delays.map((ms, i) => setTimeout(() => setReveal(i + 1), ms));
    timersRef.current = timers;
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const handleStart = useCallback(() => {
    if (phase !== 'idle') return;
    initAudio();
    playTick();
    setPhase('booting');
    setBootStep(-1);

    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => { setBootStep(i); playPing(); }, 400 + i * 400));
    });
    const totalTime = 400 + BOOT_STEPS.length * 400 + 500;
    timers.push(setTimeout(() => { setBootDone(true); playWhoosh(); }, totalTime));
    timers.push(setTimeout(() => setFadeOut(true), totalTime + 500));
    timers.push(setTimeout(() => onComplete(), totalTime + 1200));
    timersRef.current.push(...timers);
  }, [phase, onComplete]);

  const handleSkip = useCallback(() => {
    if (phase !== 'booting') return;
    timersRef.current.forEach(clearTimeout);
    setBootStep(BOOT_STEPS.length - 1);
    setBootDone(true);
    playWhoosh();
    setTimeout(() => setFadeOut(true), 300);
    setTimeout(() => onComplete(), 800);
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
      background: 'linear-gradient(180deg, #0A0A1A 0%, #111125 40%, #1A1A2E 100%)',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.8s ease-out',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(0,122,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 2,
        width: 'min(440px, 88vw)',
        opacity: mounted && shown(1) ? 1 : 0,
        transform: mounted && shown(1) ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
      }}>
        <div
          onClick={phase === 'booting' ? handleSkip : undefined}
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(40px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.2)',
            borderRadius: '28px',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '48px 40px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.3), 0 0 80px rgba(0,122,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: phase === 'booting' ? 'pointer' : 'default',
            minHeight: phase === 'booting' ? '380px' : undefined,
            transition: 'min-height 0.5s ease',
          }}
        >
          {phase === 'idle' && (
            <>
              {/* Badge */}
              <div style={{
                opacity: shown(2) ? 1 : 0,
                transform: shown(2) ? 'translateY(0)' : 'translateY(6px)',
                transition: 'all 0.4s ease-out',
                marginBottom: '28px',
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  padding: '5px 14px',
                  borderRadius: '100px',
                  background: 'rgba(0,122,255,0.12)',
                  border: '1px solid rgba(0,122,255,0.2)',
                  color: '#5AC8FA',
                }}>
                  CLOSED BETA · BUILD 2026.03
                </span>
              </div>

              {/* Logo + Title */}
              <div style={{
                textAlign: 'center',
                opacity: shown(3) ? 1 : 0,
                transform: shown(3) ? 'translateY(0)' : 'translateY(6px)',
                transition: 'all 0.5s ease-out',
                marginBottom: '28px',
              }}>
                {/* Logo icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 4px 20px rgba(0,122,255,0.35)',
                }}>
                  <span style={{ fontSize: '24px', color: '#fff' }}>✦</span>
                </div>

                <h1 style={{
                  fontSize: 'clamp(28px, 6vw, 42px)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                  color: '#F5F5F7',
                  margin: 0,
                }}>
                  Vibe Coding
                </h1>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  letterSpacing: '0.3em',
                  color: 'rgba(0,122,255,0.7)',
                  marginTop: '8px',
                  textTransform: 'uppercase',
                }}>
                  Workshop
                </div>
              </div>

              {/* Divider */}
              <div style={{
                width: shown(4) ? '48px' : '0px',
                height: '2px',
                background: '#007AFF',
                borderRadius: '1px',
                transition: 'width 0.4s ease-out',
                marginBottom: '28px',
              }} />

              {/* Description */}
              <div style={{
                textAlign: 'center',
                opacity: shown(5) ? 1 : 0,
                transform: shown(5) ? 'translateY(0)' : 'translateY(6px)',
                transition: 'all 0.5s ease-out',
                marginBottom: '36px',
              }}>
                <p style={{
                  fontSize: '16px',
                  fontWeight: 400,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  margin: 0,
                  letterSpacing: '-0.3px',
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
                  background: shown(6) ? '#007AFF' : 'transparent',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '15px',
                  fontWeight: 600,
                  letterSpacing: '-0.2px',
                  color: '#fff',
                  cursor: shown(6) ? 'pointer' : 'default',
                  opacity: shown(6) ? 1 : 0,
                  transform: shown(6) ? 'translateY(0)' : 'translateY(6px)',
                  transition: 'all 0.5s ease-out',
                  pointerEvents: shown(6) ? 'auto' : 'none',
                  boxShadow: shown(6) ? '0 4px 20px rgba(0,122,255,0.35)' : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!shown(6)) return;
                  e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,122,255,0.45)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,122,255,0.35)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                시작하기
              </button>
            </>
          )}

          {(phase === 'booting' || phase === 'done') && (
            <div style={{ width: '100%', animation: 'introFadeIn 0.5s ease both' }}>
              <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  color: 'var(--text-tertiary)',
                }}>
                  SYSTEM INITIALIZATION
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {BOOT_STEPS.map((step, i) => {
                  const isActive = i <= bootStep;
                  const isCurrent = i === bootStep && !bootDone;
                  const isComplete = i < bootStep || bootDone;

                  return (
                    <div key={step.label} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      background: isComplete ? 'rgba(0,122,255,0.06)' : isCurrent ? 'rgba(0,122,255,0.03)' : 'transparent',
                      opacity: isActive ? 1 : 0.3,
                      transform: isActive ? 'translateX(0)' : 'translateX(-6px)',
                      transition: 'all 0.4s ease-out',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isComplete ? '#34C759' : isCurrent ? '#007AFF' : 'var(--text-dim)',
                          boxShadow: isComplete ? '0 0 8px rgba(52,199,89,0.4)' : isCurrent ? '0 0 10px rgba(0,122,255,0.4)' : 'none',
                          transition: 'all 0.3s ease',
                          animation: isCurrent ? 'introPulse 1.5s ease-in-out infinite' : 'none',
                        }} />
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: isActive ? 'var(--text-primary)' : 'var(--text-dim)',
                          transition: 'color 0.3s ease',
                          letterSpacing: '-0.2px',
                        }}>
                          {step.label}
                        </span>
                      </div>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '10px',
                        fontWeight: 500,
                        letterSpacing: '0.05em',
                        color: isComplete ? '#34C759' : isCurrent ? '#007AFF' : 'var(--text-dim)',
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
                height: '3px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: bootDone ? '100%' : bootStep >= 0 ? `${Math.min(100, ((bootStep + 1) / BOOT_STEPS.length) * 100)}%` : '0%',
                  background: 'linear-gradient(90deg, #007AFF, #5AC8FA)',
                  borderRadius: '2px',
                  transition: 'width 0.4s ease-out',
                  boxShadow: '0 0 8px rgba(0,122,255,0.4)',
                }} />
              </div>

              {bootDone && (
                <div style={{ textAlign: 'center', marginTop: '24px', animation: 'introFadeIn 0.4s ease both' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', color: '#34C759' }}>
                    ✨ ALL SYSTEMS READY
                  </span>
                </div>
              )}

              {!bootDone && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
                    탭하여 건너뛰기
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer badges */}
        {phase === 'idle' && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginTop: '24px',
            opacity: shown(6) ? 0.4 : 0,
            transition: 'opacity 0.5s ease-out 0.2s',
          }}>
            {['ONLINE', 'PHASER.JS', 'THREE.JS', 'WEBGL 2.0'].map((label, i) => (
              <div key={label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '100px',
              }}>
                {i === 0 && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34C759' }} />}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  fontWeight: 500,
                  color: i === 0 ? '#34C759' : 'var(--text-tertiary)',
                  letterSpacing: '0.08em',
                }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {phase === 'idle' && (
          <div style={{
            textAlign: 'center',
            marginTop: '12px',
            opacity: shown(6) ? 0.25 : 0,
            transition: 'opacity 0.5s ease-out 0.3s',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: 'var(--text-dim)',
              letterSpacing: '0.08em',
            }}>
              AI GAME FACTORY — PROTOTYPE v0.4.0
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes introFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes introPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(0,122,255,0.3); }
          50%      { opacity: 0.5; box-shadow: 0 0 14px rgba(0,122,255,0.5); }
        }
      `}</style>
    </div>
  );
}
