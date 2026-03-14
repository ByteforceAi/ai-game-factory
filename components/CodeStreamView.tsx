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
      background: '#0d1117',
      color: '#e6edf3',
      fontFamily: "'Fira Code', 'Courier New', monospace",
    }}>
      {/* Top Bar */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #21262d',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          display: 'flex',
          gap: '6px',
        }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
        </div>
        <span style={{ color: '#8b949e', fontSize: '13px', flex: 1 }}>
          {gameTitle}.html — AI Game Factory
        </span>
        <span style={{ color: '#58a6ff', fontSize: '12px' }}>
          {lineCount} lines
        </span>
      </div>

      {/* Code Area */}
      <pre
        ref={codeRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 20px',
          margin: 0,
          fontSize: '11px',
          lineHeight: 1.6,
          color: '#a5d6ff',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {code}
        {!done && (
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '16px',
            background: '#58a6ff',
            animation: 'blink 1s infinite',
            marginLeft: '2px',
            verticalAlign: 'middle',
          }} />
        )}
      </pre>

      {/* Bottom Status Bar */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid #21262d',
        background: '#161b22',
      }}>
        {/* Progress Bar */}
        <div style={{
          height: '4px',
          background: '#21262d',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '10px',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: done
              ? 'linear-gradient(90deg, #28c840, #3fb950)'
              : 'linear-gradient(90deg, #58a6ff, #79c0ff)',
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
            color: done ? '#3fb950' : '#8b949e',
            fontSize: '13px',
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
                  background: '#58a6ff',
                  animation: 'pulse 1.5s infinite',
                }} />
                {status}
              </>
            )}
          </div>
          <span style={{ color: '#484f58', fontSize: '12px' }}>
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
      `}</style>
    </div>
  );
}
