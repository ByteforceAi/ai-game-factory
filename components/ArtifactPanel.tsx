'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { syntaxHighlight } from '@/lib/scenarios';
import { matchXRayTarget } from '@/lib/xrayMappings';

interface ArtifactPanelProps {
  open: boolean;
  title: string;
  code: string;
  preview?: string;
  gameHtml?: string;
  onClose: () => void;
}

// ── Code X-Ray: 코드 줄 ↔ 게임 요소 하이라이트 연결 ──
// hover는 데스크톱 전용이라 탭(터치)도 같은 효과 + 1.5초 자동 해제
function attachXRay(div: HTMLDivElement, xm: { target: string; label: string }) {
  div.style.cursor = 'pointer';
  div.title = xm.label;
  const send = (msg: object) => {
    const iframe = document.querySelector('iframe');
    iframe?.contentWindow?.postMessage(msg, '*');
  };
  const on = () => {
    div.style.background = 'rgba(99,102,241,0.08)';
    send({ type: 'XRAY_HIGHLIGHT', target: xm.target, label: xm.label });
  };
  const off = () => {
    div.style.background = 'transparent';
    send({ type: 'XRAY_CLEAR' });
  };
  div.addEventListener('mouseenter', on);
  div.addEventListener('mouseleave', off);
  div.addEventListener('click', () => {
    on();
    setTimeout(off, 1500);
  });
}

export default function ArtifactPanel({
  open,
  title,
  code,
  preview,
  gameHtml,
  onClose,
}: ArtifactPanelProps) {
  const [tab, setTab] = useState<'code' | 'preview' | 'play'>('code');
  const bodyRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(false);
  const prevCodeRef = useRef('');
  const switchTabRef = useRef<(t: 'code' | 'preview' | 'play') => void>(() => {});

  // Stream code lines via direct DOM manipulation
  useEffect(() => {
    if (!open || !code || code === prevCodeRef.current) return;
    prevCodeRef.current = code;
    cancelRef.current = false;
    setTab('code');

    const body = bodyRef.current;
    if (!body) return;

    body.innerHTML = '';
    body.style.fontFamily = 'var(--font-mono)';
    body.style.fontSize = '13px';
    body.style.padding = '16px 20px';

    const lines = code.split('\n');
    let i = 0;

    const streamNext = () => {
      if (cancelRef.current || i >= lines.length) {
        if (!cancelRef.current && i >= lines.length && gameHtml) {
          setTimeout(() => switchTabRef.current('play'), 500);
        }
        return;
      }

      const div = document.createElement('div');
      div.style.opacity = '0';
      div.style.animation = 'lineFadeIn 0.12s ease forwards';
      div.style.cursor = 'default';
      div.style.padding = '0 2px';
      div.style.borderRadius = '3px';
      div.style.transition = 'background 0.15s';

      const num = String(i + 1).padStart(3, ' ');
      const highlighted = syntaxHighlight(lines[i]);
      // flex 거터 + pre-wrap: 들여쓰기 보존(코딩 교육 필수) + 줄바꿈 시 연속행 정렬
      div.style.display = 'flex';
      div.innerHTML = `<span style="flex:0 0 32px;text-align:right;color:var(--text-muted);margin-right:16px;user-select:none;font-size:12px">${num}</span><span style="flex:1;min-width:0;white-space:pre-wrap;word-break:break-word">${highlighted}</span>`;

      // ── Code X-Ray: hover/tap → highlight game element ──
      const xrayMatch = matchXRayTarget(lines[i]);
      if (xrayMatch) attachXRay(div, xrayMatch);

      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
      i++;
      setTimeout(streamNext, 8 + Math.random() * 7);
    };

    const timer = setTimeout(streamNext, 100);

    return () => {
      cancelRef.current = true;
      clearTimeout(timer);
    };
  }, [open, code, gameHtml]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      prevCodeRef.current = '';
    }
  }, [open]);

  const switchTab = useCallback(
    (t: 'code' | 'preview' | 'play') => {
      setTab(t);
      const body = bodyRef.current;
      if (!body) return;

      if (t === 'code' && (code || gameHtml)) {
        // Show FULL source code — if gameHtml exists, show that instead of short snippet
        const fullCode = gameHtml || code;
        body.innerHTML = '';
        body.style.fontFamily = 'var(--font-mono)';
        body.style.fontSize = '13px';
        body.style.padding = '16px 20px';
        const lines = fullCode.split('\n');
        lines.forEach((line, idx) => {
          const div = document.createElement('div');
          div.style.padding = '0 2px';
          div.style.borderRadius = '3px';
          div.style.transition = 'background 0.15s';
          const num = String(idx + 1).padStart(3, ' ');
          div.style.display = 'flex';
          div.innerHTML = `<span style="flex:0 0 32px;text-align:right;color:var(--text-muted);margin-right:16px;user-select:none;font-size:12px">${num}</span><span style="flex:1;min-width:0;white-space:pre-wrap;word-break:break-word">${syntaxHighlight(line)}</span>`;

          // X-Ray hover/tap on static view too
          const xm = matchXRayTarget(line);
          if (xm) attachXRay(div, xm);

          body.appendChild(div);
        });
      } else if (t === 'preview' && preview) {
        body.innerHTML = `<div style="font-family:var(--font-body);font-size:15px;line-height:1.8;padding:24px">${preview}</div>`;
        body.style.fontFamily = 'var(--font-body)';
        body.style.fontSize = '15px';
        body.style.padding = '0';
      } else if (t === 'play' && gameHtml) {
        body.style.padding = '0';
        body.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'width:100%;height:100%;border:none;background:#000';
        iframe.sandbox.add('allow-scripts');
        iframe.sandbox.add('allow-same-origin');
        iframe.srcdoc = gameHtml;
        // 안전벨트: iframe이 width 트랜지션으로 0→실크기가 되므로,
        // 로드 후 resize를 몇 번 쏴 0×0에 굳은 캔버스를 깨운다
        iframe.onload = () => {
          [60, 250, 550].forEach((t) =>
            setTimeout(() => {
              try { iframe.contentWindow?.dispatchEvent(new Event('resize')); } catch {}
            }, t)
          );
        };
        body.appendChild(iframe);
      }
    },
    [code, preview, gameHtml]
  );

  // Keep ref in sync for useEffect to call
  switchTabRef.current = switchTab;

  return (
    <div
      className={`artifact-panel overflow-hidden relative ${open ? 'artifact-panel-open' : ''}`}
      style={{
        // 데스크톱(>900) 가로 50% 분할 — grow0 shrink0로 채팅이 못 흡수하게 고정.
        // flex-basis 트랜지션은 패널을 0에 묶어버려(검은 화면 원인) 제거 — 즉시 전환.
        // 모바일(<900)은 globals.css의 flex:0 0 auto !important가 이겨 height 분할로 전환.
        flex: open ? '0 0 50%' : '0 0 0%',
      }}
    >
      {/* Animated Gradient Border — 브랜드 그린→시안 플로우 */}
      {open && (
        <div
          className="artifact-edge absolute top-0 left-0 w-0.5 h-full z-[100]"
          style={{
            background:
              'linear-gradient(180deg, var(--accent-primary) 0%, var(--neon-cyan) 50%, var(--accent-primary) 100%)',
            backgroundSize: '100% 300%',
            animation: 'gradientBorderFlow 4s linear infinite',
            boxShadow:
              '0 0 8px rgba(34,197,94,0.25), 0 0 20px rgba(0,243,255,0.08)',
          }}
        />
      )}

      <div
        className="h-full flex flex-col"
        style={{ background: 'var(--bg-secondary)' }}
      >
        {/* Header */}
        <div
          className="h-12 flex items-center justify-between px-3 pl-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex-1 min-w-0 flex items-center gap-2 text-[13px] font-medium text-[var(--text-primary)]">
            <div
              className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-[10px] text-white"
              style={{
                background: 'linear-gradient(135deg, #22c55e, #15803d)',
                boxShadow: '0 0 8px rgba(34,197,94,0.25)',
              }}
            >
              ◆
            </div>
            <span className="truncate">{title}</span>
          </div>

          <div className="flex-shrink-0 flex items-center gap-2">
            <div
              className="flex items-center gap-0 p-0.5"
              style={{ background: 'var(--bg-primary)', borderRadius: 6 }}
            >
              {gameHtml && (
                <TabButton label="▶ 플레이" value="play" current={tab} onClick={() => switchTab('play')} />
              )}
              <TabButton label="미리보기" value="preview" current={tab} onClick={() => switchTab('preview')} />
              <TabButton label="코드" value="code" current={tab} onClick={() => switchTab('code')} />
            </div>

            {/* Copy code button */}
            <CopyButton code={gameHtml || code} />

            <button
              onClick={onClose}
              aria-label="패널 닫기"
              className="w-10 h-10 rounded-md flex items-center justify-center text-base text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] active:scale-95 cursor-pointer transition-all duration-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body — managed entirely by DOM for streaming */}
        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto p-4 px-5"
          style={{
            lineHeight: 1.7,
            color: 'var(--text-primary)',
          }}
        />
      </div>
    </div>
  );
}

function TabButton({
  label,
  value,
  current,
  onClick,
}: {
  label: string;
  value: string;
  current: string;
  onClick: () => void;
}) {
  const isActive = current === value;
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded text-[13px] cursor-pointer transition-all duration-200 active:scale-95 ${
        isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
      }`}
      style={{
        background: isActive ? 'var(--bg-surface)' : 'transparent',
        border: 'none',
        fontFamily: 'var(--font-body)',
      }}
    >
      {label}
    </button>
  );
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="h-10 px-3 rounded-md flex items-center justify-center gap-1 text-[12px] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] active:scale-95 cursor-pointer transition-all duration-200"
      style={{ border: 'none', background: 'transparent', fontFamily: 'var(--font-body)' }}
      title="코드 복사"
    >
      {copied ? '✓ 복사됨' : <>📋<span className="max-[480px]:hidden"> 복사</span></>}
    </button>
  );
}
