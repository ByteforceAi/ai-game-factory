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
    <div className="glass-card p-6 md:p-8 animate-[slideUp_0.6s_ease] relative overflow-hidden">
      <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyber-cyan/50 to-transparent animate-scan-beam" />

      {/* Status header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-10 h-10 rounded-full border-[3px] border-cyber-cyan/10 border-t-cyber-cyan animate-spin flex-shrink-0" />
        <div>
          <p className="font-orbitron text-sm text-cyber-cyan tracking-[3px]">
            GENERATING GAME
          </p>
          <p className="font-mono text-[12px] text-cyber-cyan/60 mt-1">
            {statusMsg}
          </p>
        </div>
      </div>

      {/* Live code preview */}
      {streamingCode && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-cyber-green shadow-[0_0_6px_rgba(0,230,118,0.5)] animate-pulse" />
            <span className="font-mono text-[10px] text-cyber-cyan/40 tracking-[2px]">
              LIVE CODE OUTPUT
            </span>
          </div>
          <pre
            ref={codeRef}
            className="w-full h-[300px] p-4 bg-black/60 border border-cyber-cyan/10 rounded-lg text-[11px] text-cyber-text/70 font-mono overflow-auto leading-relaxed"
          >
            {streamingCode}
          </pre>
        </div>
      )}

      {/* Meta info */}
      <div className="mt-4 flex justify-center gap-5 font-mono text-[11px] text-cyber-text/30">
        <span>MODEL: claude-sonnet-4</span>
        <span>•</span>
        <span>STREAMING: ACTIVE</span>
      </div>
    </div>
  );
}

export { STATUS_MESSAGES };
