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
          {/* Aurora glow background */}
          <div
            className="absolute rounded-[30px]"
            style={{
              inset: isFocused ? -2 : 4,
              background: 'linear-gradient(90deg, #00f3ff, #bc13fe, #ff007f, #ff9500, #00f3ff)',
              backgroundSize: '300% 300%',
              animation: `gradientFlow ${isFocused ? '3s' : '6s'} linear infinite`,
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
              background: isFocused ? 'rgba(20,20,25,0.8)' : 'rgba(15,15,20,0.6)',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              border: `1px solid ${isFocused ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 24,
              padding: '8px 10px 8px 24px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)',
              transition: 'all 0.3s ease',
            }}
          >
            {/* Sparkle icon */}
            <div
              className="mr-3 flex items-center justify-center flex-shrink-0 mb-2.5 transition-all duration-300"
              style={{
                color: isFocused ? '#00f3ff' : 'rgba(255,255,255,0.4)',
                filter: isFocused ? 'drop-shadow(0 0 8px #00f3ff)' : 'none',
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
              placeholder="메시지를 입력하세요..."
              spellCheck={false}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
                WebkitAppearance: 'none',
                resize: 'none',
                color: '#fff',
                fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
                fontWeight: 300,
                fontSize: '1.05rem',
                lineHeight: 1.5,
                maxHeight: 120,
                minHeight: 40,
                padding: '10px 0',
                caretColor: '#22c55e',
              }}
            />

            {/* Send button — glass when empty, lit when typing */}
            <button
              onClick={handleSend}
              disabled={!hasText || disabled}
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
                  ? '#fff'
                  : 'rgba(255,255,255,0.06)',
                boxShadow: hasText
                  ? '0 0 20px rgba(255,255,255,0.4), 0 0 40px rgba(188,19,254,0.3)'
                  : '0 0 0 1px rgba(255,255,255,0.06)',
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
                  stroke: hasText ? '#000' : 'rgba(255,255,255,0.25)',
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
