'use client';

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

interface InputAreaProps {
  onSend: (text: string) => void;
  disabled: boolean;
  showHints: boolean;
  onHintSelect: (prompt: string) => void;
}

export interface InputAreaHandle {
  typeText: (text: string) => Promise<void>;
  setHint: (text: string) => void;
  clear: () => void;
}

const InputArea = forwardRef<InputAreaHandle, InputAreaProps>(function InputArea(
  { onSend, disabled },
  ref
) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasText = text.trim().length > 0;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  useImperativeHandle(ref, () => ({
    async typeText(target: string) {
      setText('');
      textareaRef.current?.focus();
      for (let i = 0; i < target.length; i++) {
        setText(target.slice(0, i + 1));
        await sleep(30 + Math.random() * 40);
      }
    },
    setHint(target: string) {
      setText(target);
      textareaRef.current?.focus();
    },
    clear() {
      setText('');
    },
  }));

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-6 pb-5 flex-shrink-0">
      <div className="max-w-[680px] mx-auto">
        {/* Vibe Prompt Input — aurora glow */}
        <div className="relative" style={{ borderRadius: 30 }}>
          {/* Aurora glow background — 흐름 애니메이션은 사용 중일 때만 (대기 시 GPU 휴식)
              gov 라이트 테마에선 CSS로 숨김 (.input-aurora) */}
          <div
            className="input-aurora absolute rounded-[30px]"
            style={{
              inset: isFocused ? -2 : 4,
              background: 'linear-gradient(90deg, #00f3ff, #bc13fe, #ff007f, #ff9500, #00f3ff)',
              backgroundSize: '300% 300%',
              animation: isFocused || hasText ? 'gradientFlow 3s linear infinite' : 'none',
              filter: `blur(${isFocused ? 20 : 10}px)`,
              opacity: isFocused ? 0.7 : 0.12,
              transition: 'all 0.4s cubic-bezier(0.25,1,0.5,1)',
              zIndex: 0,
            }}
          />

          {/* Glass panel */}
          <div
            className="relative flex items-end z-[1]"
            style={{
              background: isFocused ? 'var(--glass-bg-focus)' : 'var(--glass-bg)',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              border: `1px solid ${isFocused ? 'var(--glass-border-focus)' : 'var(--glass-border)'}`,
              borderRadius: 24,
              padding: '8px 10px 8px 24px',
              boxShadow: 'var(--glass-shadow)',
              transition: 'all 0.3s ease',
            }}
          >
            {/* Sparkle icon */}
            <div
              className="mr-3 flex items-center justify-center flex-shrink-0 mb-2.5 transition-all duration-300"
              style={{
                color: isFocused ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                filter: isFocused ? 'drop-shadow(0 0 8px var(--accent-primary-glow))' : 'none',
              }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18M3 12h18M15 9l-6 6M9 9l6 6"/>
              </svg>
            </div>

            {/* Input — all outlines/borders killed */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              rows={1}
              placeholder="AI에게 말 걸어보세요 · 예) 속도 올려줘"
              spellCheck={false}
              aria-label="AI에게 보낼 메시지"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
                WebkitAppearance: 'none',
                resize: 'none',
                color: 'var(--text-primary)',
                fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
                fontWeight: 300,
                fontSize: '1.05rem',
                lineHeight: 1.5,
                maxHeight: 120,
                minHeight: 40,
                padding: '10px 0',
                caretColor: 'var(--accent-primary)',
              }}
            />

            {/* Send button — glass when empty, lit when typing */}
            <button
              onClick={handleSend}
              disabled={!hasText || disabled}
              aria-label="보내기"
              style={{
                width: 44,
                height: 44,
                borderRadius: 18,
                marginLeft: 12,
                flexShrink: 0,
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: hasText ? 'pointer' : 'default',
                border: 'none',
                outline: 'none',
                background: hasText
                  ? 'var(--send-bg-active)'
                  : 'var(--bg-surface)',
                boxShadow: hasText
                  ? 'var(--send-glow)'
                  : '0 0 0 1px var(--border)',
                transform: hasText ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s cubic-bezier(0.25,1,0.5,1)',
                opacity: !hasText ? 0.5 : 1,
              }}
            >
              <svg
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  stroke: hasText ? 'var(--send-fg-active)' : 'var(--text-muted)',
                  transform: hasText ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default InputArea;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
