'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DEMO_GAMES, DemoGame } from '@/lib/demoGames';
import ParticleBackground from './ParticleBackground';

/* ──────────────────────────────────────────────
   Prompt options mapped to games
   ────────────────────────────────────────────── */
const PROMPT_OPTIONS = [
  { gameId: 'neon-shooter', chip: '우주 슈팅게임', prompt: '우주에서 적을 쏘는 네온 슈팅게임 만들어줘', color: '#00FFFF' },
  { gameId: 'neon-platformer', chip: '네온 플랫포머', prompt: '점프하고 벽타는 네온 러너 게임 만들어줘', color: '#FF00FF' },
  { gameId: 'temple-runner', chip: '3D 러너', prompt: '3D 장애물 피하는 템플 러너 만들어줘', color: '#00CCFF' },
  { gameId: 'tetris', chip: '테트리스', prompt: '클래식 테트리스 게임 만들어줘', color: '#B400FF' },
];

/* ──────────────────────────────────────────────
   AI analysis steps per game
   ────────────────────────────────────────────── */
const ANALYSIS_MAP: Record<string, { label: string; value: string }[]> = {
  'neon-shooter': [
    { label: '장르 감지', value: 'Vertical Scroll Shooter' },
    { label: '물리엔진', value: 'Phaser.js 3.80 — Arcade Physics' },
    { label: '렌더링', value: 'WebGL 2.0 + Canvas Fallback' },
    { label: '아트 스타일', value: 'Neon Cyberpunk' },
    { label: '게임 시스템', value: 'Wave AI + Boss + Power-ups' },
    { label: '예상 코드량', value: '~1,020 Lines of Code' },
  ],
  'neon-platformer': [
    { label: '장르 감지', value: 'Physics Platformer' },
    { label: '물리엔진', value: 'Phaser.js 3.80 — Arcade Physics' },
    { label: '렌더링', value: 'WebGL 2.0 + Canvas Fallback' },
    { label: '아트 스타일', value: 'Neon Retrowave' },
    { label: '게임 시스템', value: 'Double Jump + Wall Slide + Procedural Map' },
    { label: '예상 코드량', value: '~855 Lines of Code' },
  ],
  'temple-runner': [
    { label: '장르 감지', value: '3D Endless Runner' },
    { label: '3D 엔진', value: 'Three.js r160 — WebGL' },
    { label: '렌더링', value: 'Perspective Camera + Fog' },
    { label: '아트 스타일', value: 'Temple Ruins' },
    { label: '게임 시스템', value: 'Lane Switch + Obstacles + Coins' },
    { label: '예상 코드량', value: '~680 Lines of Code' },
  ],
  'tetris': [
    { label: '장르 감지', value: 'Classic Puzzle' },
    { label: '렌더링', value: 'Canvas 2D — 10×20 Grid' },
    { label: '아트 스타일', value: 'Neon Minimal' },
    { label: '게임 시스템', value: 'SRS Rotation + Line Combos + Level Up' },
    { label: '점수 시스템', value: 'T-Spin + Tetris Bonus' },
    { label: '예상 코드량', value: '~520 Lines of Code' },
  ],
};

interface PromptTerminalProps {
  onComplete: (game: DemoGame) => void;
}

type Phase = 'prompts' | 'typing' | 'analyzing' | 'done';

export default function PromptTerminal({ onComplete }: PromptTerminalProps) {
  const [phase, setPhase] = useState<Phase>('prompts');
  const [selectedOption, setSelectedOption] = useState<typeof PROMPT_OPTIONS[0] | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(-1);
  const [promptsVisible, setPromptsVisible] = useState(false);
  const [matchFlash, setMatchFlash] = useState(0);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMatchLen = useRef(0);

  useEffect(() => {
    setMounted(true);
    // Prompt chips appear after brief delay — user initiates first
    setTimeout(() => setPromptsVisible(true), 400);
  }, []);

  /* ── Typing match calculation ── */
  const target = selectedOption?.prompt || '';
  let matchLen = 0;
  if (target) {
    for (let i = 0; i < Math.min(inputValue.length, target.length); i++) {
      if (inputValue[i] === target[i]) matchLen++;
      else break;
    }
  }
  const typingComplete = matchLen >= target.length && target.length > 0;

  // Flash effect when new character matches
  useEffect(() => {
    if (matchLen > prevMatchLen.current && matchLen > 0) {
      setMatchFlash((f) => f + 1);
    }
    prevMatchLen.current = matchLen;
  }, [matchLen]);

  /* ── Handle chip select ── */
  const handleChipSelect = useCallback((option: typeof PROMPT_OPTIONS[0]) => {
    setSelectedOption(option);
    setInputValue('');
    setPhase('typing');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  /* ── Handle typing complete → start analysis ── */
  useEffect(() => {
    if (!typingComplete || phase !== 'typing') return;
    const timer = setTimeout(() => {
      setPhase('analyzing');
      setAnalysisStep(-1);
    }, 600);
    return () => clearTimeout(timer);
  }, [typingComplete, phase]);

  /* ── Phase 3: Analysis steps ── */
  useEffect(() => {
    if (phase !== 'analyzing' || !selectedOption) return;
    const steps = ANALYSIS_MAP[selectedOption.gameId] || [];
    let current = -1;
    // Start first step after a brief pause
    const startTimer = setTimeout(() => {
      current = 0;
      setAnalysisStep(0);
    }, 500);

    const iv = setInterval(() => {
      current++;
      if (current >= steps.length) {
        clearInterval(iv);
        setAnalysisDone(true);
        // Transition to code generation
        setTimeout(() => {
          const game = DEMO_GAMES.find((g) => g.id === selectedOption.gameId);
          if (game) {
            setPhase('done');
            onComplete(game);
          }
        }, 1200);
      } else {
        setAnalysisStep(current);
      }
    }, 600);

    return () => {
      clearTimeout(startTimer);
      clearInterval(iv);
    };
  }, [phase, selectedOption, onComplete]);

  /* ── Render helpers ── */
  const analysisSteps = selectedOption ? ANALYSIS_MAP[selectedOption.gameId] || [] : [];
  const analysisProgress = analysisSteps.length > 0
    ? Math.min(100, Math.round(((analysisStep + 1) / analysisSteps.length) * 100))
    : 0;

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <ParticleBackground />

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '520px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>

        {/* ═══════════════ Title ═══════════════ */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="mono-xs" style={{
            marginBottom: '16px',
            color: 'var(--ai-cyan)',
            letterSpacing: '0.2em',
          }}>
            NEURAL ENGINE v4.0 — READY
          </div>
          <h1 style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 'clamp(22px, 5vw, 32px)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            margin: 0,
            lineHeight: 1.2,
          }}>
            <span className="text-glow-indigo">VIBE CODING</span>
            <br />
            <span style={{ color: 'var(--text-body)', fontSize: '0.55em', letterSpacing: '0.18em' }}>
              SIMULATOR
            </span>
          </h1>
          <div className="shimmer-line" style={{ width: '80px', margin: '16px auto 0' }} />
        </div>

        {/* ═══════════════ Terminal Card ═══════════════ */}
        <div className="card-cinematic" style={{
          padding: '0',
          overflow: 'hidden',
          boxShadow: '0 16px 64px rgba(99,102,241,0.1), 0 0 100px rgba(0,0,0,0.5)',
        }}>

          {/* Terminal Header Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid var(--border-dim)',
          }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            </div>
            <span className="mono-xs" style={{ fontSize: '9px', color: 'var(--text-muted)', flex: 1, textAlign: 'center' }}>
              vibe-coding-ai — terminal
            </span>
            <span className="status-dot-green" />
          </div>

          {/* Terminal Body */}
          <div style={{
            padding: '20px',
            minHeight: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
          }}>

            {/* User prompt — user initiates */}
            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              color: 'rgba(255,255,255,0.3)',
              fontSize: '12px',
            }}>
              <span style={{
                color: 'var(--ai-cyan)',
                fontWeight: 600,
                fontSize: '13px',
              }}>{'>'}</span>
              <span>만들고 싶은 게임을 선택하세요</span>
              {phase === 'prompts' && !selectedOption && (
                <span style={{
                  display: 'inline-block',
                  width: '7px',
                  height: '14px',
                  background: 'var(--ai-indigo)',
                  animation: 'blink 0.6s ease-in-out infinite',
                  borderRadius: '1px',
                  boxShadow: '0 0 8px rgba(99,102,241,0.5)',
                }} />
              )}
            </div>

            {/* ═══ Prompt Chips ═══ */}
            {(phase === 'prompts' || phase === 'typing' || phase === 'analyzing' || phase === 'done') && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                opacity: promptsVisible ? 1 : 0,
                transform: promptsVisible ? 'translateY(0)' : 'translateY(12px)',
                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              }}>
                {PROMPT_OPTIONS.map((opt, i) => {
                  const isSelected = selectedOption?.gameId === opt.gameId;
                  const isDisabled = phase !== 'prompts';
                  return (
                    <button
                      key={opt.gameId}
                      onClick={() => !isDisabled && handleChipSelect(opt)}
                      disabled={isDisabled}
                      style={{
                        background: isSelected
                          ? `${opt.color}15`
                          : 'var(--bg-surface)',
                        border: `1px solid ${isSelected ? opt.color + '40' : 'var(--border-dim)'}`,
                        borderRadius: '100px',
                        padding: '8px 16px',
                        color: isSelected ? opt.color : 'var(--text-body)',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: isDisabled ? 'default' : 'pointer',
                        transition: 'all 0.3s',
                        opacity: isDisabled && !isSelected ? 0.3 : 1,
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: isSelected ? `0 0 20px ${opt.color}20` : 'none',
                        animation: !isDisabled
                          ? `fadeSlideIn 0.4s ease ${i * 0.08}s both`
                          : undefined,
                      }}
                    >
                      {opt.chip}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ═══ Typing Area ═══ */}
            {(phase === 'typing' || phase === 'analyzing' || phase === 'done') && selectedOption && (
              <div style={{
                animation: 'fadeSlideIn 0.4s ease both',
              }}>
                {/* Ghost text display */}
                <div style={{
                  position: 'relative',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: typingComplete
                    ? `1px solid ${selectedOption.color}40`
                    : '1px solid var(--border-dim)',
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                  boxShadow: typingComplete
                    ? `0 0 20px ${selectedOption.color}15`
                    : 'none',
                }}>
                  {/* Prompt symbol */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{
                      color: typingComplete ? 'var(--ai-emerald)' : 'var(--ai-indigo)',
                      fontWeight: 700,
                      fontSize: '14px',
                      transition: 'color 0.3s',
                    }}>
                      {typingComplete ? '✓' : '>'}
                    </span>

                    <div style={{ flex: 1, position: 'relative', minHeight: '20px' }}>
                      {/* Ghost text (target) */}
                      <div style={{ position: 'relative', lineHeight: '20px', wordBreak: 'keep-all' }} aria-hidden>
                        {target.split('').map((char, i) => {
                          const isMatched = i < matchLen;
                          const isNext = i === matchLen;
                          return (
                            <span
                              key={i}
                              style={{
                                color: isMatched
                                  ? 'var(--text-bright)'
                                  : 'var(--text-muted)',
                                opacity: isMatched ? 1 : 0.3,
                                textShadow: isMatched
                                  ? `0 0 8px ${selectedOption.color}40`
                                  : 'none',
                                transition: 'all 0.15s ease',
                                borderBottom: isNext && !typingComplete
                                  ? `2px solid ${selectedOption.color}`
                                  : '2px solid transparent',
                              }}
                            >
                              {char}
                            </span>
                          );
                        })}
                        {/* Blinking cursor */}
                        {!typingComplete && phase === 'typing' && (
                          <span style={{
                            display: 'inline-block',
                            width: '2px',
                            height: '14px',
                            background: selectedOption.color,
                            marginLeft: '1px',
                            verticalAlign: 'middle',
                            animation: 'blink 1s infinite',
                            boxShadow: `0 0 4px ${selectedOption.color}60`,
                          }} />
                        )}
                      </div>

                      {/* Hidden real input */}
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={() => setIsComposing(false)}
                        disabled={typingComplete || phase !== 'typing'}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          opacity: 0,
                          width: '100%',
                          height: '100%',
                          cursor: 'text',
                          fontSize: '16px', // prevent zoom on iOS
                        }}
                      />
                    </div>
                  </div>

                  {/* Typing progress bar */}
                  {phase === 'typing' && (
                    <div style={{
                      marginTop: '10px',
                      height: '2px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '1px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${target.length > 0 ? (matchLen / target.length) * 100 : 0}%`,
                        background: `linear-gradient(90deg, ${selectedOption.color}, ${selectedOption.color}80)`,
                        borderRadius: '1px',
                        transition: 'width 0.15s ease',
                        boxShadow: `0 0 6px ${selectedOption.color}40`,
                      }} />
                    </div>
                  )}
                </div>

                {/* Typing hint */}
                {phase === 'typing' && !typingComplete && (
                  <div className="mono-xs" style={{
                    textAlign: 'center',
                    marginTop: '8px',
                    fontSize: '8px',
                    color: 'var(--text-muted)',
                    animation: matchLen === 0 ? 'pulse-subtle 2s ease-in-out infinite' : undefined,
                  }}>
                    TYPE THE PROMPT TO CONTINUE — {matchLen}/{target.length}
                  </div>
                )}

                {/* Typing complete flash */}
                {typingComplete && phase === 'typing' && (
                  <div className="mono-xs" style={{
                    textAlign: 'center',
                    marginTop: '8px',
                    fontSize: '9px',
                    color: 'var(--ai-emerald)',
                    animation: 'fadeSlideIn 0.3s ease both',
                  }}>
                    PROMPT ACCEPTED — INITIALIZING AI ENGINE...
                  </div>
                )}
              </div>
            )}

            {/* ═══ AI Analysis HUD ═══ */}
            {(phase === 'analyzing' || phase === 'done') && selectedOption && (
              <div style={{
                animation: 'fadeSlideIn 0.5s ease both',
              }}>
                {/* AI message */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--ai-indigo), var(--ai-violet))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    flexShrink: 0,
                    boxShadow: '0 0 16px rgba(99,102,241,0.3)',
                  }}>
                    AI
                  </div>
                  <span style={{ color: 'var(--text-bright)', paddingTop: '4px', fontSize: '13px' }}>
                    프롬프트를 분석하고 게임을 설계합니다...
                  </span>
                </div>

                {/* Analysis Steps */}
                <div style={{
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-dim)',
                  padding: '14px 16px',
                  overflow: 'hidden',
                }}>
                  {/* Analysis header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--border-dim)',
                  }}>
                    <span className="mono-xs" style={{ fontSize: '9px', color: 'var(--ai-cyan)', letterSpacing: '0.15em' }}>
                      AI ANALYSIS
                    </span>
                    <span className="mono-xs" style={{
                      fontSize: '9px',
                      color: analysisDone ? 'var(--ai-emerald)' : 'var(--text-muted)',
                    }}>
                      {analysisDone ? 'COMPLETE' : `${analysisProgress}%`}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    height: '2px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '1px',
                    overflow: 'hidden',
                    marginBottom: '14px',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${analysisProgress}%`,
                      background: analysisDone
                        ? 'linear-gradient(90deg, var(--ai-emerald), #4ade80)'
                        : `linear-gradient(90deg, var(--ai-indigo), ${selectedOption.color})`,
                      borderRadius: '1px',
                      transition: 'width 0.4s ease, background 0.3s',
                      boxShadow: analysisDone
                        ? '0 0 8px rgba(16,185,129,0.4)'
                        : `0 0 8px ${selectedOption.color}30`,
                    }} />
                  </div>

                  {/* Step rows */}
                  {analysisSteps.map((step, i) => {
                    const isActive = i <= analysisStep;
                    const isCurrent = i === analysisStep && !analysisDone;
                    return (
                      <div
                        key={step.label}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 0',
                          opacity: isActive ? 1 : 0.2,
                          transform: isActive ? 'translateX(0)' : 'translateX(-8px)',
                          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* Status icon */}
                          {isActive ? (
                            isCurrent ? (
                              <div style={{
                                width: '14px',
                                height: '14px',
                                border: `2px solid ${selectedOption.color}`,
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                                flexShrink: 0,
                              }} />
                            ) : (
                              <div style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                background: `${selectedOption.color}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px',
                                color: selectedOption.color,
                                flexShrink: 0,
                              }}>
                                ✓
                              </div>
                            )
                          ) : (
                            <div style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              border: '1px solid var(--border-dim)',
                              flexShrink: 0,
                            }} />
                          )}
                          <span style={{
                            fontSize: '11px',
                            color: isActive ? 'var(--text-body)' : 'var(--text-muted)',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>
                            {step.label}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontFamily: "'JetBrains Mono', monospace",
                          color: isActive ? selectedOption.color : 'var(--text-muted)',
                          textShadow: isActive ? `0 0 8px ${selectedOption.color}30` : 'none',
                          opacity: isActive ? 1 : 0,
                          transition: 'opacity 0.3s 0.2s',
                        }}>
                          {step.value}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Launch message */}
                {analysisDone && (
                  <div style={{
                    textAlign: 'center',
                    marginTop: '14px',
                    animation: 'fadeSlideIn 0.4s ease both',
                  }}>
                    <span className="mono-xs" style={{
                      fontSize: '10px',
                      color: 'var(--ai-emerald)',
                      letterSpacing: '0.15em',
                    }}>
                      CODE GENERATION STARTING...
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════ Footer ═══════════════ */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          marginTop: '24px',
          flexWrap: 'wrap',
        }}>
          {[
            { label: 'ONLINE', dot: 'status-dot-green', color: 'var(--ai-emerald)' },
            { label: 'PHASER.JS', dot: '', color: 'var(--text-dim)' },
            { label: 'THREE.JS', dot: '', color: 'var(--text-dim)' },
            { label: 'WEBGL 2.0', dot: '', color: 'var(--text-dim)' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-dim)',
              borderRadius: '100px',
            }}>
              {item.dot && <span className={item.dot} />}
              <span className="mono-xs" style={{ fontSize: '8px', color: item.color }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
