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
          setTimeout(() => switchTabRef.current('play'), 800);
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
      div.innerHTML = `<span style="display:inline-block;width:32px;text-align:right;color:var(--text-muted);margin-right:16px;user-select:none;font-size:12px">${num}</span>${highlighted}`;

      // ── Code X-Ray: hover → highlight game element ──
      const lineText = lines[i];
      const xrayMatch = matchXRayTarget(lineText);
      if (xrayMatch) {
        div.style.cursor = 'pointer';
        div.title = xrayMatch.label;
        div.addEventListener('mouseenter', () => {
          div.style.background = 'rgba(99,102,241,0.08)';
          // Send highlight to game iframe
          const iframe = document.querySelector('iframe');
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'XRAY_HIGHLIGHT',
              target: xrayMatch.target,
              label: xrayMatch.label,
            }, '*');
          }
        });
        div.addEventListener('mouseleave', () => {
          div.style.background = 'transparent';
          const iframe = document.querySelector('iframe');
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'XRAY_CLEAR' }, '*');
          }
        });
      }

      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
      i++;
      setTimeout(streamNext, 35 + Math.random() * 25);
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
          div.innerHTML = `<span style="display:inline-block;width:32px;text-align:right;color:var(--text-muted);margin-right:16px;user-select:none;font-size:12px">${num}</span>${syntaxHighlight(line)}`;

          // X-Ray hover on static view too
          const xm = matchXRayTarget(line);
          if (xm) {
            div.style.cursor = 'pointer';
            div.title = xm.label;
            div.addEventListener('mouseenter', () => {
              div.style.background = 'rgba(99,102,241,0.08)';
              const iframe = document.querySelector('iframe');
              if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'XRAY_HIGHLIGHT', target: xm.target, label: xm.label }, '*');
              }
            });
            div.addEventListener('mouseleave', () => {
              div.style.background = 'transparent';
              const iframe = document.querySelector('iframe');
              if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'XRAY_CLEAR' }, '*');
              }
            });
          }

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
        body.appendChild(iframe);
      }
    },
    [code, preview, gameHtml]
  );

  // Keep ref in sync for useEffect to call
  switchTabRef.current = switchTab;

  return (
    <div
      className={`overflow-hidden relative ${open ? 'artifact-panel-open' : ''}`}
      style={{
        width: open ? '50%' : 0,
        transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Animated Gradient Border */}
      {open && (
        <div
          className="absolute top-0 left-0 w-0.5 h-full z-[100]"
          style={{
            background:
              'linear-gradient(180deg, var(--accent-coral) 0%, var(--accent-purple) 33%, var(--accent-blue) 66%, var(--accent-coral) 100%)',
            backgroundSize: '100% 300%',
            animation: 'gradientBorderFlow 4s linear infinite',
            boxShadow:
              '0 0 8px rgba(224,122,95,0.2), 0 0 20px rgba(155,142,196,0.1)',
          }}
        />
      )}

      <div
        className="h-full flex flex-col"
        style={{ background: 'var(--bg-secondary)' }}
      >
        {/* Header */}
        <div
          className="h-11 flex items-center justify-between px-3 pl-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-primary)]">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] text-white"
              style={{ background: 'var(--accent-orange)' }}
            >
              ◆
            </div>
            <span>{title}</span>
          </div>

          <div className="flex items-center gap-2">
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
              className="w-7 h-7 rounded-md flex items-center justify-center text-base text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] cursor-pointer transition-all duration-200"
              style={{ border: 'none', background: 'transparent' }}
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
      className={`px-3 py-1 rounded text-xs cursor-pointer transition-all duration-200 ${
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
      className="h-7 px-2 rounded-md flex items-center justify-center gap-1 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] cursor-pointer transition-all duration-200"
      style={{ border: 'none', background: 'transparent', fontFamily: 'var(--font-body)' }}
      title="코드 복사"
    >
      {copied ? '✓ 복사됨' : '📋 복사'}
    </button>
  );
}
