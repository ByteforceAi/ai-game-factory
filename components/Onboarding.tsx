'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import SparkleIcon from './SparkleIcon';

interface OnboardingProps {
  onSubmit: (name: string) => void;
}

type Stage = 'launch' | 'boot' | 'login';

export default function Onboarding({ onSubmit }: OnboardingProps) {
  const [stage, setStage] = useState<Stage>('launch');
  const [bootText, setBootText] = useState('AI 뉴럴 네트워크 연결 중...');
  const [sparkExplode, setSparkExplode] = useState(false);
  const [name, setName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const launched = useRef(false);

  // ── Launch → Boot → Login ──
  const launch = useCallback(() => {
    if (launched.current) return;
    launched.current = true;
    setStage('boot');

    // Boot text updates
    setTimeout(() => setBootText('언어 모델 초기화 중...'), 800);
    setTimeout(() => setBootText('워크스페이스 준비 완료.'), 1500);

    // Core spark explosion → Login
    setTimeout(() => {
      setSparkExplode(true);
      setTimeout(() => {
        setStage('login');
        setTimeout(() => inputRef.current?.focus(), 300);
      }, 500);
    }, 2500);
  }, []);

  // Listen for Enter/click on launch
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && stage === 'launch') launch();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [stage, launch]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    setFadeOut(true);
    setTimeout(() => onSubmit(trimmed), 600);
  };

  return (
    <div
      className={`fixed inset-0 z-[1000] transition-all duration-[600ms] ${
        fadeOut ? 'opacity-0 scale-[1.02] pointer-events-none' : ''
      }`}
      style={{ background: '#000000' }}
    >
      {/* ═══ STAGE: LAUNCH ═══ */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-all duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
          stage !== 'launch' ? 'opacity-0 scale-[1.02] blur-[10px] pointer-events-none' : ''
        }`}
        onClick={launch}
      >
        <SparkleIcon size={48} className="mx-auto mb-6 opacity-60" />

        <div className="text-[2.2rem] font-light tracking-tight mb-2.5">
          Claude <span className="font-semibold">맛보기</span>
        </div>

        <div
          className="text-[0.85rem] font-light tracking-[2px] uppercase mb-10"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          AI 체험 시뮬레이터
        </div>

        <div
          className="flex items-center gap-4 text-[0.95rem] font-light tracking-[1px] animate-[pulseText_2s_infinite_alternate]"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <span
            className="px-3.5 py-1.5 rounded-md font-mono text-[0.85rem] text-white"
            style={{
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            Enter
          </span>
          키를 누르거나 화면을 클릭
        </div>
      </div>

      {/* ═══ STAGE: BOOT ═══ */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-[1000ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
          stage !== 'boot' ? 'opacity-0 pointer-events-none' : ''
        }`}
      >
        {/* Core Spark — aurora gradient orb */}
        <div
          className={`rounded-full mb-8 transition-all duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
            sparkExplode ? 'scale-[80] opacity-0' : 'animate-[breatheCore_2s_ease-in-out_infinite_alternate]'
          }`}
          style={{
            width: 30,
            height: 30,
            background: 'linear-gradient(90deg, #00f3ff, #bc13fe, #ff007f, #ff9500, #00f3ff)',
            backgroundSize: '300% 300%',
            animation: sparkExplode
              ? undefined
              : 'gradientFlow 3s ease infinite, breatheCore 2s ease-in-out infinite alternate',
            filter: 'blur(8px)',
          }}
        />

        <div
          className="text-[0.95rem] font-light tracking-[1px] transition-opacity duration-500"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          {bootText}
        </div>
      </div>

      {/* ═══ STAGE: LOGIN ═══ */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
          stage !== 'login' ? 'opacity-0 scale-[0.98] pointer-events-none' : ''
        }`}
      >
        {/* Glow wrapper — Siri aurora border */}
        <div className="relative" style={{ borderRadius: 20 }}>
          {/* Aurora glow border */}
          <div
            className="absolute z-[-1] rounded-[22px] transition-all duration-500"
            style={{
              inset: isFocused || name.length > 0 ? -8 : -3,
              background: 'linear-gradient(90deg, #00f3ff, #bc13fe, #ff007f, #ff9500, #00f3ff)',
              backgroundSize: '300% 300%',
              animation: 'gradientFlow 6s linear infinite',
              filter: isFocused || name.length > 0 ? 'blur(25px)' : 'blur(15px)',
              opacity: isFocused || name.length > 0 ? 0.9 : 0.3,
            }}
          />

          {/* Glass panel */}
          <div
            className="w-[420px] max-w-[90vw] text-center"
            style={{
              padding: '50px 40px',
              background: 'rgba(10,10,15,0.85)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
            }}
          >
            <SparkleIcon size={40} className="mx-auto mb-5" />

            <h1 className="text-[1.4rem] font-normal mb-2 tracking-tight">
              AI 체험 시뮬레이터
            </h1>
            <p
              className="text-[0.9rem] font-light mb-7 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Claude와 대화하는 방법을 직접 체험해보세요.
              <br />
              먼저 이름을 알려주세요!
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
              className="w-full text-center text-base font-light outline-none mb-4 transition-all duration-300"
              style={{
                background: isFocused ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isFocused ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                color: '#fff',
                padding: '14px 20px',
                borderRadius: 10,
                fontFamily: 'var(--font-body)',
              }}
            />

            <button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="w-full py-3.5 rounded-[10px] text-[0.95rem] font-medium cursor-pointer transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              style={{
                background: '#fff',
                color: '#000',
                border: 'none',
                fontFamily: 'var(--font-body)',
              }}
            >
              시작하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
