'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ParticleBackground from './ParticleBackground';
import { initAudio, playWhoosh } from '@/lib/sounds';

interface IntroScreenProps {
  onComplete: () => void;
}

/* ═══════════════════════════════════════════════
   IntroScreen — "이건 진짜 프로덕트다" 첫인상
   ═══════════════════════════════════════════════ */
export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const [mounted, setMounted] = useState(false);
  /* Sequential reveal steps (staggered fade-in) */
  const [reveal, setReveal] = useState(0); // 0=nothing, 1=card, 2=badge, 3=title, 4=line, 5=desc, 6=button
  const [fadeOut, setFadeOut] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setMounted(true);

    /* Staggered reveal animation — total ~3.6s */
    const delays = [500, 1300, 1700, 2200, 2600, 3100];
    const timers = delays.map((ms, i) =>
      setTimeout(() => setReveal(i + 1), ms)
    );
    timersRef.current = timers;

    return () => timers.forEach(clearTimeout);
  }, []);

  const handleStart = useCallback(() => {
    initAudio();
    playWhoosh();
    setFadeOut(true);
    const t = setTimeout(() => onComplete(), 800);
    timersRef.current.push(t);
  }, [onComplete]);

  /* Reveal helper */
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

      {/* ═══ Central frost-glass card ═══ */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: 'min(480px, 90vw)',
        opacity: mounted && shown(1) ? 1 : 0,
        transform: mounted && shown(1) ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
      }}>
        <div style={{
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
        }}>

          {/* 1. Badge */}
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

          {/* 2. Title */}
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

          {/* 3. Divider */}
          <div style={{
            width: shown(4) ? '48px' : '0px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.3), transparent)',
            transition: 'width 0.4s ease-out',
            marginBottom: '32px',
          }} />

          {/* 4. Description */}
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

          {/* 5. Start button */}
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
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            시작하기
          </button>
        </div>

        {/* Footer badges — outside card, very quiet */}
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

        {/* Version — very quiet */}
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
      </div>
    </div>
  );
}
