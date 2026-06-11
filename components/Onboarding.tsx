'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface OnboardingProps {
  onSubmit: (name: string) => void;
}

type Stage = 'launch' | 'boot' | 'login';

// ── 부팅: 코어스파크 색상 전환으로 진행도 표현 (텍스트 없음) ──
// 교실 환경 제약: 전체 시퀀스가 ~7초를 넘으면 안 됨 (Enter/버튼으로 스킵 가능)
const BOOT_PHASES: {
  color: string; // gradient primary color
  glow: string;  // box-shadow color
  duration: number;
  scale: number;
  blur: number;
}[] = [
  { color: '#00f3ff', glow: 'rgba(0,243,255,0.4)',   duration: 1100, scale: 1,   blur: 8 },   // Cyan — 연결
  { color: '#22c55e', glow: 'rgba(34,197,94,0.4)',    duration: 1300, scale: 1.4, blur: 10 },  // Green — 로딩
  { color: '#bc13fe', glow: 'rgba(188,19,254,0.4)',   duration: 1100, scale: 1.8, blur: 12 },  // Purple — 준비
  { color: '#ff9500', glow: 'rgba(255,149,0,0.4)',    duration: 1000, scale: 2.2, blur: 14 },  // Orange — 활성화
  { color: '#ffffff', glow: 'rgba(255,255,255,0.5)',   duration: 900,  scale: 2.8, blur: 18 },  // White — 완료
];

export default function Onboarding({ onSubmit }: OnboardingProps) {
  const [stage, setStage] = useState<Stage>('launch');
  const [bootPhaseIdx, setBootPhaseIdx] = useState(0);
  const [bootProgress, setBootProgress] = useState(0);
  const [sparkExplode, setSparkExplode] = useState(false);
  const [name, setName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const launched = useRef(false);
  const bootTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const currentPhase = BOOT_PHASES[bootPhaseIdx] || BOOT_PHASES[BOOT_PHASES.length - 1];

  // ── Launch → Boot (cinematic) → Login ──
  const launch = useCallback(() => {
    if (launched.current) return;
    launched.current = true;
    setStage('boot');

    // Schedule phase transitions (collect ids so skip can cancel)
    let cumDelay = 600; // initial pause
    BOOT_PHASES.forEach((phase, i) => {
      const d = cumDelay;
      bootTimersRef.current.push(setTimeout(() => {
        setBootPhaseIdx(i);
        setBootProgress(Math.round(((i + 1) / BOOT_PHASES.length) * 100));
      }, d));
      cumDelay += phase.duration;
    });

    // Core spark explosion → Login
    bootTimersRef.current.push(setTimeout(() => {
      setSparkExplode(true);
      bootTimersRef.current.push(setTimeout(() => {
        setStage('login');
        setTimeout(() => inputRef.current?.focus(), 300);
      }, 800));
    }, cumDelay + 300));
  }, []);

  // ── Skip boot: cancel pending phases, jump to login ──
  const skipBoot = useCallback(() => {
    bootTimersRef.current.forEach(clearTimeout);
    bootTimersRef.current = [];
    setSparkExplode(true);
    setTimeout(() => {
      setStage('login');
      setTimeout(() => inputRef.current?.focus(), 200);
    }, 300);
  }, []);

  // Enter 연타 대응: stage 클로저 재등록을 기다리면 두 번째 Enter를 놓친다.
  // launched.current는 launch() 안에서 동기로 뒤집히므로 연타 판별 기준으로 안전.
  const stageRef = useRef<Stage>('launch');
  stageRef.current = stage;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      if (!launched.current) launch();
      else if (stageRef.current === 'launch' || stageRef.current === 'boot') skipBoot();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, [launch, skipBoot]);

  // Cancel pending boot timers on unmount
  useEffect(() => () => bootTimersRef.current.forEach(clearTimeout), []);

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
      style={{ background: 'var(--bg-deep)' }}
    >
      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
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
          style={{ color: 'rgba(228,228,231,0.5)' }}
        >
          <span
            className="px-3 py-1.5 rounded-[5px] font-mono text-[0.8rem]"
            style={{
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(228,228,231,0.65)',
            }}
          >
            Enter
          </span>
          눌러서 입장
        </div>
      </div>

      {/* ═══ STAGE: BOOT (cinematic core spark) ═══ */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center z-10 transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
          stage !== 'boot' ? 'opacity-0 pointer-events-none' : ''
        }`}
      >
        {/* Core spark — color shifts through phases, no text */}
        <div
          className="rounded-full"
          style={{
            width: 30,
            height: 30,
            background: sparkExplode
              ? '#fff'
              : `radial-gradient(circle, ${currentPhase.color}, ${currentPhase.color}88, transparent)`,
            filter: `blur(${sparkExplode ? 0 : currentPhase.blur}px)`,
            transform: sparkExplode ? 'scale(80)' : `scale(${currentPhase.scale})`,
            opacity: sparkExplode ? 0 : 1,
            boxShadow: sparkExplode
              ? 'none'
              : `0 0 ${30 + currentPhase.scale * 15}px ${currentPhase.glow}, 0 0 ${60 + currentPhase.scale * 25}px ${currentPhase.glow.replace('0.4', '0.15')}`,
            transition: 'all 2s cubic-bezier(0.25,1,0.5,1)',
            animation: sparkExplode ? undefined : 'breatheCore 2.5s ease-in-out infinite alternate',
          }}
        />

        {/* Minimal progress dots — 5 dots that fill with phase */}
        <div className="flex gap-2 mt-12">
          {BOOT_PHASES.map((phase, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-[1.5s]"
              style={{
                width: i <= bootPhaseIdx ? 6 : 4,
                height: i <= bootPhaseIdx ? 6 : 4,
                background: i <= bootPhaseIdx ? phase.color : 'rgba(255,255,255,0.08)',
                boxShadow: i <= bootPhaseIdx ? `0 0 8px ${phase.glow}` : 'none',
              }}
            />
          ))}
        </div>

        {/* Skip — classroom must never wait */}
        <button
          onClick={skipBoot}
          className="absolute bottom-8 right-8 px-4 py-2.5 rounded-full font-mono text-[11px] tracking-[2px] uppercase cursor-pointer transition-all duration-300 hover:bg-[rgba(255,255,255,0.06)]"
          style={{
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.02)',
            color: 'rgba(228,228,231,0.5)',
          }}
        >
          건너뛰기 — Enter
        </button>
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
            className="absolute z-[-1] rounded-[22px]"
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
