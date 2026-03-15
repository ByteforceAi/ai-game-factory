'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { playTick, playComplete } from '@/lib/sounds';

interface VibeOverlayProps {
  /** The CSS or code snippet to "type" as overlay */
  codeSnippet: string;
  /** Label shown at top */
  label: string;
  /** Duration of the typing animation in ms */
  duration?: number;
  /** Called when animation is done */
  onComplete: () => void;
}

/**
 * Semi-transparent code typing overlay that appears OVER the game
 * to create the "code materializes reality" effect.
 * Unlike full-screen CodeStreamView, the game remains visible behind.
 */
export default function VibeOverlay({
  codeSnippet,
  label,
  duration = 2000,
  onComplete,
}: VibeOverlayProps) {
  const [displayedCode, setDisplayedCode] = useState('');
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'applying' | 'done'>('typing');
  const tickRef = useRef(0);
  const startRef = useRef(Date.now());

  // Typing animation
  useEffect(() => {
    startRef.current = Date.now();
    const lines = codeSnippet.split('\n');
    const totalChars = codeSnippet.length;
    let charIndex = 0;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const typingDuration = duration * 0.65; // 65% for typing
      const pct = Math.min(1, elapsed / typingDuration);
      const targetChars = Math.floor(pct * totalChars);

      if (charIndex < targetChars) {
        charIndex = targetChars;
        setDisplayedCode(codeSnippet.slice(0, charIndex));
        setProgress(pct * 0.65);

        // Tick sound every 12 chars
        tickRef.current++;
        if (tickRef.current % 12 === 0) playTick();
      }

      if (pct >= 1 && phase === 'typing') {
        setPhase('applying');
        setDisplayedCode(codeSnippet);
        setProgress(0.8);

        // "Applying" phase
        setTimeout(() => {
          setPhase('done');
          setProgress(1);
          playComplete();
          setTimeout(() => onComplete(), 600);
        }, duration * 0.25);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [codeSnippet, duration, onComplete, phase]);

  // Highlight CSS-like code
  const highlightCSS = useCallback((code: string) => {
    return code.split('\n').map((line, i) => {
      const trimmed = line.trim();
      // Comment
      if (trimmed.startsWith('/*') || trimmed.startsWith('//')) {
        return <span key={i} style={{ color: '#6272a4' }}>{line}{'\n'}</span>;
      }
      // Property: value
      if (trimmed.includes(':') && !trimmed.startsWith('<')) {
        const [prop, ...rest] = line.split(':');
        return (
          <span key={i}>
            <span style={{ color: '#50fa7b' }}>{prop}</span>
            <span style={{ color: '#6272a4' }}>:</span>
            <span style={{ color: '#f1fa8c' }}>{rest.join(':')}</span>
            {'\n'}
          </span>
        );
      }
      // Selector or tag
      if (trimmed.endsWith('{') || trimmed.startsWith('}')) {
        return <span key={i} style={{ color: '#ff79c6' }}>{line}{'\n'}</span>;
      }
      return <span key={i} style={{ color: '#f8f8f2' }}>{line}{'\n'}</span>;
    });
  }, []);

  return (
    <div
      className="anim-fade-in"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5,5,16,0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        pointerEvents: 'none',
      }}
    >
      {/* Floating code card */}
      <div
        className="anim-scale-in"
        style={{
          width: 'min(400px, 85vw)',
          maxHeight: '50vh',
          background: 'rgba(10,10,24,0.85)',
          border: '1px solid',
          borderColor: phase === 'done' ? 'rgba(16,185,129,0.4)' : 'rgba(99,102,241,0.3)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow:
            phase === 'done'
              ? '0 0 40px rgba(16,185,129,0.15), 0 20px 60px rgba(0,0,0,0.5)'
              : '0 0 40px rgba(99,102,241,0.1), 0 20px 60px rgba(0,0,0,0.5)',
          transition: 'border-color 0.5s, box-shadow 0.5s',
        }}
      >
        {/* Header bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className={phase === 'typing' ? 'status-dot-indigo' : 'status-dot-green'} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.1em',
              color: phase === 'done' ? '#6ee7b7' : 'var(--text-dim)',
              transition: 'color 0.3s',
            }}>
              {phase === 'typing' ? 'APPLYING THEME...' : phase === 'applying' ? 'COMPILING...' : '✓ APPLIED'}
            </span>
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: 'var(--text-muted)',
          }}>
            {label}
          </span>
        </div>

        {/* Code area */}
        <div style={{
          padding: '12px 14px',
          maxHeight: '30vh',
          overflowY: 'auto',
        }}>
          <pre style={{
            margin: 0,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            {highlightCSS(displayedCode)}
            {phase === 'typing' && (
              <span style={{
                display: 'inline-block',
                width: '7px',
                height: '14px',
                background: 'var(--ai-indigo)',
                animation: 'blink 0.6s infinite',
                verticalAlign: 'middle',
                marginLeft: '1px',
              }} />
            )}
          </pre>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '2px',
          background: 'rgba(255,255,255,0.04)',
        }}>
          <div style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: phase === 'done'
              ? 'linear-gradient(90deg, var(--ai-emerald), #6ee7b7)'
              : 'linear-gradient(90deg, var(--ai-indigo), var(--ai-violet))',
            transition: 'width 0.3s, background 0.5s',
            boxShadow: phase === 'done'
              ? '0 0 10px rgba(16,185,129,0.5)'
              : '0 0 10px rgba(99,102,241,0.5)',
          }} />
        </div>
      </div>
    </div>
  );
}
