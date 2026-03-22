'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface OnboardingProps {
  onSubmit: (name: string) => void;
}

type Stage = 'launch' | 'boot' | 'login';

// ── 20초+ 럭셔리 부팅 시퀀스 ──
const BOOT_SEQUENCE: { text: string; delay: number }[] = [
  { text: '> system boot initiated', delay: 800 },
  { text: '> loading kernel modules...', delay: 1200 },
  { text: '  ├─ vibe-engine v4.2.0', delay: 600 },
  { text: '  ├─ neural-context [200K tokens]', delay: 800 },
  { text: '  └─ code-sandbox runtime', delay: 700 },
  { text: '', delay: 400 },
  { text: '> initializing AI pipeline...', delay: 1500 },
  { text: '  ├─ language model: connected', delay: 900 },
  { text: '  ├─ code interpreter: ready', delay: 800 },
  { text: '  ├─ game renderer: standby', delay: 700 },
  { text: '  └─ visual effects: loaded', delay: 600 },
  { text: '', delay: 300 },
  { text: '> authenticating workspace...', delay: 1800 },
  { text: '  ├─ session: encrypted', delay: 600 },
  { text: '  └─ permissions: granted', delay: 500 },
  { text: '', delay: 400 },
  { text: '> loading arena assets...', delay: 1600 },
  { text: '  ├─ games: 12 modules', delay: 700 },
  { text: '  ├─ themes: 18 presets', delay: 600 },
  { text: '  ├─ sounds: initialized', delay: 500 },
  { text: '  └─ fonts: Noto Sans KR, JetBrains Mono, Space Grotesk', delay: 800 },
  { text: '', delay: 300 },
  { text: '> running diagnostics...', delay: 1200 },
  { text: '  ├─ latency: 12ms ✓', delay: 500 },
  { text: '  ├─ memory: optimal ✓', delay: 500 },
  { text: '  └─ GPU: hardware accelerated ✓', delay: 600 },
  { text: '', delay: 500 },
  { text: '> all systems nominal', delay: 1000 },
  { text: '> 바이브코딩 아레나 online ✓', delay: 800 },
];

export default function Onboarding({ onSubmit }: OnboardingProps) {
  const [stage, setStage] = useState<Stage>('launch');
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [sparkExplode, setSparkExplode] = useState(false);
  const [bootProgress, setBootProgress] = useState(0);
  const [name, setName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const launched = useRef(false);

  // ── Launch → Boot (20s+ luxurious) → Login ──
  const launch = useCallback(() => {
    if (launched.current) return;
    launched.current = true;
    setStage('boot');

    // Schedule each boot line with cumulative delay
    let cumDelay = 600;
    const totalDelay = BOOT_SEQUENCE.reduce((sum, s) => sum + s.delay, 0) + 600;

    BOOT_SEQUENCE.forEach((step, i) => {
      cumDelay += step.delay;
      const d = cumDelay;
      setTimeout(() => {
        if (step.text) {
          setBootLines(prev => [...prev, step.text]);
        }
        setBootProgress(Math.round(((i + 1) / BOOT_SEQUENCE.length) * 100));
      }, d);
    });

    // Core spark explosion → Login
    setTimeout(() => {
      setSparkExplode(true);
      setTimeout(() => {
        setStage('login');
        setTimeout(() => inputRef.current?.focus(), 300);
      }, 800);
    }, totalDelay + 600);
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
        {/* Aurora core spark — original rainbow orb restored */}
        <div
          className="rounded-full mb-8"
          style={{
            width: 30,
            height: 30,
            background: 'linear-gradient(90deg, #00f3ff, #22c55e, #bc13fe, #22c55e, #00f3ff)',
            backgroundSize: '300% 300%',
            animation: sparkExplode
              ? undefined
              : 'gradientFlow 3s ease infinite, breatheCore 2s ease-in-out infinite alternate',
            filter: 'blur(8px)',
            transform: sparkExplode ? 'scale(80)' : 'scale(1)',
            opacity: sparkExplode ? 0 : 1,
            transition: 'all 1.5s cubic-bezier(0.25,1,0.5,1)',
          }}
        />

        {/* Terminal boot lines */}
        <div
          className="text-left font-mono text-[11px] leading-[1.9] max-h-[280px] overflow-hidden"
          style={{ width: 380, maxWidth: '90vw' }}
        >
          {bootLines.map((line, i) => (
            <div
              key={i}
              className="animate-[lineIn_0.3s_ease_forwards]"
              style={{
                opacity: 0,
                animationDelay: `${i * 0.02}s`,
                color: line.includes('✓')
                  ? 'rgba(34,197,94,0.8)'
                  : line.startsWith('  ')
                  ? 'rgba(34,197,94,0.25)'
                  : 'rgba(34,197,94,0.45)',
              }}
            >
              {line}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {bootProgress > 0 && (
          <div className="mt-6" style={{ width: 200 }}>
            <div
              className="h-[2px] rounded-full overflow-hidden"
              style={{ background: 'rgba(34,197,94,0.1)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${bootProgress}%`,
                  background: 'rgba(34,197,94,0.5)',
                  boxShadow: '0 0 8px rgba(34,197,94,0.3)',
                  transition: 'width 0.5s ease-out',
                }}
              />
            </div>
            <div
              className="text-center mt-2 font-mono text-[9px] tracking-[2px]"
              style={{ color: 'rgba(34,197,94,0.3)' }}
            >
              {bootProgress}%
            </div>
          </div>
        )}
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
              대화로 코드를 만들고, 실시간으로 수정하는
              <br />
              AI 코딩 플레이그라운드
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
