'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface OnboardingProps {
  onSubmit: (name: string) => void;
}

type Stage = 'launch' | 'boot' | 'login';

const BOOT_LINES = [
  '> initializing vibe engine...',
  '> loading neural context [200K tokens]',
  '> code sandbox connecting...',
  '> arena modules ready',
  '> playground online ✓',
];

export default function Onboarding({ onSubmit }: OnboardingProps) {
  const [stage, setStage] = useState<Stage>('launch');
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [sparkExplode, setSparkExplode] = useState(false);
  const [name, setName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const launched = useRef(false);

  // ── Launch → Boot (longer, with terminal text) → Login ──
  const launch = useCallback(() => {
    if (launched.current) return;
    launched.current = true;
    setStage('boot');

    // Terminal boot lines — 500ms apart
    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => setBootLines(prev => [...prev, line]), 600 + i * 500);
    });

    // Core spark explosion → Login (total ~4s boot)
    setTimeout(() => {
      setSparkExplode(true);
      setTimeout(() => {
        setStage('login');
        setTimeout(() => inputRef.current?.focus(), 300);
      }, 600);
    }, 600 + BOOT_LINES.length * 500 + 400);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && stage === 'launch') launch();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [stage, launch]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) { inputRef.current?.focus(); return; }
    setFadeOut(true);
    setTimeout(() => onSubmit(trimmed), 600);
  };

  return (
    <div
      className={`fixed inset-0 z-[1000] transition-all duration-[600ms] ${
        fadeOut ? 'opacity-0 scale-[1.02] pointer-events-none' : ''
      }`}
      style={{ background: '#0a0a0a' }}
    >
      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Green ambient glow — rises from bottom */}
        <div
          className="absolute left-1/2 animate-[ambientBreath_6s_ease-in-out_infinite]"
          style={{
            bottom: '-20%',
            transform: 'translateX(-50%)',
            width: 800,
            height: 500,
            background: 'radial-gradient(ellipse, rgba(34,197,94,0.06) 0%, transparent 70%)',
          }}
        />
        {/* Noise texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            opacity: 0.03,
          }}
        />
      </div>

      {/* ═══ STAGE: LAUNCH ═══ */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer z-10 transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
          stage !== 'launch' ? 'opacity-0 scale-[1.03] blur-[12px] pointer-events-none' : ''
        }`}
        onClick={launch}
      >
        {/* Cursor block logo */}
        <div className="flex items-center gap-[3px] mb-12">
          <div
            className="w-5 h-7 rounded-[2px] animate-[cursorGlow_2s_ease-in-out_infinite]"
            style={{
              background: '#22c55e',
              boxShadow: '0 0 20px rgba(34,197,94,0.3), 0 0 40px rgba(34,197,94,0.1)',
            }}
          />
        </div>

        <div
          className="text-[2.4rem] font-semibold tracking-tight mb-2.5"
          style={{ fontFamily: "'Space Grotesk', 'Noto Sans KR', sans-serif" }}
        >
          바이브<span style={{ color: '#22c55e' }}>코딩</span>
        </div>

        <div
          className="text-[0.8rem] tracking-[4px] uppercase mb-14 font-mono"
          style={{ color: 'rgba(228,228,231,0.4)' }}
        >
          arena
        </div>

        <div
          className="flex items-center gap-3 text-[0.85rem] tracking-[1px] animate-[pulseText_2.5s_ease_infinite]"
          style={{ color: 'rgba(228,228,231,0.2)' }}
        >
          <span
            className="px-3 py-1.5 rounded-[5px] font-mono text-[0.8rem]"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(228,228,231,0.4)',
            }}
          >
            Enter
          </span>
          눌러서 입장
        </div>
      </div>

      {/* ═══ STAGE: BOOT ═══ */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center z-10 transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
          stage !== 'boot' ? 'opacity-0 pointer-events-none' : ''
        }`}
      >
        {/* Aurora core spark — keeps the original rainbow feel */}
        <div
          className={`rounded-full mb-6 transition-all duration-[2000ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
            sparkExplode ? '' : ''
          }`}
          style={{
            width: sparkExplode ? 8 : 8,
            height: sparkExplode ? 8 : 8,
            background: '#22c55e',
            boxShadow: sparkExplode
              ? '0 0 200px rgba(34,197,94,0.8), 0 0 400px rgba(34,197,94,0.4)'
              : '0 0 20px rgba(34,197,94,0.5), 0 0 40px rgba(34,197,94,0.3)',
            transform: sparkExplode ? 'scale(60)' : 'scale(1)',
            opacity: sparkExplode ? 0 : 1,
            transition: 'all 2s cubic-bezier(0.25,1,0.5,1)',
          }}
        />

        {/* Terminal boot lines */}
        <div
          className="text-left font-mono text-[12px] leading-[2]"
          style={{ color: 'rgba(34,197,94,0.15)' }}
        >
          {bootLines.map((line, i) => (
            <div
              key={i}
              className="animate-[lineIn_0.3s_ease_forwards]"
              style={{
                opacity: 0,
                animationDelay: `${i * 0.05}s`,
                color: line.includes('✓') ? 'rgba(34,197,94,0.6)' : undefined,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* ═══ STAGE: LOGIN (Gate) ═══ */}
      <div
        className={`absolute inset-0 flex items-center justify-center z-10 transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
          stage !== 'login' ? 'opacity-0 scale-[0.98] pointer-events-none' : ''
        }`}
      >
        <div className="relative w-[440px] max-w-[92vw]">
          {/* Green glow border — reactive */}
          <div
            className="absolute z-[-1] rounded-[22px] transition-all duration-600"
            style={{
              inset: isFocused || name.length > 0 ? -6 : -2,
              background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.03), rgba(34,197,94,0.1))',
              filter: isFocused || name.length > 0 ? 'blur(30px)' : 'blur(20px)',
              opacity: isFocused || name.length > 0 ? 1 : 0,
              transition: 'all 0.6s ease',
            }}
          />

          {/* Glass panel */}
          <div
            className="relative text-center overflow-hidden"
            style={{
              padding: '48px 40px',
              background: 'rgba(12,12,14,0.9)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Top green gradient line */}
            <div
              className="absolute top-0 left-[20%] right-[20%] h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.15), transparent)',
              }}
            />

            {/* Mini cursor logo */}
            <div className="flex items-center justify-center gap-[2px] mb-7">
              <div
                className="w-3 h-[18px] rounded-[1px] animate-[cursorGlow_2s_ease-in-out_infinite]"
                style={{
                  background: '#22c55e',
                  boxShadow: '0 0 12px rgba(34,197,94,0.3)',
                }}
              />
            </div>

            <h1
              className="text-[1.3rem] font-medium mb-1.5 tracking-tight"
              style={{ fontFamily: "'Space Grotesk', 'Noto Sans KR', sans-serif" }}
            >
              바이브코딩 아레나
            </h1>
            <p
              className="text-[0.85rem] font-light mb-8 leading-relaxed"
              style={{ color: 'rgba(228,228,231,0.4)' }}
            >
              말로 설명하면 AI가 코드를 만들어줘요.
              <br />
              입장할 이름을 알려주세요!
            </p>

            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="이름을 입력하세요"
              maxLength={20}
              autoComplete="off"
              className="w-full text-center text-[0.95rem] font-light outline-none mb-4 transition-all duration-300"
              style={{
                background: isFocused ? 'rgba(34,197,94,0.03)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isFocused ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isFocused ? '0 0 0 3px rgba(34,197,94,0.05)' : 'none',
                color: '#e4e4e7',
                padding: '14px 20px',
                borderRadius: 10,
                fontFamily: 'var(--font-body)',
              }}
            />

            {/* Button with shimmer */}
            <button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="gate-btn-shimmer w-full py-3.5 rounded-[10px] text-[0.9rem] font-semibold cursor-pointer transition-all duration-200 hover:shadow-[0_0_30px_rgba(34,197,94,0.25)] hover:-translate-y-px disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              style={{
                background: '#22c55e',
                color: '#0a0a0a',
                border: 'none',
                fontFamily: 'var(--font-body)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              입장하기
            </button>

            <div
              className="mt-5 font-mono text-[10px] tracking-[2px] uppercase"
              style={{ color: 'rgba(228,228,231,0.2)' }}
            >
              powered by byteforce
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
