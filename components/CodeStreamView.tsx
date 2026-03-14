'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { simulateCodeGeneration, GENERATE_STATUS_MESSAGES } from '@/lib/codeSimulator';

interface CodeStreamViewProps {
  gameHtml: string;
  gameTitle: string;
  onComplete: (html: string) => void;
  duration?: number;
  statusMessages?: string[];
  completionText?: string;
}

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
  const codeRef = useRef<HTMLPreElement>(null);
  const startTimeRef = useRef(Date.now());

  // Elapsed timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 200);
    return () => clearInterval(iv);
  }, []);

  const handleComplete = useCallback((fullCode: string) => {
    setDone(true);
    setTimeout(() => onComplete(fullCode), 800);
  }, [onComplete]);

  useEffect(() => {
    const { cancel } = simulateCodeGeneration(gameHtml, {
      onCodeChunk: (chunk) => {
        setCode(chunk);
        if (codeRef.current) {
          codeRef.current.scrollTop = codeRef.current.scrollHeight;
        }
      },
      onStatusChange: setStatus,
      onProgress: setProgress,
      onComplete: handleComplete,
    }, duration, statusMessages);

    return () => cancel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameHtml, handleComplete, duration]);

  const lineCount = code.split('\n').length;
  const tokPerSec = elapsed > 0 ? Math.round(lineCount * 8.5 / elapsed) : 0;

  return (
    <div className="tech-grid" style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient orbs */}
      <div style={{ position: 'absolute', top: '-10%', left: '10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'float1 8s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '0', right: '5%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'float2 10s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />

      {/* Top Bar — Command Console */}
      <div className="glass-surface" style={{
        padding: '12px 20px',
        borderBottom: '0.5px solid rgba(255,255,255,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative', zIndex: 1,
      }}>
        <span className={done ? 'status-dot' : 'status-dot-active'} />
        <span className="mono-label" style={{
          fontSize: '10px',
          color: done ? 'var(--ai-emerald)' : 'var(--ai-indigo)',
        }}>
          {done ? 'COMPLETE' : 'GENERATING'}
        </span>
        <span style={{
          flex: 1,
          textAlign: 'center',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          color: 'var(--text-secondary)',
        }}>
          {gameTitle}.html
        </span>
        <span className="mono-metric">
          {lineCount} LOC
        </span>
        <span className="mono-metric" style={{ color: 'var(--ai-cyan)' }}>
          ~{tokPerSec} tok/s
        </span>
      </div>

      {/* Code Area — Dark Terminal */}
      <pre
        ref={codeRef}
        className="code-terminal"
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 20px',
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          position: 'relative',
          zIndex: 1,
          animation: done ? 'glitch-complete 0.3s ease-out' : undefined,
        }}
      >
        {code}
        {!done && (
          <span style={{
            display: 'inline-block',
            width: '2px',
            height: '14px',
            background: 'var(--ai-indigo)',
            animation: 'blink 1s infinite',
            marginLeft: '2px',
            verticalAlign: 'middle',
            boxShadow: '0 0 4px rgba(99,102,241,0.6)',
            borderRadius: '1px',
          }} />
        )}
      </pre>

      {/* Bottom Status Bar — Engineering Dashboard */}
      <div className="glass-surface" style={{
        padding: '12px 20px',
        borderTop: '0.5px solid rgba(255,255,255,0.4)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Progress Bar with glow */}
        <div style={{
          height: '3px',
          background: 'rgba(99,102,241,0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '10px',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: done
              ? 'linear-gradient(90deg, var(--ai-emerald), #4ade80)'
              : 'linear-gradient(90deg, var(--ai-indigo), var(--ai-violet))',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
            boxShadow: done
              ? '0 0 8px rgba(16,185,129,0.4)'
              : '0 0 8px rgba(99,102,241,0.4)',
          }} />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span className={done ? 'status-dot' : 'status-dot-active'} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 500,
              color: done ? 'var(--ai-emerald)' : 'var(--text-secondary)',
            }}>
              {done ? `${completionText} ✓` : status}
            </span>
          </div>

          {/* Metrics row */}
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}>
            <span className="mono-metric">{progress}%</span>
            <span className="mono-metric">{lineCount} LOC</span>
            <span className="mono-metric">{elapsed}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
