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
  accentColor?: string;
  gameIcon?: string;
}

/** ═══ Build Pipeline Stages ═══ */
const PIPELINE_STAGES = [
  { id: 'structure', label: 'Structure', icon: '📐', range: [0, 18] as const, color: '#ff79c6' },
  { id: 'render',    label: 'Renderer',  icon: '🎨', range: [15, 38] as const, color: '#bd93f9' },
  { id: 'engine',    label: 'Engine',    icon: '⚙️', range: [32, 58] as const, color: '#f1fa8c' },
  { id: 'physics',   label: 'Physics',   icon: '💫', range: [50, 72] as const, color: '#ffb86c' },
  { id: 'input',     label: 'Input',     icon: '🎮', range: [65, 85] as const, color: '#50fa7b' },
  { id: 'polish',    label: 'Polish',    icon: '✨', range: [78, 100] as const, color: '#8be9fd' },
];

function BuildPipelineBar({ progress, done, companionLabel }: { progress: number; done: boolean; companionLabel: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      padding: '8px 16px',
      background: 'rgba(8,8,26,0.92)',
      borderBottom: '1px solid rgba(255,255,255,0.03)',
      position: 'relative',
      zIndex: 5,
      overflowX: 'auto',
      overflowY: 'hidden',
      minHeight: '36px',
      flexShrink: 0,
    }}>
      {PIPELINE_STAGES.map((stage, idx) => {
        const [start, end] = stage.range;
        const stageProgress = progress <= start ? 0
          : progress >= end ? 1
          : (progress - start) / (end - start);
        const isActive = stageProgress > 0 && stageProgress < 1;
        const isDone = stageProgress >= 1;
        // Check if current AI companion insight matches this stage
        const isHighlighted = companionLabel && (
          (stage.id === 'structure' && ['HTML', 'CSS'].includes(companionLabel)) ||
          (stage.id === 'render' && ['Canvas', 'Render'].includes(companionLabel)) ||
          (stage.id === 'engine' && ['Engine', 'Loop'].includes(companionLabel)) ||
          (stage.id === 'physics' && ['Physics', 'Collision'].includes(companionLabel)) ||
          (stage.id === 'input' && ['Input', 'Audio'].includes(companionLabel)) ||
          (stage.id === 'polish' && ['Score', 'VFX', 'GameOver'].includes(companionLabel))
        );

        return (
          <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {/* Stage pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: done
                ? 'rgba(16,185,129,0.1)'
                : isDone
                  ? `${stage.color}15`
                  : isActive
                    ? `${stage.color}12`
                    : 'rgba(255,255,255,0.02)',
              border: `1px solid ${
                done
                  ? 'rgba(16,185,129,0.3)'
                  : isDone
                    ? `${stage.color}30`
                    : isActive
                      ? `${stage.color}25`
                      : 'rgba(255,255,255,0.04)'
              }`,
              boxShadow: isHighlighted && isActive
                ? `0 0 12px ${stage.color}30`
                : 'none',
              transition: 'all 0.5s ease',
              flexShrink: 0,
            }}>
              {/* Status icon */}
              <span style={{ fontSize: '10px', lineHeight: 1 }}>
                {done ? '✅' : isDone ? '✅' : isActive ? stage.icon : '○'}
              </span>

              {/* Label */}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '8px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: done
                  ? 'rgba(16,185,129,0.8)'
                  : isDone
                    ? `${stage.color}cc`
                    : isActive
                      ? stage.color
                      : 'rgba(255,255,255,0.15)',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                transition: 'color 0.5s ease',
              }}>
                {stage.label}
              </span>

              {/* Mini progress bar inside active stage */}
              {isActive && !done && (
                <div style={{
                  width: '24px',
                  height: '3px',
                  borderRadius: '2px',
                  background: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: `${stageProgress * 100}%`,
                    height: '100%',
                    borderRadius: '2px',
                    background: stage.color,
                    boxShadow: `0 0 6px ${stage.color}60`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              )}
            </div>

            {/* Arrow connector */}
            {idx < PIPELINE_STAGES.length - 1 && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '8px',
                color: isDone ? `${stage.color}40` : 'rgba(255,255,255,0.06)',
                transition: 'color 0.5s ease',
                flexShrink: 0,
              }}>
                →
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
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

/** AI companion — code pattern detection + contextual line pointing */
interface CodeInsight {
  pattern: RegExp;
  text: string;
  label: string;       // short label for the pointer badge
  color: string;       // accent color
  priority: number;    // higher = shown later (prevents early spoilers)
}

const CODE_INSIGHTS: CodeInsight[] = [
  { pattern: /<!DOCTYPE|<html|<head/i, text: 'HTML 문서 구조를 잡고 있어요', label: 'HTML', color: '#ff79c6', priority: 0 },
  { pattern: /<style|css|background|color:|font-/i, text: '스타일링 넣는 중... 예쁘게 만들어 볼게요!', label: 'CSS', color: '#8be9fd', priority: 1 },
  { pattern: /<canvas/i, text: '캔버스 생성! 여기에 게임이 그려져요 🎨', label: 'Canvas', color: '#50fa7b', priority: 2 },
  { pattern: /getContext\s*\(\s*['"]2d['"]\)|WebGL|webgl/i, text: '렌더링 컨텍스트 연결 완료!', label: 'Render', color: '#bd93f9', priority: 3 },
  { pattern: /class\s+\w+|function\s+\w+Game|const\s+game/i, text: '게임 클래스 설계 중... 뼈대가 잡혔어요! 🦴', label: 'Engine', color: '#f1fa8c', priority: 4 },
  { pattern: /velocity|gravity|acceleration|physics|Math\.(sin|cos|sqrt|abs|random)/i, text: '물리 엔진 계산식이에요! 자연스러운 움직임의 비밀 ⚡', label: 'Physics', color: '#ffb86c', priority: 5 },
  { pattern: /collision|hitbox|intersect|overlap|AABB|bounce/i, text: '충돌 감지 시스템! 이게 게임을 게임답게 만들어요 💥', label: 'Collision', color: '#ff5555', priority: 6 },
  { pattern: /addEventListener|keydown|keyup|touch|click|pointer/i, text: '입력 핸들러 연결 중... 터치도 키보드도 OK! 🎮', label: 'Input', color: '#50fa7b', priority: 7 },
  { pattern: /new\s+Audio|AudioContext|playSound|sound|\.mp3|\.wav/i, text: '사운드 이펙트 추가! 소리가 있으면 몰입감이 달라요 🔊', label: 'Audio', color: '#f8f8f2', priority: 8 },
  { pattern: /score|point|life|lives|health|level/i, text: '점수 시스템 구현 중! 중독성의 핵심이죠 🏆', label: 'Score', color: '#f1fa8c', priority: 9 },
  { pattern: /requestAnimationFrame|gameLoop|update\s*\(|render\s*\(/i, text: '게임 루프 가동! 초당 60프레임으로 돌아가요 🔄', label: 'Loop', color: '#bd93f9', priority: 10 },
  { pattern: /particle|spawn|emit|explosion|effect/i, text: '파티클 이펙트! 시각적 화려함 추가 ✨', label: 'VFX', color: '#ff79c6', priority: 11 },
  { pattern: /gameOver|game_over|endGame|restart|reset/i, text: '게임 오버 처리... 다시 시작 버튼도 만들어야지!', label: 'GameOver', color: '#ff5555', priority: 12 },
];

/** Fallback progress-based messages (when no code pattern matches) */
const FALLBACK_MESSAGES = [
  { at: 5, text: '열심히 코딩하고 있어요! 💻' },
  { at: 30, text: '오 이 부분 좀 까다로운데... 잠깐만요! 🤔' },
  { at: 55, text: '절반 넘었어요! 거의 다 왔어요 💪' },
  { at: 85, text: '마무리 최적화 중! 곧 플레이할 수 있어요 ✨' },
  { at: 95, text: '거의 완성! 두근두근하지 않나요? 🎮' },
];

export default function CodeStreamView({
  gameHtml,
  gameTitle,
  onComplete,
  duration = 55000,
  statusMessages = GENERATE_STATUS_MESSAGES,
  completionText = 'BUILD COMPLETE',
  accentColor = '#6366f1',
  gameIcon = '◆',
}: CodeStreamViewProps) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('Initializing engine...');
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [companionMsg, setCompanionMsg] = useState('');
  const [companionLabel, setCompanionLabel] = useState('');
  const [companionColor, setCompanionColor] = useState('#6366f1');
  const [companionLine, setCompanionLine] = useState(0); // 0 = bottom float, >0 = pointing to line
  const [companionKey, setCompanionKey] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewSrcdoc, setPreviewSrcdoc] = useState('');
  const shownInsightsRef = useRef(new Set<number>()); // tracks shown insight priorities
  const shownFallbacksRef = useRef(new Set<number>());
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());
  const cancelRef = useRef<(() => void) | null>(null);
  const lastPreviewUpdateRef = useRef(0);

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

  // ═══ Smart AI Companion — code pattern detection + line pointing ═══
  useEffect(() => {
    if (done) return;

    // Scan last ~20 lines for new patterns
    const lines = code.split('\n');
    const scanStart = Math.max(0, lines.length - 20);
    const recentCode = lines.slice(scanStart).join('\n');

    // Find a new insight that hasn't been shown yet
    for (const insight of CODE_INSIGHTS) {
      if (shownInsightsRef.current.has(insight.priority)) continue;
      const match = recentCode.match(insight.pattern);
      if (match) {
        shownInsightsRef.current.add(insight.priority);

        // Find the exact line number of the match
        const matchIdx = recentCode.indexOf(match[0]);
        const linesBeforeMatch = recentCode.slice(0, matchIdx).split('\n').length;
        const matchLineNum = scanStart + linesBeforeMatch;

        setCompanionMsg(insight.text);
        setCompanionLabel(insight.label);
        setCompanionColor(insight.color);
        setCompanionLine(matchLineNum);
        setCompanionKey(prev => prev + 1);
        return; // Only one insight per update
      }
    }

    // Fallback progress-based messages
    for (const fb of FALLBACK_MESSAGES) {
      if (progress >= fb.at && !shownFallbacksRef.current.has(fb.at)) {
        shownFallbacksRef.current.add(fb.at);
        setCompanionMsg(fb.text);
        setCompanionLabel('');
        setCompanionColor('#6366f1');
        setCompanionLine(0); // bottom float
        setCompanionKey(prev => prev + 1);
        return;
      }
    }
  }, [code, progress, done]);

  // ═══ Live Mini Preview — debounced srcdoc update ═══
  // Update preview every 8% progress or 600ms, whichever comes first
  useEffect(() => {
    if (done) return;
    const now = Date.now();
    const timeSinceLast = now - lastPreviewUpdateRef.current;
    const progressThreshold = progress >= 20; // Only start preview after 20%

    if (progressThreshold && (timeSinceLast > 600 || progress % 8 < 1.5)) {
      // Extract raw HTML (skip the comment header)
      const htmlStart = code.indexOf('<!');
      const rawHtml = htmlStart >= 0 ? code.slice(htmlStart) : code;

      // Only update if we have meaningful HTML content
      if (rawHtml.length > 100) {
        lastPreviewUpdateRef.current = now;
        setPreviewSrcdoc(rawHtml);
      }
    }
  }, [progress, code, done]);

  // Final preview with complete code
  useEffect(() => {
    if (done) {
      setPreviewSrcdoc(gameHtml);
    }
  }, [done, gameHtml]);

  // Auto-scroll: use sentinel div at bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
  }, [code]);

  const lineCount = code.split('\n').length;
  // Opus 4.6 speed: ~30-60 tok/s with variance
  const tokPerSec = elapsed > 0 ? Math.round(lineCount * 3.8 / elapsed) : 0;
  const currentLineNum = lineCount;

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

  // Line number gutter — with active line highlight + insight line glow
  const lineNumberElements = useMemo(() => {
    const elems: React.ReactNode[] = [];
    for (let i = 1; i <= lineCount; i++) {
      const isActive = !done && i === lineCount;
      const isNear = !done && i >= lineCount - 2 && i < lineCount;
      // Highlight insight-pointed line
      const isInsightLine = !done && companionLine > 0 && Math.abs(i - companionLine) <= 1;
      elems.push(
        <div
          key={i}
          style={{
            color: isActive
              ? 'rgba(99,102,241,0.9)'
              : isInsightLine
                ? companionColor + 'cc'
                : isNear
                  ? 'rgba(99,102,241,0.3)'
                  : 'rgba(255,255,255,0.1)',
            textShadow: isActive
              ? '0 0 8px rgba(99,102,241,0.6)'
              : isInsightLine
                ? `0 0 8px ${companionColor}66`
                : 'none',
            transition: 'color 0.3s ease, text-shadow 0.3s ease',
          }}
        >
          {i}
        </div>
      );
    }
    return elems;
  }, [lineCount, done, companionLine, companionColor]);

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

      {/* ═══ Top Bar — FIXED ═══ */}
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        position: 'relative',
        zIndex: 5,
        background: 'rgba(8,8,26,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        flexShrink: 0,
      }}>
        {/* Game icon + Status indicator */}
        <span style={{
          fontSize: '14px',
          lineHeight: 1,
          filter: done ? 'none' : 'saturate(1.5)',
        }}>
          {gameIcon}
        </span>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: done ? 'var(--ai-emerald)' : accentColor,
          boxShadow: done
            ? '0 0 12px rgba(16,185,129,0.6)'
            : `0 0 12px ${accentColor}99`,
          animation: done ? undefined : 'dot-glow 1.5s ease-in-out infinite',
        }} />

        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: done ? 'var(--ai-emerald)' : accentColor + 'cc',
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

      {/* ═══ Build Pipeline Bar ═══ */}
      <BuildPipelineBar progress={progress} done={done} companionLabel={companionLabel} />

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
          {/* Line numbers gutter — active line highlighted */}
          <div style={{
            margin: 0,
            padding: '0 16px 0 24px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            lineHeight: 1.8,
            textAlign: 'right',
            userSelect: 'none',
            borderRight: '1px solid rgba(255,255,255,0.03)',
            minWidth: '48px',
            whiteSpace: 'pre',
          }}>
            {lineNumberElements}
          </div>

          {/* Code content with active line glow */}
          <div style={{ flex: 1, position: 'relative' }}>
            {/* Active line highlight bar */}
            {!done && lineCount > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${(lineCount - 1) * 18}px`,
                  height: '18px',
                  background: 'linear-gradient(90deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.03) 60%, transparent 100%)',
                  borderLeft: '2px solid rgba(99,102,241,0.5)',
                  boxShadow: '0 0 20px rgba(99,102,241,0.08)',
                  pointerEvents: 'none',
                  transition: 'top 0.05s linear',
                  zIndex: 1,
                }}
              />
            )}
            {/* Insight line highlight — colored glow on the matched code section */}
            {!done && companionLine > 0 && companionLine < lineCount - 3 && (
              <div
                key={`insight-${companionKey}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${(companionLine - 1) * 18}px`,
                  height: '54px', // 3 lines
                  background: `linear-gradient(90deg, ${companionColor}0a 0%, ${companionColor}04 60%, transparent 100%)`,
                  borderLeft: `2px solid ${companionColor}60`,
                  boxShadow: `0 0 30px ${companionColor}08`,
                  pointerEvents: 'none',
                  zIndex: 0,
                  animation: 'insightGlow 2s ease-out forwards',
                }}
              />
            )}
            <pre style={{
              margin: 0,
              padding: '0 24px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              lineHeight: 1.8,
              color: '#e2e8f0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              position: 'relative',
              zIndex: 2,
              animation: done ? 'glitch-complete 0.3s ease-out' : undefined,
            }}>
              {highlighted}
              {!done && (
                <span className="code-cursor" style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '18px',
                  background: 'linear-gradient(180deg, #818cf8, #6366f1)',
                  animation: 'cursorPulse 0.8s ease-in-out infinite',
                  marginLeft: '1px',
                  verticalAlign: 'middle',
                  boxShadow: `
                    0 0 8px rgba(99,102,241,1),
                    0 0 20px rgba(99,102,241,0.6),
                    0 0 40px rgba(99,102,241,0.3),
                    0 0 60px rgba(139,92,246,0.15)
                  `,
                  borderRadius: '1px',
                  position: 'relative',
                }} />
              )}
            </pre>
          </div>
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

      {/* ═══ Fixed Bottom Bar ═══ */}
      <div style={{
        flexShrink: 0,
        padding: '10px 20px',
        background: 'rgba(8,8,26,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 5,
        position: 'relative',
      }}>
        {/* Status message */}
        <div style={{
          flex: 1,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          color: done ? 'rgba(16,185,129,0.8)' : 'rgba(255,255,255,0.4)',
          letterSpacing: '0.04em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {done ? '✓ Build complete' : `⟳ ${status}`}
        </div>

        {/* Progress mini bar */}
        <div style={{
          width: '80px',
          height: '4px',
          borderRadius: '2px',
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            borderRadius: '2px',
            background: done
              ? 'rgba(16,185,129,0.8)'
              : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            boxShadow: done ? '0 0 8px rgba(16,185,129,0.4)' : '0 0 8px rgba(99,102,241,0.4)',
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Percent */}
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          fontWeight: 600,
          color: done ? 'rgba(16,185,129,0.8)' : 'rgba(99,102,241,0.7)',
          minWidth: '32px',
          textAlign: 'right',
          flexShrink: 0,
        }}>
          {progress}%
        </span>

        {/* Elapsed time */}
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px',
          color: 'rgba(255,255,255,0.2)',
          flexShrink: 0,
        }}>
          {elapsed}s
        </span>

        {/* Skip button */}
        {!done && (
          <button
            onClick={handleSkip}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.35)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              fontWeight: 500,
              cursor: 'pointer',
              flexShrink: 0,
              letterSpacing: '0.06em',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
            }}
          >
            SKIP ▸
          </button>
        )}
      </div>

      {/* ═══ AI Companion — Elegant Toast Notification ═══ */}
      {companionMsg && !done && (
        <div
          key={companionKey}
          style={{
            position: 'absolute',
            bottom: '70px',
            left: '20px',
            right: '20px',
            zIndex: 10,
            animation: 'companionSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
            pointerEvents: 'none',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 20px',
            background: 'rgba(10,10,32,0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '16px',
            border: `1px solid ${companionColor}30`,
            boxShadow: `
              0 8px 32px rgba(0,0,0,0.5),
              0 0 0 1px rgba(255,255,255,0.03),
              inset 0 1px 0 rgba(255,255,255,0.05),
              0 0 40px ${companionColor}08
            `,
          }}>
            {/* AI Avatar with glow ring */}
            <div style={{
              width: '36px', height: '36px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${companionColor}, #a855f7)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 800, color: '#fff', flexShrink: 0,
              boxShadow: `0 0 20px ${companionColor}50, 0 4px 12px rgba(0,0,0,0.3)`,
              letterSpacing: '0.04em',
            }}>
              AI
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Label + line number */}
              {companionLabel && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '4px',
                }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: `${companionColor}25`,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: companionColor,
                    textTransform: 'uppercase',
                  }}>
                    {companionLabel}
                  </span>
                  {companionLine > 0 && (
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '9px',
                      color: 'rgba(255,255,255,0.2)',
                    }}>
                      line {companionLine}
                    </span>
                  )}
                </div>
              )}
              {/* Message */}
              <div style={{
                fontFamily: "'Noto Sans KR', 'JetBrains Mono', monospace",
                fontSize: '13px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 1.5,
              }}>
                {companionMsg}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Live Mini Preview — PIP Window ═══ */}
      {previewOpen && previewSrcdoc && (
        <div
          style={{
            position: 'absolute',
            top: '64px',
            right: '16px',
            width: '180px',
            zIndex: 20,
            animation: 'previewSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        >
          {/* Preview header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            background: 'rgba(99,102,241,0.15)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '10px 10px 0 0',
            border: '1px solid rgba(99,102,241,0.25)',
            borderBottom: 'none',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: done ? '#10b981' : '#6366f1',
                boxShadow: done
                  ? '0 0 8px rgba(16,185,129,0.6)'
                  : '0 0 8px rgba(99,102,241,0.6)',
                animation: done ? undefined : 'dot-glow 1.5s ease-in-out infinite',
              }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '8px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
              }}>
                {done ? 'PREVIEW' : 'LIVE'}
              </span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setPreviewOpen(false); }}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: '4px',
                width: '18px', height: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)',
                fontSize: '10px',
                lineHeight: 1,
                padding: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* Preview iframe container */}
          <div style={{
            position: 'relative',
            width: '180px',
            height: '280px',
            borderRadius: '0 0 10px 10px',
            overflow: 'hidden',
            border: '1px solid rgba(99,102,241,0.25)',
            borderTop: 'none',
            background: '#000',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.15)',
          }}>
            {/* Phone-like aspect ratio frame */}
            <iframe
              srcDoc={previewSrcdoc}
              title="Game Preview"
              sandbox="allow-scripts"
              style={{
                width: '375px',
                height: '667px',
                transform: 'scale(0.48)',
                transformOrigin: 'top left',
                border: 'none',
                pointerEvents: 'none',
                background: '#000',
              }}
            />

            {/* Scanline overlay for "building" feel */}
            {!done && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(99,102,241,0.03) 2px,
                  rgba(99,102,241,0.03) 4px
                )`,
                pointerEvents: 'none',
                animation: 'scanlineMove 3s linear infinite',
              }} />
            )}

            {/* Progress ring overlay when building */}
            {!done && progress < 95 && (
              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                width: '28px', height: '28px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                  <circle
                    cx="10" cy="10" r="8" fill="none"
                    stroke="#6366f1"
                    strokeWidth="2"
                    strokeDasharray={`${progress * 0.5} 50`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.3s ease' }}
                  />
                </svg>
                <span style={{
                  position: 'absolute',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '6px',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.6)',
                }}>
                  {progress}%
                </span>
              </div>
            )}

            {/* Completion checkmark */}
            {done && (
              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                width: '28px', height: '28px',
                borderRadius: '50%',
                background: 'rgba(16,185,129,0.2)',
                border: '1px solid rgba(16,185,129,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px',
                animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}>
                ✓
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mini preview toggle — show when preview is closed */}
      {!previewOpen && previewSrcdoc && (
        <button
          onClick={(e) => { e.stopPropagation(); setPreviewOpen(true); }}
          style={{
            position: 'absolute',
            top: '64px',
            right: '16px',
            zIndex: 20,
            width: '36px', height: '36px',
            borderRadius: '10px',
            background: 'rgba(99,102,241,0.15)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.25)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.6)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          👁
        </button>
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
