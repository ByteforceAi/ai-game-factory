'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DEMO_GAMES, DemoGame } from '@/lib/demoGames';
import { matchPromptToGame, MatchResult } from '@/lib/promptMatcher';
import { playSelect, playPing, playComplete, playWhoosh, playTick } from '@/lib/sounds';
import ParticleBackground from './ParticleBackground';

/* ──────────────────────────────────────────────
   Chip suggestions — quick-select presets
   ────────────────────────────────────────────── */
const CHIPS = [
  { label: '우주 슈팅게임', prompt: '우주에서 적을 쏘는 네온 슈팅게임', color: '#00FFFF' },
  { label: '네온 플랫포머', prompt: '점프하고 벽타는 네온 러너 게임', color: '#FF00FF' },
  { label: '3D 러너', prompt: '3D 장애물 피하는 템플 러너', color: '#00CCFF' },
  { label: '테트리스', prompt: '클래식 테트리스 게임', color: '#B400FF' },
  { label: '이모지 캐치', prompt: '떨어지는 이모지 받기 게임', color: '#FF6B6B' },
];

interface PromptTerminalProps {
  onComplete: (game: DemoGame) => void;
}

type Phase = 'input' | 'analyzing' | 'done';

export default function PromptTerminal({ onComplete }: PromptTerminalProps) {
  const [phase, setPhase] = useState<Phase>('input');
  const [inputValue, setInputValue] = useState('');
  const [mounted, setMounted] = useState(false);
  const [chipsVisible, setChipsVisible] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [analysisStep, setAnalysisStep] = useState(-1);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [accentColor, setAccentColor] = useState('#6366f1');
  const [userPrompt, setUserPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => setChipsVisible(true), 300);
    setTimeout(() => inputRef.current?.focus(), 600);
  }, []);

  /* ── Submit prompt (chip click or Enter) ── */
  const handleSubmit = useCallback((prompt: string, color?: string) => {
    if (!prompt.trim() || phase !== 'input') return;
    playSelect();
    const result = matchPromptToGame(prompt);
    setMatchResult(result);
    setUserPrompt(prompt.trim());
    setAccentColor(color || '#6366f1');
    setPhase('analyzing');
    setAnalysisStep(-1);
    setAnalysisDone(false);
  }, [phase]);

  const handleChipClick = useCallback((chip: typeof CHIPS[0]) => {
    if (isTyping) return;
    setIsTyping(true);
    setInputValue('');

    // Clear any previous typing timers
    typingTimerRef.current.forEach(t => clearTimeout(t));
    typingTimerRef.current = [];

    // Typewriter animation — type each character with sound
    const chars = chip.prompt.split('');
    chars.forEach((_, i) => {
      const timer = setTimeout(() => {
        setInputValue(chip.prompt.slice(0, i + 1));
        if (i % 2 === 0) playTick();
      }, i * 35);
      typingTimerRef.current.push(timer);
    });

    // Auto-submit after typing completes
    const submitTimer = setTimeout(() => {
      setIsTyping(false);
      handleSubmit(chip.prompt, chip.color);
    }, chars.length * 35 + 400);
    typingTimerRef.current.push(submitTimer);
  }, [handleSubmit, isTyping]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit(inputValue);
    }
  }, [inputValue, handleSubmit]);

  /* ── Analysis animation ── */
  useEffect(() => {
    if (phase !== 'analyzing' || !matchResult) return;
    const steps = buildAnalysisSteps(matchResult, userPrompt);
    let current = -1;

    const startTimer = setTimeout(() => {
      current = 0;
      setAnalysisStep(0);
      playPing();
    }, 500);

    const iv = setInterval(() => {
      current++;
      if (current >= steps.length) {
        clearInterval(iv);
        setAnalysisDone(true);
        playComplete();
        setTimeout(() => {
          playWhoosh();
          const game = DEMO_GAMES.find(g => g.id === matchResult.gameId);
          if (game) {
            setPhase('done');
            onComplete(game);
          }
        }, 1200);
      } else {
        setAnalysisStep(current);
        playPing();
      }
    }, 550);

    return () => {
      clearTimeout(startTimer);
      clearInterval(iv);
    };
  }, [phase, matchResult, userPrompt, onComplete]);

  /* ── Build dynamic analysis steps ── */
  const analysisSteps = matchResult ? buildAnalysisSteps(matchResult, userPrompt) : [];
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
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '14px',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '7px',
              fontWeight: 600,
              letterSpacing: '0.15em',
              padding: '2px 8px',
              borderRadius: '100px',
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.25)',
              color: '#a5b4fc',
            }}>
              CLOSED BETA
            </span>
            <span className="mono-xs" style={{
              fontSize: '8px',
              color: 'var(--ai-cyan)',
              letterSpacing: '0.15em',
            }}>
              NEURAL ENGINE v4.0
            </span>
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
          <div className="shimmer-line" style={{ width: '80px', margin: '14px auto 0' }} />
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
            minHeight: '340px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
          }}>

            {/* System message */}
            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              fontSize: '12px',
            }}>
              <span style={{ color: 'var(--ai-cyan)', fontWeight: 600, fontSize: '13px' }}>{'>'}</span>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>
                {phase === 'input' ? '어떤 게임을 만들어볼까요?' : userPrompt}
              </span>
              {phase === 'input' && !inputValue && (
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

            {/* ═══ Input Area ═══ */}
            {phase === 'input' && (
              <>
                {/* Free text input */}
                <div style={{
                  position: 'relative',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: '1px solid var(--border-dim)',
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                  animation: 'fadeSlideIn 0.4s ease both',
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      color: 'var(--ai-indigo)',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}>{'>'}</span>
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => !isTyping && setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="만들고 싶은 게임을 설명하세요..."
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      readOnly={isTyping}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: isTyping ? 'var(--ai-cyan)' : 'var(--text-bright)',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '13px',
                        lineHeight: '20px',
                        padding: 0,
                        transition: 'color 0.2s',
                        caretColor: isTyping ? 'transparent' : 'var(--ai-indigo)',
                      }}
                    />
                    {isTyping && (
                      <span style={{
                        display: 'inline-block',
                        width: '2px',
                        height: '16px',
                        background: 'var(--ai-cyan)',
                        animation: 'blink 0.4s infinite',
                        borderRadius: '1px',
                        boxShadow: '0 0 6px rgba(6,182,212,0.6)',
                        flexShrink: 0,
                      }} />
                    )}
                    {inputValue.trim() && (
                      <button
                        onClick={() => handleSubmit(inputValue)}
                        style={{
                          background: 'linear-gradient(135deg, var(--ai-indigo), var(--ai-violet))',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          color: '#fff',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          letterSpacing: '0.08em',
                          animation: 'fadeSlideIn 0.2s ease both',
                          whiteSpace: 'nowrap',
                          minHeight: '36px',
                        }}
                      >
                        ENTER ↵
                      </button>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  opacity: chipsVisible ? 1 : 0,
                  transition: 'opacity 0.4s',
                }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-dim)' }} />
                  <span className="mono-xs" style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                    OR SELECT
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-dim)' }} />
                </div>

                {/* Chip suggestions */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  opacity: chipsVisible ? 1 : 0,
                  transform: chipsVisible ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                  {CHIPS.map((chip, i) => (
                    <button
                      key={chip.label}
                      onClick={() => handleChipClick(chip)}
                      className="chip-select chip-touch"
                      style={{
                        animation: `fadeSlideIn 0.4s ease ${i * 0.06}s both`,
                        ['--chip-color' as string]: chip.color,
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ═══ Submitted prompt display ═══ */}
            {phase !== 'input' && (
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '12px',
                padding: '12px 16px',
                border: `1px solid ${accentColor}30`,
                animation: 'fadeSlideIn 0.3s ease both',
              }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--ai-emerald)', fontWeight: 700, fontSize: '14px' }}>✓</span>
                  <span style={{ color: 'var(--text-bright)', fontSize: '13px' }}>{userPrompt}</span>
                </div>
              </div>
            )}

            {/* ═══ AI Analysis HUD ═══ */}
            {(phase === 'analyzing' || phase === 'done') && matchResult && (
              <div style={{ animation: 'fadeSlideIn 0.5s ease both' }}>
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
                  <div style={{ paddingTop: '2px' }}>
                    <span style={{ color: 'var(--text-bright)', fontSize: '13px' }}>
                      프롬프트를 분석하고 게임을 설계합니다...
                    </span>
                    {matchResult.detectedKeywords.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {matchResult.detectedKeywords.slice(0, 4).map(kw => (
                          <span key={kw} style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '9px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: `${accentColor}15`,
                            border: `1px solid ${accentColor}30`,
                            color: accentColor,
                          }}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Analysis Steps */}
                <div style={{
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-dim)',
                  padding: '14px 16px',
                  overflow: 'hidden',
                }}>
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--border-dim)',
                  }}>
                    <span className="mono-xs" style={{ fontSize: '9px', color: 'var(--ai-cyan)', letterSpacing: '0.15em' }}>
                      AI ANALYSIS — {matchResult.confidence}% MATCH
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
                        : `linear-gradient(90deg, var(--ai-indigo), ${accentColor})`,
                      borderRadius: '1px',
                      transition: 'width 0.4s ease, background 0.3s',
                      boxShadow: analysisDone
                        ? '0 0 8px rgba(16,185,129,0.4)'
                        : `0 0 8px ${accentColor}30`,
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
                          {isActive ? (
                            isCurrent ? (
                              <div style={{
                                width: '14px', height: '14px',
                                border: `2px solid ${accentColor}`,
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                                flexShrink: 0,
                              }} />
                            ) : (
                              <div style={{
                                width: '14px', height: '14px',
                                borderRadius: '50%',
                                background: `${accentColor}20`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '8px', color: accentColor, flexShrink: 0,
                              }}>✓</div>
                            )
                          ) : (
                            <div style={{
                              width: '14px', height: '14px',
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
                          color: isActive ? accentColor : 'var(--text-muted)',
                          textShadow: isActive ? `0 0 8px ${accentColor}30` : 'none',
                          opacity: isActive ? 1 : 0,
                          transition: 'opacity 0.3s 0.2s',
                          textAlign: 'right',
                          maxWidth: '55%',
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
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          marginTop: '24px',
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
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
                gap: '5px',
                padding: '3px 9px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-dim)',
                borderRadius: '100px',
              }}>
                {item.dot && <span className={item.dot} />}
                <span className="mono-xs" style={{ fontSize: '7px', color: item.color }}>{item.label}</span>
              </div>
            ))}
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '7px',
            color: 'rgba(255,255,255,0.1)',
            letterSpacing: '0.1em',
          }}>
            AI GAME FACTORY — PROTOTYPE v0.4.0 — NOT FOR DISTRIBUTION
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Build analysis steps dynamically from match result ── */
function buildAnalysisSteps(result: MatchResult, userPrompt: string): { label: string; value: string }[] {
  const game = DEMO_GAMES.find(g => g.id === result.gameId);
  const loc = game ? game.html.split('\n').length : 500;
  return [
    { label: '프롬프트 분석', value: `"${userPrompt.slice(0, 20)}${userPrompt.length > 20 ? '...' : ''}"` },
    { label: '장르 감지', value: result.genre },
    { label: '엔진 선택', value: result.engine },
    { label: '아트 스타일', value: result.artStyle },
    { label: '게임 시스템', value: result.systems },
    { label: '렌더링', value: 'WebGL 2.0 + Canvas Fallback' },
    { label: '예상 코드량', value: `~${loc} Lines of Code` },
  ];
}
