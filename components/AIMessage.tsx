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

// ── Build sequence lines for game generation ──
const BUILD_LINES = [
  '프로젝트 스캐폴딩...',
  '게임 엔진 초기화...',
  '에셋 컴파일...',
  '물리 엔진 연결...',
  '렌더 파이프라인 구성...',
  '빌드 완료 ✓',
];

export default function AIMessage({
  response,
  onArtifactOpen,
  onStreamComplete,
  onSuggestionClick,
}: AIMessageProps) {
  const [phase, setPhase] = useState<'dots' | 'building' | 'streaming' | 'done'>('dots');
  const [buildLines, setBuildLines] = useState<string[]>([]);
  const [showArtifactBtn, setShowArtifactBtn] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;

    const run = async () => {
      const hasArtifact = response.artifact || response.gameHtml;

      if (hasArtifact) {
        // ── Phase 1a: Thinking dots (brief) ──
        await sleep(800 + Math.random() * 400);
        if (cancelRef.current) return;

        // ── Phase 1b: Build sequence (드르륵 준비) ──
        setPhase('building');
        for (let i = 0; i < BUILD_LINES.length; i++) {
          await sleep(400 + Math.random() * 300);
          if (cancelRef.current) return;
          setBuildLines(prev => [...prev, BUILD_LINES[i]]);
        }
        await sleep(600);
        if (cancelRef.current) return;
      } else {
        // Text-only: normal thinking dots
        await sleep(1000 + Math.random() * 800);
        if (cancelRef.current) return;
      }

      setPhase('streaming');

      // Phase 2: Stream character by character via DOM
      await sleep(50);
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
        if (visibleCount % 2 === 0) {
          if (visibleCount % 20 === 0) playTick();
          el.innerHTML =
            output +
            '<span style="display:inline-block;width:2px;height:16px;background:var(--text-primary);animation:cursorBlink .7s step-end infinite;vertical-align:text-bottom;margin-left:1px"></span>';
          el.parentElement?.parentElement?.parentElement?.scrollIntoView({
            block: 'end',
            behavior: 'smooth',
          });
          await sleep(25 + Math.random() * 20);
        }
      }

      if (cancelRef.current) return;
      el.innerHTML = output;
      setPhase('done');
      playPing();
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
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex gap-3 items-start animate-msg-in">
      {/* Avatar — Core spark orb (matches boot visual) */}
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5"
        style={{
          background: 'radial-gradient(circle, #22c55e, #22c55e88, transparent)',
          boxShadow: '0 0 12px rgba(34,197,94,0.3), 0 0 4px rgba(34,197,94,0.5)',
          animation: 'breatheCore 2.5s ease-in-out infinite alternate',
        }}
      />

      {/* Body */}
      <div className="flex-1 min-w-0">
        {/* Thinking dots */}
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

        {/* Build sequence — 드르륵 준비 중 */}
        {phase === 'building' && (
          <div
            className="rounded-lg px-4 py-3 font-mono text-[11px] leading-[2]"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(34,197,94,0.1)',
            }}
          >
            {buildLines.map((line, i) => (
              <div
                key={i}
                className="animate-[fadeInUp_0.3s_ease_forwards]"
                style={{
                  opacity: 0,
                  color: line.includes('✓')
                    ? 'rgba(34,197,94,0.7)'
                    : 'rgba(34,197,94,0.35)',
                }}
              >
                <span style={{ color: 'rgba(34,197,94,0.2)', marginRight: 8 }}>{'>'}</span>
                {line}
              </div>
            ))}
            {/* Pulsing dots at end */}
            {buildLines.length < BUILD_LINES.length && (
              <div className="flex gap-1 mt-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-[4px] h-[4px] rounded-full animate-dot-bounce"
                    style={{
                      background: 'rgba(34,197,94,0.3)',
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Streamed text */}
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

            {/* Terminal-style typing prompt */}
            {phase === 'done' && response.typingPrompt && (
              <div
                className="mt-4 rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(34,197,94,0.15)',
                  boxShadow: '0 0 20px rgba(34,197,94,0.05)',
                }}
              >
                <div
                  className="flex items-center gap-2 px-4 py-2"
                  style={{ borderBottom: '1px solid rgba(34,197,94,0.1)' }}
                >
                  <div className="w-[6px] h-[6px] rounded-full" style={{ background: 'rgba(34,197,94,0.4)' }} />
                  <span className="font-mono text-[10px] tracking-[2px] uppercase" style={{ color: 'rgba(34,197,94,0.35)' }}>
                    input command
                  </span>
                </div>
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

            {/* Suggestion hints */}
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
