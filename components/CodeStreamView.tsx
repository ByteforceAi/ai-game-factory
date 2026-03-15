'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { simulateCodeGeneration, GENERATE_STATUS_MESSAGES } from '@/lib/codeSimulator';
import { playTick, playComplete, playWhoosh } from '@/lib/sounds';
import ParticleBackground from './ParticleBackground';

interface CodeStreamViewProps {
  gameHtml: string;
  gameTitle: string;
  onComplete: (html: string) => void;
  duration?: number;
  statusMessages?: string[];
  completionText?: string;
}

/** Lightweight Dracula-inspired syntax highlighter */
function highlightCode(code: string): React.ReactNode[] {
  const lines = code.split('\n');
  const result: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (i > 0) result.push('\n');
    const line = lines[i];
    let pos = 0;
    let keyCounter = 0;

    while (pos < line.length) {
      const remaining = line.slice(pos);
      const key = `${i}-${keyCounter++}`;

      // HTML tags
      const tagMatch = remaining.match(/^(<\/?[a-zA-Z][a-zA-Z0-9]*)/);
      if (tagMatch) {
        result.push(<span key={key} style={{ color: '#ff79c6' }}>{tagMatch[0]}</span>);
        pos += tagMatch[0].length;
        continue;
      }

      // Closing > or />
      const closeMatch = remaining.match(/^(\/?>)/);
      if (closeMatch) {
        result.push(<span key={key} style={{ color: '#ff79c6' }}>{closeMatch[0]}</span>);
        pos += closeMatch[0].length;
        continue;
      }

      // HTML attributes (key=)
      const attrKeyMatch = remaining.match(/^([a-zA-Z\-]+)\s*=/);
      if (attrKeyMatch) {
        result.push(<span key={key} style={{ color: '#50fa7b' }}>{attrKeyMatch[1]}</span>);
        result.push(<span key={key + 'eq'} style={{ color: '#6272a4' }}>=</span>);
        pos += attrKeyMatch[0].length;
        continue;
      }

      // Strings
      const strMatch = remaining.match(/^(['"][^'"]*['"])/);
      if (strMatch) {
        result.push(<span key={key} style={{ color: '#f1fa8c' }}>{strMatch[0]}</span>);
        pos += strMatch[0].length;
        continue;
      }

      // JS keywords
      const kwMatch = remaining.match(/^(var|let|const|function|return|if|else|for|while|this|new|class|import|export|default|typeof|instanceof|switch|case|break|continue|throw|try|catch|finally|async|await)\b/);
      if (kwMatch) {
        result.push(<span key={key} style={{ color: '#bd93f9' }}>{kwMatch[0]}</span>);
        pos += kwMatch[0].length;
        continue;
      }

      // Boolean / null
      const boolMatch = remaining.match(/^(true|false|null|undefined)\b/);
      if (boolMatch) {
        result.push(<span key={key} style={{ color: '#bd93f9' }}>{boolMatch[0]}</span>);
        pos += boolMatch[0].length;
        continue;
      }

      // Numbers
      const numMatch = remaining.match(/^-?\d+\.?\d*/);
      if (numMatch) {
        result.push(<span key={key} style={{ color: '#f8f8f2' }}>{numMatch[0]}</span>);
        pos += numMatch[0].length;
        continue;
      }

      // Comments
      const commentMatch = remaining.match(/^(\/\/.*)/);
      if (commentMatch) {
        result.push(<span key={key} style={{ color: '#6272a4', fontStyle: 'italic' }}>{commentMatch[0]}</span>);
        pos += commentMatch[0].length;
        continue;
      }

      // CSS properties
      const cssPropMatch = remaining.match(/^([a-z\-]+)\s*:/);
      if (cssPropMatch && pos > 0) {
        result.push(<span key={key} style={{ color: '#8be9fd' }}>{cssPropMatch[1]}</span>);
        result.push(':');
        pos += cssPropMatch[0].length;
        continue;
      }

      // Default text
      result.push(remaining[0]);
      pos += 1;
    }
  }

  return result;
}

/** AI companion messages that pop up during code generation */
const AI_COMPANION_MESSAGES = [
  { at: 5, text: '열심히 코딩하고 있어요! 💻', emoji: '💻' },
  { at: 15, text: '게임 엔진 뼈대가 잡혔어요! 이제 살을 붙여볼게요 🦴', emoji: '🦴' },
  { at: 25, text: '오 이 부분 좀 까다로운데... 잠깐만요! 🤔', emoji: '🤔' },
  { at: 40, text: '해결했어요! 이 게임 재밌을 것 같아요 🔥', emoji: '🔥' },
  { at: 55, text: '절반 넘었어요! 거의 다 왔어요 💪', emoji: '💪' },
  { at: 70, text: '터치 컨트롤 넣는 중... 모바일에서도 잘 돌아갈 거예요 📱', emoji: '📱' },
  { at: 85, text: '마무리 최적화 중! 곧 플레이할 수 있어요 ✨', emoji: '✨' },
  { at: 95, text: '거의 완성! 두근두근하지 않나요? 🎮', emoji: '🎮' },
];

export default function CodeStreamView({
  gameHtml,
  gameTitle,
  onComplete,
  duration = 6000,
  statusMessages = GENERATE_STATUS_MESSAGES,
  completionText = 'BUILD COMPLETE',
}: CodeStreamViewProps) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('Initializing engine...');
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [companionMsg, setCompanionMsg] = useState('');
  const [companionKey, setCompanionKey] = useState(0);
  const shownMsgsRef = useRef(new Set<number>());
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());
  const cancelRef = useRef<(() => void) | null>(null);

  const handleSkip = useCallback(() => {
    if (done) return;
    cancelRef.current?.();
    setCode(gameHtml);
    setProgress(100);
    setStatus(completionText);
    setDone(true);
    setTimeout(() => onComplete(gameHtml), 400);
  }, [done, gameHtml, onComplete, completionText]);

  // Elapsed timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 200);
    return () => clearInterval(iv);
  }, []);

  const tickCountRef = useRef(0);

  const handleComplete = useCallback((_fullCode: string) => {
    setDone(true);
    playComplete();
    setTimeout(() => {
      playWhoosh();
      // Pass original gameHtml (without comment header) to iframe
      onComplete(gameHtml);
    }, 800);
  }, [onComplete, gameHtml]);

  // Prepend AI header comment to strengthen prompt→code narrative
  const codeHeader = useMemo(() => {
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    return [
      `// ═══════════════════════════════════════════`,
      `// AI GAME FACTORY — ${gameTitle}`,
      `// Generated: ${now} | Engine: WebGL + Canvas`,
      `// Neural Engine v4.0 — CLOSED BETA`,
      `// ═══════════════════════════════════════════`,
      ``,
      ``
    ].join('\n');
  }, [gameTitle]);

  const fullSourceCode = useMemo(() => codeHeader + gameHtml, [codeHeader, gameHtml]);

  useEffect(() => {
    const { cancel } = simulateCodeGeneration(fullSourceCode, {
      onCodeChunk: (c) => {
        setCode(c);
        tickCountRef.current++;
        if (tickCountRef.current % 8 === 0) playTick();
      },
      onStatusChange: setStatus,
      onProgress: setProgress,
      onComplete: handleComplete,
    }, duration, statusMessages);
    cancelRef.current = cancel;
    return () => cancel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameHtml, handleComplete, duration]);

  // AI companion message trigger based on progress
  useEffect(() => {
    if (done) return;
    for (const msg of AI_COMPANION_MESSAGES) {
      if (progress >= msg.at && !shownMsgsRef.current.has(msg.at)) {
        shownMsgsRef.current.add(msg.at);
        setCompanionMsg(msg.text);
        setCompanionKey(prev => prev + 1);
        break;
      }
    }
  }, [progress, done]);

  // Auto-scroll: use sentinel div at bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
  }, [code]);

  const lineCount = code.split('\n').length;
  const tokPerSec = elapsed > 0 ? Math.round(lineCount * 8.5 / elapsed) : 0;

  // Fake system metrics
  const gpu = Math.min(95, 40 + progress * 0.55 + Math.sin(elapsed * 1.3) * 8);
  const mem = (1.2 + progress * 0.028 + Math.sin(elapsed * 0.7) * 0.2).toFixed(1);
  const neural = done ? 0 : Math.round(tokPerSec * (1.2 + Math.sin(elapsed * 2) * 0.3));

  // Only highlight last ~50 lines for performance
  const highlighted = useMemo(() => {
    const lines = code.split('\n');
    const VISIBLE = 50;
    if (lines.length <= VISIBLE) return highlightCode(code);
    const plain = lines.slice(0, lines.length - VISIBLE).join('\n');
    const hl = lines.slice(lines.length - VISIBLE).join('\n');
    return [
      <span key="p" style={{ color: '#44475a' }}>{plain}</span>,
      '\n',
      ...highlightCode(hl),
    ];
  }, [code]);

  // Line number gutter
  const lineNumbers = useMemo(() => {
    const count = code.split('\n').length;
    const nums: string[] = [];
    for (let i = 1; i <= count; i++) nums.push(String(i));
    return nums.join('\n');
  }, [code]);

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      background: '#08081a',
    }}>
      <ParticleBackground />

      {/* ═══ Top Bar ═══ */}
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        position: 'relative',
        zIndex: 2,
        background: 'rgba(8,8,26,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        {/* Status indicator */}
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: done ? 'var(--ai-emerald)' : 'var(--ai-indigo)',
          boxShadow: done
            ? '0 0 12px rgba(16,185,129,0.6)'
            : '0 0 12px rgba(99,102,241,0.6)',
          animation: done ? undefined : 'dot-glow 1.5s ease-in-out infinite',
        }} />

        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: done ? 'var(--ai-emerald)' : 'rgba(99,102,241,0.8)',
        }}>
          {done ? completionText : 'GENERATING'}
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* File name — centered elegant */}
        <span style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.08em',
        }}>
          {gameTitle}.html
        </span>

        {/* Metrics */}
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: 'rgba(255,255,255,0.2)',
            letterSpacing: '0.04em',
          }}>
            {lineCount} <span style={{ opacity: 0.5 }}>LOC</span>
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: 'rgba(6,182,212,0.5)',
            letterSpacing: '0.04em',
          }}>
            ~{tokPerSec} <span style={{ opacity: 0.5 }}>tok/s</span>
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: gpu > 80 ? 'rgba(251,146,60,0.6)' : 'rgba(255,255,255,0.2)',
            letterSpacing: '0.04em',
          }}>
            GPU {Math.round(gpu)}<span style={{ opacity: 0.5 }}>%</span>
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: 'rgba(255,255,255,0.2)',
            letterSpacing: '0.04em',
          }}>
            {mem}<span style={{ opacity: 0.5 }}>GB</span>
          </span>
        </div>
      </div>

      {/* ═══ Code Area ═══ */}
      <div
        ref={scrollRef}
        onClick={!done ? handleSkip : undefined}
        style={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
          zIndex: 1,
          cursor: !done ? 'pointer' : 'default',
        }}
      >
        {/* Top gradient fade — code emerges from darkness */}
        <div style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(to bottom, #08081a 0%, transparent 100%)',
          zIndex: 3,
          pointerEvents: 'none',
          marginBottom: '-60px',
        }} />

        <div style={{
          display: 'flex',
          minHeight: '100%',
          padding: '24px 0',
        }}>
          {/* Line numbers gutter */}
          <pre style={{
            margin: 0,
            padding: '0 16px 0 24px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            lineHeight: 1.8,
            color: 'rgba(255,255,255,0.1)',
            textAlign: 'right',
            userSelect: 'none',
            borderRight: '1px solid rgba(255,255,255,0.03)',
            minWidth: '48px',
            whiteSpace: 'pre',
          }}>
            {lineNumbers}
          </pre>

          {/* Code content */}
          <pre style={{
            margin: 0,
            padding: '0 24px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            lineHeight: 1.8,
            color: '#e2e8f0',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            flex: 1,
            animation: done ? 'glitch-complete 0.3s ease-out' : undefined,
          }}>
            {highlighted}
            {!done && (
              <span style={{
                display: 'inline-block',
                width: '7px',
                height: '16px',
                background: 'linear-gradient(180deg, var(--ai-indigo), var(--ai-violet))',
                animation: 'blink 0.6s ease-in-out infinite',
                marginLeft: '1px',
                verticalAlign: 'middle',
                boxShadow: '0 0 10px rgba(99,102,241,0.8), 0 0 20px rgba(99,102,241,0.3)',
                borderRadius: '1px',
              }} />
            )}
          </pre>
        </div>

        {/* Scroll sentinel — this is what auto-scrolls */}
        <div ref={bottomRef} style={{ height: '1px' }} />

        {/* Bottom gradient fade */}
        <div style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40px',
          background: 'linear-gradient(to top, #08081a 0%, transparent 100%)',
          zIndex: 3,
          pointerEvents: 'none',
          marginTop: '-40px',
        }} />
      </div>

      {/* AI Companion bubble */}
      {companionMsg && !done && (
        <div
          key={companionKey}
          style={{
            position: 'absolute',
            bottom: '90px',
            left: '16px',
            right: '16px',
            zIndex: 10,
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            animation: 'companionSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
            pointerEvents: 'none',
          }}
        >
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0,
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
          }}>
            AI
          </div>
          <div style={{
            background: 'rgba(99,102,241,0.12)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '14px',
            borderTopLeftRadius: '4px',
            padding: '10px 16px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.5,
            maxWidth: '80%',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}>
            {companionMsg}
          </div>
        </div>
      )}

      {/* Skip hint — delayed reveal for visibility */}
      {!done && (
        <div style={{
          textAlign: 'center',
          padding: '6px 0',
          position: 'relative',
          zIndex: 2,
          animation: 'fadeIn 0.5s ease 2s both',
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.12em',
            animation: 'pulse-subtle 2s ease-in-out infinite',
          }}>
            TAP TO SKIP ▸
          </span>
        </div>
      )}

      {/* ═══ Bottom Bar ═══ */}
      <div style={{
        padding: '14px 24px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        position: 'relative',
        zIndex: 2,
        background: 'rgba(8,8,26,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        {/* Progress bar */}
        <div style={{
          height: '2px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '1px',
          overflow: 'hidden',
          marginBottom: '12px',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: done
              ? 'linear-gradient(90deg, var(--ai-emerald), #34d399)'
              : 'linear-gradient(90deg, var(--ai-indigo), var(--ai-violet), var(--ai-cyan))',
            backgroundSize: done ? '100% 100%' : '200% 100%',
            animation: done ? undefined : 'shimmer-bar 2s linear infinite',
            borderRadius: '1px',
            transition: 'width 0.3s ease',
            boxShadow: done
              ? '0 0 12px rgba(16,185,129,0.5)'
              : '0 0 12px rgba(99,102,241,0.4)',
          }} />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Status message */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: done ? 'var(--ai-emerald)' : 'var(--ai-indigo)',
              boxShadow: done
                ? '0 0 8px rgba(16,185,129,0.5)'
                : '0 0 8px rgba(99,102,241,0.5)',
              animation: done ? undefined : 'dot-glow 1.5s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 400,
              color: done ? 'rgba(16,185,129,0.8)' : 'rgba(255,255,255,0.3)',
              letterSpacing: '0.02em',
            }}>
              {done ? completionText : status}
            </span>
          </div>

          {/* Progress + time */}
          <div style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'center',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: done ? 'rgba(16,185,129,0.6)' : 'rgba(99,102,241,0.5)',
              fontWeight: 500,
              letterSpacing: '0.05em',
            }}>
              {progress}%
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: 'rgba(255,255,255,0.15)',
              letterSpacing: '0.05em',
            }}>
              {elapsed}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
