'use client';

import dynamic from 'next/dynamic';
import { useState, useRef, useEffect } from 'react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[440px] flex items-center justify-center bg-[#1e1e2e] border border-black/[0.06] rounded-[14px]">
      <div className="text-white/40 text-sm">에디터 로딩 중...</div>
    </div>
  ),
});

const REMIX_SUGGESTIONS = [
  { icon: '🎨', label: '색상 변경', prompt: '게임의 전체 색상 테마를 더 화려하고 네온 느낌으로 변경해줘. 배경도 그라데이션으로.' },
  { icon: '⚡', label: '난이도 UP', prompt: '게임 난이도를 높여줘. 적/장애물 속도를 빠르게 하고 더 많이 나오게.' },
  { icon: '💥', label: '파워업 추가', prompt: '파워업 아이템을 추가해줘. 랜덤하게 나타나고 먹으면 3초간 특수 능력이 생기게.' },
  { icon: '🌟', label: '파티클 효과', prompt: '충돌이나 점수 획득 시 파티클 이펙트를 추가해줘. 작은 원들이 퍼지는 효과.' },
  { icon: '🏆', label: '레벨 시스템', prompt: '레벨 시스템을 추가해줘. 점수가 일정 이상이면 레벨업하고 난이도가 올라가게.' },
  { icon: '🎵', label: '효과음 추가', prompt: 'Web Audio API로 간단한 효과음을 추가해줘. 점수 획득, 충돌, 게임오버 시 소리가 나게.' },
];

interface GameEditorProps {
  code: string;
  onApply: (code: string) => void;
}

function cleanHtml(raw: string): string {
  let html = raw;
  if (html.includes('```html')) {
    html = html.split('```html')[1]?.split('```')[0] || html;
  } else if (html.includes('```')) {
    html = html.split('```')[1]?.split('```')[0] || html;
  }
  return html.trim();
}

export default function GameEditor({ code, onApply }: GameEditorProps) {
  const [editedCode, setEditedCode] = useState(code);
  const [hasChanges, setHasChanges] = useState(false);
  const [remixing, setRemixing] = useState(false);
  const [remixPrompt, setRemixPrompt] = useState('');
  const [remixStatus, setRemixStatus] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  // Sync editedCode when code prop changes (e.g., after remix applied)
  useEffect(() => {
    setEditedCode(code);
    setHasChanges(false);
  }, [code]);

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditedCode(value);
      setHasChanges(value !== code);
    }
  };

  const handleApply = () => {
    onApply(editedCode);
    setHasChanges(false);
  };

  const startRemix = async (prompt: string) => {
    if (remixing) return;

    setRemixing(true);
    setRemixPrompt(prompt);
    setRemixStatus('AI가 게임을 수정하고 있어요...');

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: code, prompt }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('스트리밍을 시작할 수 없습니다.');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setEditedCode(accumulated);
        setRemixStatus(`AI 수정 중... (${Math.round(accumulated.length / 100)}KB)`);
      }

      const finalHtml = cleanHtml(accumulated);
      setEditedCode(finalHtml);
      setHasChanges(true);
      setRemixStatus('✓ 수정 완료! "적용하기"를 눌러주세요.');

      setTimeout(() => setRemixStatus(''), 4000);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setRemixStatus('수정이 취소되었습니다.');
      } else {
        setRemixStatus(`오류: ${err instanceof Error ? err.message : '수정 실패'}`);
      }
      setTimeout(() => setRemixStatus(''), 3000);
    } finally {
      setRemixing(false);
      setRemixPrompt('');
    }
  };

  const cancelRemix = () => {
    abortRef.current?.abort();
  };

  const handleCustomRemix = () => {
    if (!customPrompt.trim()) return;
    startRemix(customPrompt.trim());
    setCustomPrompt('');
  };

  return (
    <div>
      {/* AI Remix Section */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[12px] font-semibold text-glass-text-muted tracking-wider uppercase">
            🤖 AI 리믹스
          </span>
          <div className="flex-1 h-px bg-black/[0.06]" />
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {REMIX_SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => startRemix(s.prompt)}
              disabled={remixing}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                remixing
                  ? 'opacity-40 cursor-not-allowed bg-black/[0.03] text-glass-text-muted'
                  : 'bg-black/[0.04] text-glass-text-secondary hover:bg-glass-accent/10 hover:text-glass-accent border border-black/[0.06] hover:border-glass-accent/30'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Custom Prompt Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomRemix()}
            placeholder="직접 수정 요청 입력... (예: 적 종류를 3가지로 늘려줘)"
            disabled={remixing}
            className="flex-1 px-3 py-2 rounded-[10px] bg-black/[0.03] border border-black/[0.06] text-[13px] text-glass-text placeholder:text-glass-text-muted focus:outline-none focus:border-glass-accent/40 focus:ring-1 focus:ring-glass-accent/20 transition-all disabled:opacity-40"
          />
          <button
            onClick={handleCustomRemix}
            disabled={remixing || !customPrompt.trim()}
            className="px-4 py-2 rounded-[10px] text-[13px] font-medium bg-glass-accent text-white hover:bg-glass-accent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            리믹스
          </button>
        </div>

        {/* Status Bar */}
        {(remixing || remixStatus) && (
          <div className="mt-2 flex items-center gap-2">
            {remixing && (
              <div className="w-3.5 h-3.5 border-2 border-glass-accent border-t-transparent rounded-full animate-spin" />
            )}
            <span className={`text-[12px] ${remixStatus.startsWith('✓') ? 'text-glass-green' : remixStatus.startsWith('오류') ? 'text-red-500' : 'text-glass-accent'}`}>
              {remixStatus}
            </span>
            {remixing && (
              <button
                onClick={cancelRemix}
                className="ml-auto text-[11px] text-glass-text-muted hover:text-red-500 transition-colors"
              >
                취소
              </button>
            )}
          </div>
        )}
      </div>

      {/* Monaco Editor */}
      <div className="rounded-[14px] overflow-hidden border border-black/[0.06] shadow-sm">
        <MonacoEditor
          height="380px"
          language="html"
          theme="vs-dark"
          value={editedCode}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 12,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            lineNumbers: 'on',
            renderWhitespace: 'none',
            bracketPairColorization: { enabled: true },
            readOnly: remixing,
          }}
        />
      </div>

      {/* Apply Button */}
      {hasChanges && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleApply}
            className="btn-glass text-[13px]"
            style={{ background: '#34C759' }}
          >
            ✓ 적용하기
          </button>
        </div>
      )}
    </div>
  );
}
