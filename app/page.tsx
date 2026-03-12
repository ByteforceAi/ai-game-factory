'use client';

import { useState, useCallback, useRef } from 'react';
import StepIndicator from '@/components/StepIndicator';
import GameIdeaInput from '@/components/GameIdeaInput';
import GeneratingOverlay, { STATUS_MESSAGES } from '@/components/GeneratingOverlay';
import GamePlayer from '@/components/GamePlayer';
import GameEditor from '@/components/GameEditor';
import Link from 'next/link';

function cleanHtml(raw: string): string {
  let html = raw;
  if (html.includes('```html')) {
    html = html.split('```html')[1]?.split('```')[0] || html;
  } else if (html.includes('```')) {
    html = html.split('```')[1]?.split('```')[0] || html;
  }
  return html.trim();
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [idea, setIdea] = useState('');
  const [generating, setGenerating] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [streamingCode, setStreamingCode] = useState('');
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'play' | 'edit'>('play');
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateGame = useCallback(async () => {
    if (!idea.trim()) return;
    setGenerating(true);
    setError('');
    setStep(1);
    setStreamingCode('');
    setStatusMsg('AI 엔진 초기화 중...');

    let msgIndex = 0;
    statusIntervalRef.current = setInterval(() => {
      msgIndex = (msgIndex + 1) % STATUS_MESSAGES.length;
      setStatusMsg(STATUS_MESSAGES[msgIndex]);
    }, 2500);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: idea }),
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
        setStreamingCode(accumulated);
      }

      const finalHtml = cleanHtml(accumulated);

      if (!finalHtml.startsWith('<!DOCTYPE') && !finalHtml.startsWith('<html') && !finalHtml.startsWith('<')) {
        throw new Error('유효한 게임 코드를 생성하지 못했습니다. 다시 시도해주세요.');
      }

      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      setGameCode(finalHtml);
      setStep(2);
      setActiveTab('play');
      setStatusMsg('');
    } catch (err: unknown) {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      setError(err instanceof Error ? err.message : '게임 생성 중 오류가 발생했습니다.');
      setStep(0);
      setStatusMsg('');
    } finally {
      setGenerating(false);
    }
  }, [idea]);

  const reset = () => {
    setStep(0);
    setIdea('');
    setGameCode('');
    setStreamingCode('');
    setError('');
    setStatusMsg('');
    setActiveTab('play');
  };

  const applyEditedCode = (code: string) => {
    setGameCode(code);
    setActiveTab('play');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Header */}
      <header className="relative z-10 pt-8 pb-4 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyber-cyan shadow-[0_0_10px_#00E5FF] animate-neon-pulse" />
          <Link href="/">
            <h1 className="font-orbitron text-2xl md:text-3xl font-extrabold tracking-[6px] bg-gradient-to-r from-cyber-cyan via-cyber-text to-cyber-cyan bg-clip-text text-transparent">
              AI GAME FACTORY
            </h1>
          </Link>
          <div className="w-2.5 h-2.5 rounded-full bg-cyber-cyan shadow-[0_0_10px_#00E5FF] animate-neon-pulse" />
        </div>
        <p className="font-mono text-[11px] text-cyber-cyan/50 tracking-[4px]">
          PROMPT → GENERATE → PLAY
        </p>
        {/* Nav */}
        <div className="flex justify-center gap-6 mt-3">
          <Link
            href="/gallery"
            className="font-mono text-[11px] text-cyber-text/40 tracking-[2px] hover:text-cyber-cyan transition-colors"
          >
            GALLERY
          </Link>
        </div>
      </header>

      <StepIndicator currentStep={step} />

      <main className="relative z-10 max-w-[900px] mx-auto px-4 md:px-6 pb-16">
        {step === 0 && (
          <GameIdeaInput
            idea={idea}
            setIdea={setIdea}
            onGenerate={generateGame}
            generating={generating}
            error={error}
          />
        )}

        {step === 1 && generating && (
          <GeneratingOverlay streamingCode={streamingCode} statusMsg={statusMsg} />
        )}

        {step === 2 && (
          <GamePlayer
            gameCode={gameCode}
            onReset={reset}
            onEditCode={() => setActiveTab('edit')}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          >
            <GameEditor code={gameCode} onApply={applyEditedCode} />
          </GamePlayer>
        )}
      </main>

      <footer className="relative z-10 text-center pb-8">
        <div className="w-48 h-px mx-auto mb-4 bg-gradient-to-r from-transparent via-cyber-cyan/20 to-transparent" />
        <span className="font-mono text-[10px] text-cyber-text/20 tracking-[3px]">
          POWERED BY BYTEFORCE × CLAUDE AI
        </span>
      </footer>
    </div>
  );
}
