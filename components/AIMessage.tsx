'use client';

import { useEffect, useRef, useState } from 'react';
import { formatMarkdown, type ScenarioResponse } from '@/lib/scenarios';
import { playTick, playPing } from '@/lib/sounds';

interface AIMessageProps {
  response: ScenarioResponse;
  onArtifactOpen?: (title: string, code: string, preview?: string, gameHtml?: string) => void;
  onStreamComplete?: () => void;
  onSuggestionClick?: (prompt: string) => void;
}

export default function AIMessage({
  response,
  onArtifactOpen,
  onStreamComplete,
  onSuggestionClick,
}: AIMessageProps) {
  const [phase, setPhase] = useState<'dots' | 'streaming' | 'done'>('dots');
  const [showArtifactBtn, setShowArtifactBtn] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;
    let timers: ReturnType<typeof setTimeout>[] = [];

    const run = async () => {
      // Phase 1: Show thinking dots
      await sleep(800 + Math.random() * 600);
      if (cancelRef.current) return;
      setPhase('streaming');

      // Phase 2: Stream character by character via DOM
      await sleep(50); // wait for DOM mount
      if (cancelRef.current) return;

      const el = textRef.current;
      if (!el) return;

      const html = formatMarkdown(response.text);
      const chars = Array.from(html);
      let output = '';
      let inTag = false;

      let visibleCount = 0;
      for (let i = 0; i < chars.length; i++) {
        if (cancelRef.current) return;
        const c = chars[i];
        if (c === '<') inTag = true;
        output += c;
        if (c === '>') { inTag = false; continue; }
        if (inTag) continue;

        visibleCount++;
        // Update every 2nd visible character — realistic AI streaming speed
        if (visibleCount % 2 === 0) {
          if (visibleCount % 20 === 0) playTick();
          el.innerHTML =
            output +
            '<span style="display:inline-block;width:2px;height:16px;background:var(--text-primary);animation:cursorBlink .7s step-end infinite;vertical-align:text-bottom;margin-left:1px"></span>';
          el.parentElement?.parentElement?.parentElement?.scrollIntoView({
            block: 'end',
            behavior: 'smooth',
          });
          // Realistic speed: 25~45ms per update (like real Claude)
          await sleep(25 + Math.random() * 20);
        }
      }

      if (cancelRef.current) return;
      // Final: remove cursor
      el.innerHTML = output;
      setPhase('done');
      playPing(); // completion sound
      onStreamComplete?.();

      // Phase 3: Show artifact button
      if (response.artifact) {
        await sleep(300);
        if (cancelRef.current) return;
        setShowArtifactBtn(true);
        await sleep(500);
        if (cancelRef.current) return;
        onArtifactOpen?.(
          response.artifactTitle!,
          response.artifactCode!,
          response.artifactPreview,
          response.gameHtml
        );
      }
    };

    run();

    return () => {
      cancelRef.current = true;
      timers.forEach(clearTimeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex gap-3 items-start animate-msg-in">
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
        style={{ background: 'var(--accent-coral)' }}
      >
        <svg viewBox="0 0 16 16" fill="none" width={16} height={16}>
          <path d="M8 2c0 0 .7 5 0 6-.7-1 0-6 0-6Z" fill="#fff" />
          <path d="M8 14c0 0-.7-5 0-6 .7 1 0 6 0 6Z" fill="#fff" />
          <path d="M2 8c0 0 5-.7 6 0-1 .7-6 0-6 0Z" fill="#fff" />
          <path d="M14 8c0 0-5 .7-6 0 1-.7 6 0 6 0Z" fill="#fff" />
        </svg>
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        {phase === 'dots' && (
          <div className="flex gap-1 py-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-[7px] h-[7px] rounded-full animate-dot-bounce"
                style={{
                  background: 'var(--text-muted)',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}

        {(phase === 'streaming' || phase === 'done') && (
          <div>
            <div
              ref={textRef}
              className="text-[15px] leading-[1.75] text-[var(--text-primary)] [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-[var(--bg-surface)] [&_code]:px-1.5 [&_code]:rounded [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1"
            />

            {showArtifactBtn && response.artifact && (
              <button
                onClick={() =>
                  onArtifactOpen?.(
                    response.artifactTitle!,
                    response.artifactCode!,
                    response.artifactPreview
                  )
                }
                className="inline-flex items-center gap-2 mt-3 px-4 py-2.5 cursor-pointer transition-all duration-200 hover:bg-[var(--bg-surface)] hover:border-[#555]"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                }}
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center text-[11px] text-white"
                  style={{ background: 'var(--accent-orange)' }}
                >
                  ◆
                </div>
                {response.artifactTitle}
              </button>
            )}

            {/* Terminal-style typing prompt — student must type this */}
            {phase === 'done' && response.typingPrompt && (
              <div
                className="mt-4 rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(34,197,94,0.15)',
                  boxShadow: '0 0 20px rgba(34,197,94,0.05)',
                }}
              >
                {/* Terminal header */}
                <div
                  className="flex items-center gap-2 px-4 py-2"
                  style={{ borderBottom: '1px solid rgba(34,197,94,0.1)' }}
                >
                  <div className="w-[6px] h-[6px] rounded-full" style={{ background: 'rgba(34,197,94,0.4)' }} />
                  <span className="font-mono text-[10px] tracking-[2px] uppercase" style={{ color: 'rgba(34,197,94,0.35)' }}>
                    input command
                  </span>
                </div>
                {/* Command to type */}
                <div className="px-5 py-4">
                  <div className="font-mono text-[11px] mb-2" style={{ color: 'rgba(34,197,94,0.3)' }}>
                    {'>'} 아래 명령어를 입력창에 타이핑하세요:
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[15px] font-medium" style={{
                      color: 'rgba(34,197,94,0.85)',
                      textShadow: '0 0 10px rgba(34,197,94,0.3)',
                    }}>
                      {response.typingPrompt}
                    </span>
                    <span
                      className="inline-block w-[8px] h-[18px] rounded-[1px]"
                      style={{
                        background: 'rgba(34,197,94,0.6)',
                        animation: 'cursorBlink .8s step-end infinite',
                        boxShadow: '0 0 6px rgba(34,197,94,0.3)',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Suggestion hints — read-only, student must type manually */}
            {phase === 'done' && !response.typingPrompt && response.suggestions && response.suggestions.length > 0 && (
              <div className="mt-4 px-3 py-3 rounded-claude-md" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                <div className="text-[11px] text-[var(--text-muted)] mb-2">
                  💡 아래 문장을 직접 입력해보세요:
                </div>
                <div className="flex flex-col gap-1.5">
                  {response.suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="text-[13px] text-[var(--text-secondary)] font-mono pl-2"
                      style={{ borderLeft: '2px solid var(--accent-coral)', paddingLeft: '8px' }}
                    >
                      &ldquo;{s.prompt}&rdquo;
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
