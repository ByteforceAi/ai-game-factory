'use client';

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import SuggestionChips from './SuggestionChips';
import { HINT_CHIPS } from '@/lib/scenarios';

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
  { onSend, disabled, showHints, onHintSelect },
  ref
) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    /** Type text character by character into the input */
    async typeText(target: string) {
      setText('');
      textareaRef.current?.focus();
      for (let i = 0; i < target.length; i++) {
        setText(target.slice(0, i + 1));
        await sleep(30 + Math.random() * 40);
      }
    },
    /** Set text instantly (for hint chip click) */
    setHint(target: string) {
      setText(target);
      textareaRef.current?.focus();
    },
    /** Clear the input */
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
        <div
          className="flex items-end gap-2 transition-all duration-200"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xl)',
            padding: '4px 4px 4px 18px',
          }}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="메시지를 입력하세요..."
            spellCheck={false}
            className="flex-1 bg-transparent border-none outline-none resize-none text-[15px] leading-normal"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              maxHeight: 120,
              minHeight: 40,
              padding: '10px 0',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || disabled}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[15px] flex-shrink-0 mb-0.5 cursor-pointer transition-opacity duration-200 disabled:opacity-20 disabled:cursor-not-allowed hover:opacity-80"
            style={{
              background: 'var(--text-primary)',
              color: 'var(--bg-primary)',
              border: 'none',
            }}
          >
            ↑
          </button>
        </div>

        {showHints && (
          <div className="mt-2.5">
            <SuggestionChips
              chips={HINT_CHIPS}
              onSelect={onHintSelect}
              size="small"
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default InputArea;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
