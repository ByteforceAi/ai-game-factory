'use client';

import { useEffect, useRef, useState } from 'react';
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
  completionText = '게임 생성 완료!',
}: CodeStreamViewProps) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('게임 엔진 초기화 중...');
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);

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
      onComplete: (fullCode) => {
        setDone(true);
        setTimeout(() => onComplete(fullCode), 800);
      },
    }, duration, statusMessages);

    cancelRef.current = cancel;
    return () => cancel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameHtml, onComplete, duration]);

  const lineCount = code.split('\n').length;

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Gradient orbs behind glass */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '10%',
          width: '50vw', height: '50vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
          filter: 'blur(60px)', animation: 'float1 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '0', right: '5%',
          width: '45vw', height: '45vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)',
          filter: 'blur(60px)', animation: 'float2 10s ease-in-out infinite',
        }} />
      </div>

      {/* Top Bar — frosted glass */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(255,255,255,0.5)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          display: 'flex',
          gap: '6px',
        }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
        </div>
        <span style={{ color: '#6b7280', fontSize: '13px', flex: 1 }}>
          {gameTitle}.html — AI Game Factory
        </span>
        <span style={{ color: '#6366f1', fontSize: '12px', fontWeight: 500 }}>
          {lineCount} lines
        </span>
      </div>

      {/* Code Area — dark code on light frosted glass */}
      <pre
        ref={codeRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 20px',
          margin: 0,
          fontSize: '11px',
          lineHeight: 1.6,
          color: '#312e81',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          background: 'rgba(255,255,255,0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          position: 'relative', zIndex: 1,
          fontFamily: "'Fira Code', 'Courier New', monospace",
        }}
      >
        {code}
        {!done && (
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '16px',
            background: '#6366f1',
            animation: 'blink 1s infinite',
            marginLeft: '2px',
            verticalAlign: 'middle',
            borderRadius: '2px',
          }} />
        )}
      </pre>

      {/* Bottom Status Bar — frosted glass */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid rgba(255,255,255,0.4)',
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Progress Bar */}
        <div style={{
          height: '4px',
          background: 'rgba(99,102,241,0.15)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '10px',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: done
              ? 'linear-gradient(90deg, #22c55e, #4ade80)'
              : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }} />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: done ? '#16a34a' : '#6b7280',
            fontSize: '13px',
            fontWeight: 500,
          }}>
            {done ? (
              <>
                <span style={{ fontSize: '16px' }}>✅</span>
                {completionText}
              </>
            ) : (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#6366f1',
                  animation: 'pulse 1.5s infinite',
                }} />
                {status}
              </>
            )}
          </div>
          <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 500 }}>
            {progress}%
          </span>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 20px) scale(1.1); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, -30px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
