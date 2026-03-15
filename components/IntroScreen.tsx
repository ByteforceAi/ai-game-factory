'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ParticleBackground from './ParticleBackground';
import { initAudio, playWhoosh, playTick } from '@/lib/sounds';

interface IntroScreenProps {
  onComplete: () => void;
}

/* ──────────────────────────────────────────────
   Code Materializer: each step has code to "type"
   and a UI element to materialize simultaneously
   ────────────────────────────────────────────── */
interface MaterialStep {
  code: string;
  uiKey: string; // which UI element to materialize
  delay: number; // ms from start
  typeDuration: number; // ms to type this code
}

const MATERIAL_STEPS: MaterialStep[] = [
  {
    code: '// initializing vibe-coding-ai...\n',
    uiKey: 'none',
    delay: 0,
    typeDuration: 600,
  },
  {
    code: '<div class="terminal-frame"\n  backdrop-filter: blur(20px)\n  border-radius: 16px\n  border: 1px solid rgba(255,255,255,0.06)>\n',
    uiKey: 'frame',
    delay: 700,
    typeDuration: 900,
  },
  {
    code: '  <header>\n    ● ● ● vibe-coding-ai — terminal\n  </header>\n\n',
    uiKey: 'header',
    delay: 1800,
    typeDuration: 600,
  },
  {
    code: '  <prompt cursor="blink">\n    > 만들고 싶은 게임을 선택하세요\n  </prompt>\n\n',
    uiKey: 'prompt',
    delay: 2600,
    typeDuration: 700,
  },
  {
    code: '  <chips layout="flex" gap="8px">\n    <chip glow="#00FFFF">우주 슈팅게임</chip>\n    <chip glow="#FF00FF">네온 플랫포머</chip>\n    <chip glow="#00CCFF">3D 러너</chip>\n    <chip glow="#B400FF">테트리스</chip>\n  </chips>\n\n',
    uiKey: 'chips',
    delay: 3500,
    typeDuration: 1100,
  },
  {
    code: '  <statusbar>\n    ● ONLINE  PHASER.JS  THREE.JS  WEBGL 2.0\n  </statusbar>\n',
    uiKey: 'statusbar',
    delay: 4800,
    typeDuration: 600,
  },
  {
    code: '</div>\n\n// neural.engine.connect();\n// ready.',
    uiKey: 'ready',
    delay: 5600,
    typeDuration: 500,
  },
];

const TOTAL_DURATION = 6800; // ms until transition starts

type Phase = 'idle' | 'materializing' | 'transitioning';

/** Dracula-ish syntax highlight for the materializer code */
function highlightMaterialCode(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  const lines = text.split('\n');

  for (let li = 0; li < lines.length; li++) {
    if (li > 0) result.push('\n');
    const line = lines[li];
    let pos = 0;
    let keyC = 0;

    while (pos < line.length) {
      const rem = line.slice(pos);
      const k = `${li}-${keyC++}`;

      // Comments
      const cm = rem.match(/^\/\/.*/);
      if (cm) {
        result.push(<span key={k} style={{ color: '#6272a4', fontStyle: 'italic' }}>{cm[0]}</span>);
        pos += cm[0].length;
        continue;
      }

      // Tags
      const tag = rem.match(/^(<\/?[a-zA-Z][a-zA-Z0-9-]*)/);
      if (tag) {
        result.push(<span key={k} style={{ color: '#ff79c6' }}>{tag[0]}</span>);
        pos += tag[0].length;
        continue;
      }

      // Closing >
      const cl = rem.match(/^>/);
      if (cl) {
        result.push(<span key={k} style={{ color: '#ff79c6' }}>{'>'}</span>);
        pos += 1;
        continue;
      }

      // Attributes key=
      const attr = rem.match(/^([a-zA-Z-]+)=/);
      if (attr) {
        result.push(<span key={k} style={{ color: '#50fa7b' }}>{attr[1]}</span>);
        result.push(<span key={k + 'e'} style={{ color: '#6272a4' }}>=</span>);
        pos += attr[0].length;
        continue;
      }

      // Strings
      const str = rem.match(/^"[^"]*"/);
      if (str) {
        result.push(<span key={k} style={{ color: '#f1fa8c' }}>{str[0]}</span>);
        pos += str[0].length;
        continue;
      }

      // Korean text inside tags
      const kr = rem.match(/^[가-힣\s]+/);
      if (kr) {
        result.push(<span key={k} style={{ color: '#f8f8f2' }}>{kr[0]}</span>);
        pos += kr[0].length;
        continue;
      }

      // Dots (traffic light)
      const dots = rem.match(/^● ● ●/);
      if (dots) {
        result.push(
          <span key={k}>
            <span style={{ color: '#ff5f57' }}>●</span>{' '}
            <span style={{ color: '#febc2e' }}>●</span>{' '}
            <span style={{ color: '#28c840' }}>●</span>
          </span>
        );
        pos += dots[0].length;
        continue;
      }

      // Single dot
      if (rem[0] === '●') {
        result.push(<span key={k} style={{ color: '#28c840' }}>●</span>);
        pos += 1;
        continue;
      }

      // CSS-like properties
      const css = rem.match(/^([a-z-]+):\s/);
      if (css) {
        result.push(<span key={k} style={{ color: '#8be9fd' }}>{css[1]}</span>);
        result.push(': ');
        pos += css[0].length;
        continue;
      }

      // Numbers
      const num = rem.match(/^-?\d+\.?\d*(px|%|em)?/);
      if (num) {
        result.push(<span key={k} style={{ color: '#bd93f9' }}>{num[0]}</span>);
        pos += num[0].length;
        continue;
      }

      // Default
      result.push(rem[0]);
      pos += 1;
    }
  }
  return result;
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [codeText, setCodeText] = useState('');
  const [visibleUI, setVisibleUI] = useState<Set<string>>(new Set());
  const [fadeOut, setFadeOut] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const skipToEnd = useCallback(() => {
    // Clear all pending timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    // Jump to final state
    const fullCode = MATERIAL_STEPS.map(s => s.code).join('');
    setCodeText(fullCode);
    setVisibleUI(new Set(MATERIAL_STEPS.map(s => s.uiKey).filter(k => k !== 'none')));
    setPhase('transitioning');
    setFadeOut(true);
    setTimeout(() => onComplete(), 600);
  }, [onComplete]);

  const handleStart = useCallback(() => {
    if (phase !== 'idle') return;
    initAudio();
    setPhase('materializing');

    const timers: ReturnType<typeof setTimeout>[] = [];
    let accumulated = '';

    MATERIAL_STEPS.forEach((step) => {
      const chars = step.code.split('');
      const charDelay = step.typeDuration / chars.length;

      // Type each character
      chars.forEach((char, ci) => {
        timers.push(setTimeout(() => {
          accumulated += char;
          setCodeText(accumulated);
          if (ci % 3 === 0 && char.trim()) playTick();
        }, step.delay + ci * charDelay));
      });

      // Reveal UI element when typing finishes
      if (step.uiKey !== 'none') {
        timers.push(setTimeout(() => {
          setVisibleUI(prev => new Set(prev).add(step.uiKey));
        }, step.delay + step.typeDuration * 0.6));
      }
    });

    // Transition out
    timers.push(setTimeout(() => {
      playWhoosh();
      setPhase('transitioning');
      setFadeOut(true);
      timers.push(setTimeout(() => onComplete(), 1000));
    }, TOTAL_DURATION));

    timersRef.current = timers;
  }, [phase, onComplete]);

  const highlighted = useMemo(() => highlightMaterialCode(codeText), [codeText]);

  const uiVisible = (key: string) => visibleUI.has(key);

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
      transition: 'opacity 1s ease-out',
    }}>
      <ParticleBackground />

      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
        width: 'min(520px, 92vw)',
      }}>
        {/* ═══ Phase: idle — Logo + START ═══ */}
        {phase === 'idle' && (
          <>
            {/* Closed Beta badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '8px',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '3px 10px',
                borderRadius: '100px',
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#a5b4fc',
              }}>
                CLOSED BETA
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '8px',
                fontWeight: 500,
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.2)',
              }}>
                BUILD 2026.03
              </span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <h1 style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 'clamp(28px, 6vw, 44px)',
                fontWeight: 700,
                letterSpacing: '0.15em',
                lineHeight: 1.2,
                color: 'var(--text-bright)',
                margin: 0,
                textShadow: '0 0 40px rgba(99,102,241,0.2), 0 0 80px rgba(99,102,241,0.08)',
              }}>
                VIBE CODING
              </h1>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 'clamp(12px, 2.5vw, 16px)',
                fontWeight: 300,
                letterSpacing: '0.4em',
                color: 'rgba(255,255,255,0.25)',
                marginTop: '8px',
              }}>
                SIMULATOR
              </div>
            </div>

            <div className="shimmer-line" style={{ width: '120px' }} />

            <button onClick={handleStart} className="btn-start">
              START
            </button>

            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: 'rgba(255,255,255,0.12)',
              letterSpacing: '0.08em',
              marginTop: '-20px',
            }}>
              tap to initialize neural engine
            </span>

            {/* Vibe coding explainer */}
            <div style={{
              marginTop: '32px',
              padding: '12px 20px',
              borderRadius: '12px',
              background: 'rgba(99,102,241,0.05)',
              border: '1px solid rgba(99,102,241,0.1)',
              maxWidth: '360px',
              textAlign: 'center',
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: 'rgba(255,255,255,0.3)',
                lineHeight: 1.6,
                letterSpacing: '0.02em',
              }}>
                <span style={{ color: 'rgba(99,102,241,0.6)', fontWeight: 600 }}>VIBE CODING</span>
                {' — '}말로 설명하면 AI가 코드를 작성하고,
                <br />코드가 현실이 됩니다.
              </span>
            </div>
          </>
        )}

        {/* ═══ Phase: materializing — Code + UI in parallel ═══ */}
        {(phase === 'materializing' || phase === 'transitioning') && (
          <div
            onClick={phase === 'materializing' ? skipToEnd : undefined}
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '16px' : '24px',
              width: '100%',
              alignItems: 'flex-start',
              cursor: phase === 'materializing' ? 'pointer' : 'default',
            }}>
            {/* LEFT: Code stream */}
            <div style={{
              flex: isMobile ? 'none' : '0 0 48%',
              width: isMobile ? '100%' : undefined,
              maxHeight: isMobile ? '160px' : '420px',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {/* Top fade */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '30px',
                background: 'linear-gradient(to bottom, #050510, transparent)',
                zIndex: 3,
                pointerEvents: 'none',
              }} />

              <pre style={{
                margin: 0,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                lineHeight: 1.7,
                color: '#e2e8f0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                direction: 'ltr',
              }}>
                {highlighted}
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '13px',
                  background: 'linear-gradient(180deg, var(--ai-indigo), var(--ai-violet))',
                  animation: 'blink 0.6s ease-in-out infinite',
                  marginLeft: '1px',
                  verticalAlign: 'middle',
                  boxShadow: '0 0 8px rgba(99,102,241,0.6)',
                  borderRadius: '1px',
                }} />
              </pre>

              {/* Bottom fade */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '40px',
                background: 'linear-gradient(to top, #050510, transparent)',
                zIndex: 3,
                pointerEvents: 'none',
              }} />
            </div>

            {/* RIGHT: Materializing UI */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '0',
              position: 'relative',
            }}>
              {/* Terminal frame */}
              <div style={{
                background: uiVisible('frame') ? 'rgba(5,5,16,0.7)' : 'transparent',
                border: uiVisible('frame') ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                borderRadius: '14px',
                padding: uiVisible('frame') ? '16px' : '16px',
                backdropFilter: uiVisible('frame') ? 'blur(20px)' : 'none',
                WebkitBackdropFilter: uiVisible('frame') ? 'blur(20px)' : 'none',
                opacity: uiVisible('frame') ? 1 : 0,
                transform: uiVisible('frame') ? 'scale(1)' : 'scale(0.95)',
                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minHeight: '260px',
                boxShadow: uiVisible('frame')
                  ? '0 0 40px rgba(99,102,241,0.08), 0 8px 32px rgba(0,0,0,0.3)'
                  : 'none',
              }}>
                {/* Header dots */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  opacity: uiVisible('header') ? 1 : 0,
                  transform: uiVisible('header') ? 'translateY(0)' : 'translateY(-8px)',
                  transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ff5f57' }} />
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#febc2e' }} />
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#28c840' }} />
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '8px',
                    color: 'rgba(255,255,255,0.2)',
                    marginLeft: '8px',
                    letterSpacing: '0.05em',
                  }}>
                    vibe-coding-ai
                  </span>
                </div>

                {/* Prompt line */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  opacity: uiVisible('prompt') ? 1 : 0,
                  transform: uiVisible('prompt') ? 'translateX(0)' : 'translateX(-12px)',
                  transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                  <span style={{ color: 'var(--ai-cyan)', fontWeight: 600 }}>{'>'}</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}>만들고 싶은 게임을 선택하세요</span>
                  <span style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '12px',
                    background: 'var(--ai-indigo)',
                    animation: uiVisible('prompt') ? 'blink 0.6s ease-in-out infinite' : 'none',
                    borderRadius: '1px',
                  }} />
                </div>

                {/* Chips */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginTop: '4px',
                  opacity: uiVisible('chips') ? 1 : 0,
                  transform: uiVisible('chips') ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                  {[
                    { label: '우주 슈팅게임', color: '#00FFFF' },
                    { label: '네온 플랫포머', color: '#FF00FF' },
                    { label: '3D 러너', color: '#00CCFF' },
                    { label: '테트리스', color: '#B400FF' },
                  ].map((chip, i) => (
                    <div
                      key={chip.label}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '9px',
                        fontWeight: 500,
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: `1px solid ${chip.color}30`,
                        color: `${chip.color}cc`,
                        background: `${chip.color}08`,
                        opacity: uiVisible('chips') ? 1 : 0,
                        transform: uiVisible('chips') ? 'scale(1)' : 'scale(0.8)',
                        transition: `all 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 100}ms`,
                      }}
                    >
                      {chip.label}
                    </div>
                  ))}
                </div>

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* Status bar */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  opacity: uiVisible('statusbar') ? 1 : 0,
                  transform: uiVisible('statusbar') ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <div style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: 'var(--ai-emerald)',
                      boxShadow: '0 0 6px rgba(16,185,129,0.5)',
                    }} />
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '8px',
                      color: 'var(--ai-emerald)',
                      letterSpacing: '0.1em',
                    }}>
                      ONLINE
                    </span>
                  </div>
                  {['PHASER.JS', 'THREE.JS', 'WEBGL 2.0'].map(t => (
                    <span key={t} style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '7px',
                      color: 'rgba(255,255,255,0.2)',
                      letterSpacing: '0.08em',
                      padding: '2px 6px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '4px',
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ready glow */}
              {uiVisible('ready') && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '12px',
                  animation: 'fadeSlideIn 0.4s ease-out',
                }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '9px',
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    color: 'var(--ai-emerald)',
                    textShadow: '0 0 16px rgba(16,185,129,0.5)',
                  }}>
                    READY
                  </span>
                </div>
              )}
            </div>

            {/* Skip hint */}
            {phase === 'materializing' && (
              <div style={{
                position: 'absolute',
                bottom: isMobile ? '-28px' : '-32px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '8px',
                color: 'rgba(255,255,255,0.15)',
                letterSpacing: '0.1em',
                animation: 'pulse-subtle 2s ease-in-out infinite',
                whiteSpace: 'nowrap',
              }}>
                TAP TO SKIP
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom version label — idle only */}
      {phase === 'idle' && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px',
          color: 'rgba(255,255,255,0.08)',
          letterSpacing: '0.1em',
          zIndex: 2,
        }}>
          AI GAME FACTORY — CLOSED BETA — v0.4.0
        </div>
      )}
    </div>
  );
}
