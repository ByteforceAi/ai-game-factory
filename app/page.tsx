'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const EXAMPLE_IDEAS = [
  '우주선이 운석을 피하는 게임 만들어줘',
  '뱀이 사과를 먹으며 커지는 게임',
  '공이 벽돌을 깨는 브레이크아웃 게임',
  '좌우로 움직이며 떨어지는 아이템을 받는 게임',
];

const STEP_LABELS = ['아이디어 입력', '코드 생성', '테스트 & 플레이'];

const STATUS_MESSAGES = [
  '게임 컨셉 분석 중...',
  '게임 로직 설계 중...',
  '캔버스 렌더링 코드 생성 중...',
  '물리엔진 시뮬레이션 구축 중...',
  '충돌 감지 시스템 구현 중...',
  'UI/UX 레이아웃 생성 중...',
  '최종 코드 컴파일 중...',
];

export default function Home() {
  const [step, setStep] = useState(0);
  const [idea, setIdea] = useState('');
  const [generating, setGenerating] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generateGame = useCallback(async () => {
    if (!idea.trim()) return;
    setGenerating(true);
    setError('');
    setStep(1);
    setStatusMsg('AI 엔진 초기화 중...');

    let msgIndex = 0;
    const statusInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % STATUS_MESSAGES.length;
      setStatusMsg(STATUS_MESSAGES[msgIndex]);
    }, 2500);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: idea }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      clearInterval(statusInterval);
      setGameCode(data.html);
      setStep(2);
      setStatusMsg('');
    } catch (err: unknown) {
      clearInterval(statusInterval);
      setError(err instanceof Error ? err.message : '게임 생성 중 오류가 발생했습니다.');
      setStep(0);
      setStatusMsg('');
    } finally {
      setGenerating(false);
    }
  }, [idea]);

  // Load game into iframe
  useEffect(() => {
    if (gameCode && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(gameCode);
        doc.close();
      }
    }
  }, [gameCode]);

  const reset = () => {
    setStep(0);
    setIdea('');
    setGameCode('');
    setError('');
    setStatusMsg('');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Header */}
      <header className="relative z-10 pt-8 pb-4 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyber-cyan shadow-[0_0_10px_#00E5FF] animate-neon-pulse" />
          <h1 className="font-orbitron text-2xl md:text-3xl font-extrabold tracking-[6px] bg-gradient-to-r from-cyber-cyan via-cyber-text to-cyber-cyan bg-clip-text text-transparent">
            AI GAME FACTORY
          </h1>
          <div className="w-2.5 h-2.5 rounded-full bg-cyber-cyan shadow-[0_0_10px_#00E5FF] animate-neon-pulse" />
        </div>
        <p className="font-mono text-[11px] text-cyber-cyan/50 tracking-[4px]">
          PROMPT → GENERATE → PLAY
        </p>
      </header>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-0 mb-8 px-4">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center min-w-[100px] md:min-w-[120px]">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-orbitron font-bold transition-all duration-500 ${
                  i === step
                    ? 'bg-gradient-to-br from-cyber-cyan to-[#0088aa] border-2 border-cyber-cyan text-cyber-cyan shadow-[0_0_20px_rgba(0,229,255,0.4)]'
                    : i < step
                    ? 'bg-cyber-cyan/20 border border-cyber-cyan/40 text-cyber-cyan'
                    : 'bg-white/5 border border-white/10 text-white/30'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span
                className={`mt-2 text-[11px] font-body transition-all duration-400 ${
                  i <= step ? 'text-cyber-cyan' : 'text-white/30'
                } ${i === step ? 'font-bold tracking-wider' : ''}`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`w-10 md:w-16 h-px mb-5 transition-all duration-500 ${
                  i < step
                    ? 'bg-gradient-to-r from-cyber-cyan to-cyber-cyan/30 shadow-[0_0_6px_rgba(0,229,255,0.3)]'
                    : 'bg-white/10'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-[900px] mx-auto px-4 md:px-6 pb-16">
        {/* Step 0: Input */}
        {step === 0 && (
          <div className="glass-card hud-bracket p-6 md:p-8 animate-[slideUp_0.6s_ease]">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-[13px] font-orbitron text-cyber-cyan tracking-[2px]">
                GAME.IDEA.INPUT
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-cyber-cyan/30 to-transparent" />
            </div>

            <p className="text-sm text-cyber-text/60 mb-5 leading-relaxed">
              원하는 게임을 설명해주세요. AI가 즉시 플레이 가능한 게임을 생성합니다.
            </p>

            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="예: 우주선이 운석을 피하는 게임 만들어줘"
              rows={3}
              className="w-full p-4 bg-black/40 border border-cyber-cyan/15 rounded-[10px] text-cyber-text text-[15px] font-body leading-relaxed resize-vertical transition-all focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_20px_rgba(0,229,255,0.2)] placeholder:text-cyber-text/25"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  generateGame();
                }
              }}
            />

            <button
              onClick={generateGame}
              disabled={!idea.trim() || generating}
              className="w-full mt-4 py-3.5 btn-neon text-[15px]"
            >
              ⚡ 게임 생성하기
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-[13px]">
                {error}
              </div>
            )}

            {/* Example ideas */}
            <div className="mt-6">
              <span className="text-[11px] font-mono text-cyber-cyan/40 tracking-wider">
                // EXAMPLE IDEAS
              </span>
              <div className="flex flex-wrap gap-2 mt-2.5">
                {EXAMPLE_IDEAS.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setIdea(ex)}
                    className="px-3.5 py-2 bg-cyber-cyan/5 border border-cyber-cyan/12 rounded-md text-cyber-text/60 text-xs font-body cursor-pointer transition-all hover:bg-cyber-cyan/12 hover:text-cyber-cyan hover:border-cyber-cyan/30"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Generating */}
        {step === 1 && generating && (
          <div className="glass-card p-12 text-center animate-[slideUp_0.6s_ease] relative overflow-hidden">
            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyber-cyan/50 to-transparent animate-scan-beam" />

            <div className="w-20 h-20 mx-auto mb-7 rounded-full border-[3px] border-cyber-cyan/10 border-t-cyber-cyan animate-spin" />

            <p className="font-orbitron text-base text-cyber-cyan tracking-[3px] mb-3">
              GENERATING GAME
            </p>
            <p className="font-mono text-[13px] text-cyber-cyan/60 min-h-[20px]">
              {statusMsg}
            </p>

            <div className="mt-5 flex justify-center gap-5 font-mono text-[11px] text-cyber-text/30">
              <span>MODEL: claude-sonnet-4</span>
              <span>•</span>
              <span>MAX_TOKENS: 8000</span>
            </div>
          </div>
        )}

        {/* Step 2: Game Play */}
        {step === 2 && (
          <div className="animate-[slideUp_0.6s_ease]">
            <div className="glass-card overflow-hidden animate-glow-pulse hud-bracket">
              {/* Title bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-cyber-cyan/10 bg-black/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyber-green shadow-[0_0_6px_rgba(0,230,118,0.5)]" />
                  <span className="font-orbitron text-[11px] text-cyber-cyan tracking-[2px]">
                    GAME.RUNTIME
                  </span>
                </div>
                <span className="font-mono text-[10px] text-cyber-text/30">
                  STATUS: ACTIVE
                </span>
              </div>

              {/* Game iframe */}
              <div className="p-4 flex justify-center bg-black/20">
                <iframe
                  ref={iframeRef}
                  title="game"
                  sandbox="allow-scripts"
                  className="w-full max-w-[620px] h-[440px] border border-cyber-cyan/10 rounded-lg bg-black"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3 mt-4 justify-center">
              <button
                onClick={reset}
                className="px-7 py-3 bg-cyber-cyan/8 border border-cyber-cyan/20 rounded-lg text-cyber-cyan text-[13px] font-orbitron tracking-[2px] cursor-pointer transition-all hover:bg-cyber-cyan/15 hover:shadow-[0_0_20px_rgba(0,229,255,0.2)]"
              >
                ← 새 게임 만들기
              </button>
              <button
                onClick={() => {
                  if (iframeRef.current?.contentDocument) {
                    const doc = iframeRef.current.contentDocument;
                    doc.open();
                    doc.write(gameCode);
                    doc.close();
                  }
                }}
                className="px-7 py-3 btn-neon text-[13px]"
              >
                ↻ 다시 시작
              </button>
            </div>

            {/* Tips */}
            <div className="mt-5 p-4 bg-cyber-cyan/3 border border-cyber-cyan/8 rounded-[10px]">
              <div className="flex items-center gap-2 mb-2">
                <span>💡</span>
                <span className="font-orbitron text-[11px] text-cyber-cyan tracking-[2px]">
                  TIPS
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-cyber-text/50">
                <span>• 방향키 또는 WASD로 조작</span>
                <span>• 친구들과 점수 대결!</span>
                <span>• 새로운 아이디어로 게임 생성</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-8">
        <div className="w-48 h-px mx-auto mb-4 bg-gradient-to-r from-transparent via-cyber-cyan/20 to-transparent" />
        <span className="font-mono text-[10px] text-cyber-text/20 tracking-[3px]">
          POWERED BY BYTEFORCE × CLAUDE AI
        </span>
      </footer>
    </div>
  );
}
