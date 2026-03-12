'use client';

import { useEffect, useRef } from 'react';

const STATUS_MESSAGES = [
  '게임 컨셉 분석 중...',
  '게임 로직 설계 중...',
  '캔버스 렌더링 코드 생성 중...',
  '물리엔진 시뮬레이션 구축 중...',
  '충돌 감지 시스템 구현 중...',
  'UI/UX 레이아웃 생성 중...',
  '최종 코드 컴파일 중...',
];

interface GeneratingOverlayProps {
  streamingCode: string;
  statusMsg: string;
}

export default function GeneratingOverlay({
  streamingCode,
  statusMsg,
}: GeneratingOverlayProps) {
  const codeRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [streamingCode]);

  return (
    <div className="liquid-glass p-6 md:p-8 animate-slide-up">
      <div className="relative z-10">
        {/* Status */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-glass-accent/10 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-glass-accent/20 border-t-glass-accent animate-spin" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-glass-text tracking-tight">
              게임 생성 중
            </p>
            <p className="text-[13px] text-glass-text-secondary mt-0.5">
              {statusMsg}
            </p>
          </div>
        </div>

        {/* Live code output */}
        {streamingCode && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-glass-green animate-pulse-soft" />
              <span className="text-[11px] text-glass-text-muted font-medium tracking-wider uppercase">
                Live Output
              </span>
            </div>
            <pre
              ref={codeRef}
              className="w-full h-[300px] p-4 bg-[#1e1e2e] border border-black/[0.06] rounded-[14px] text-[11px] text-[#cdd6f4]/80 font-mono overflow-auto leading-relaxed code-cursor"
            >
              {streamingCode}
            </pre>
          </div>
        )}

        {/* Meta */}
        <div className="mt-4 flex justify-center gap-4 text-[11px] text-glass-text-muted">
          <span>Claude Sonnet</span>
          <span>·</span>
          <span>Streaming</span>
        </div>
      </div>
    </div>
  );
}

export { STATUS_MESSAGES };
