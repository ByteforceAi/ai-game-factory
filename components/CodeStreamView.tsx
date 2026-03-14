'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { simulateCodeGeneration, GENERATE_STATUS_MESSAGES } from '@/lib/codeSimulator';
import ParticleBackground from './ParticleBackground';

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
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--bg-deep)',
    }}>
      <ParticleBackground />

      {/* Top Bar — Command Console */}
      <div className="bar-cinematic" style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--border-dim)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative', zIndex: 1,
      }}>
        <span className={done ? 'status-dot-green' : 'status-dot-indigo'} />
        <span className="mono-xs" style={{
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
          color: 'var(--text-dim)',
        }}>
          {gameTitle}.html
        </span>
        <span className="mono-xs" style={{ color: 'var(--text-dim)' }}>
          {lineCount} LOC
        </span>
        <span className="mono-xs" style={{ color: 'var(--ai-cyan)' }}>
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

      {/* Bottom Status Bar */}
      <div className="bar-cinematic" style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border-dim)',
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
            <span className={done ? 'status-dot-green' : 'status-dot-indigo'} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 500,
              color: done ? 'var(--ai-emerald)' : 'var(--text-dim)',
            }}>
              {done ? `${completionText}` : status}
            </span>
          </div>

          {/* Metrics row */}
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}>
            <span className="mono-xs">{progress}%</span>
            <span className="mono-xs">{lineCount} LOC</span>
            <span className="mono-xs">{elapsed}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
