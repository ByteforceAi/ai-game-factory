'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import GameIdeaInput from '@/components/GameIdeaInput';
import GeneratingOverlay, { STATUS_MESSAGES } from '@/components/GeneratingOverlay';
import GamePlayer from '@/components/GamePlayer';
import GameEditor from '@/components/GameEditor';
import DemoGameCard from '@/components/DemoGameCard';
import { DEMO_GAMES, type DemoGame } from '@/lib/demoGames';

function cleanHtml(raw: string): string {
  let html = raw;
  if (html.includes('```html')) {
    html = html.split('```html')[1]?.split('```')[0] || html;
  } else if (html.includes('```')) {
    html = html.split('```')[1]?.split('```')[0] || html;
  }
  return html.trim();
}

type View = 'welcome' | 'create' | 'generating' | 'demoGenerating' | 'playing' | 'playingDemo';

export default function Home() {
  const [view, setView] = useState<View>('welcome');
  const [idea, setIdea] = useState('');
  const [generating, setGenerating] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [streamingCode, setStreamingCode] = useState('');
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'play' | 'edit'>('play');
  const [currentDemo, setCurrentDemo] = useState<DemoGame | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const demoAnimRef = useRef<number | null>(null);
  const demoStatusRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      if (demoAnimRef.current) cancelAnimationFrame(demoAnimRef.current);
      if (demoStatusRef.current) clearInterval(demoStatusRef.current);
    };
  }, []);

  const generateGame = useCallback(async () => {
    if (!idea.trim()) return;
    setGenerating(true);
    setError('');
    setView('generating');
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
      setView('playing');
      setActiveTab('play');
      setCurrentDemo(null);
      setStatusMsg('');
    } catch (err: unknown) {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      setError(err instanceof Error ? err.message : '게임 생성 중 오류가 발생했습니다.');
      setView('create');
      setStatusMsg('');
    } finally {
      setGenerating(false);
    }
  }, [idea]);

  const reset = () => {
    if (demoAnimRef.current) cancelAnimationFrame(demoAnimRef.current);
    if (demoStatusRef.current) clearInterval(demoStatusRef.current);
    setView('welcome');
    setIdea('');
    setGameCode('');
    setStreamingCode('');
    setError('');
    setStatusMsg('');
    setActiveTab('play');
    setCurrentDemo(null);
  };

  const applyEditedCode = (code: string) => {
    setGameCode(code);
    setActiveTab('play');
  };

  /** Theatrical demo — fake AI code generation animation */
  const playDemo = (game: DemoGame) => {
    setCurrentDemo(game);
    setIdea(game.prompt);
    setView('demoGenerating');
    setStreamingCode('');
    setStatusMsg(STATUS_MESSAGES[0]);

    const code = game.html;
    const totalDuration = 4500;
    const startTime = Date.now();

    let msgIndex = 0;
    demoStatusRef.current = setInterval(() => {
      msgIndex = (msgIndex + 1) % STATUS_MESSAGES.length;
      setStatusMsg(STATUS_MESSAGES[msgIndex]);
    }, 700);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      // Ease-in-out: slow start → fast middle → slow end
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const charIndex = Math.floor(eased * code.length);
      setStreamingCode(code.substring(0, charIndex));

      if (progress < 1) {
        demoAnimRef.current = requestAnimationFrame(animate);
      } else {
        if (demoStatusRef.current) clearInterval(demoStatusRef.current);
        setStatusMsg('게임 생성 완료!');

        setTimeout(() => {
          setGameCode(code);
          setView('playingDemo');
          setActiveTab('play');
          setStreamingCode('');
          setStatusMsg('');
        }, 800);
      }
    };

    demoAnimRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-6">
      {view === 'welcome' && (
        <div className="py-8 md:py-12 animate-fade-in">
          {/* Hero */}
          <div className="text-center mb-10 md:mb-14">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gradient leading-tight">
              텍스트 한 줄로 게임이 탄생합니다
            </h1>
            <p className="text-[15px] md:text-[17px] text-glass-text-secondary mt-3 md:mt-4 max-w-[540px] mx-auto leading-relaxed">
              자연어 프롬프트를 게임 코드로 변환하는 생성형 AI 기술
            </p>
            <p className="text-[13px] md:text-[14px] text-glass-text-muted mt-1.5 max-w-[460px] mx-auto">
              아이디어를 입력하면 즉시 플레이 가능한 HTML5 게임이 완성됩니다
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            <div className="liquid-glass-sm py-4 text-center">
              <p className="text-xl md:text-2xl font-bold text-glass-accent">&lt; 30초</p>
              <p className="text-[11px] md:text-[12px] text-glass-text-secondary mt-1">게임 생성 시간</p>
            </div>
            <div className="liquid-glass-sm py-4 text-center">
              <p className="text-xl md:text-2xl font-bold text-glass-accent">100%</p>
              <p className="text-[11px] md:text-[12px] text-glass-text-secondary mt-1">브라우저 실행</p>
            </div>
            <div className="liquid-glass-sm py-4 text-center">
              <p className="text-xl md:text-2xl font-bold text-glass-accent">&infin;</p>
              <p className="text-[11px] md:text-[12px] text-glass-text-secondary mt-1">가능한 게임 아이디어</p>
            </div>
          </div>

          {/* Demo Games */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-[13px] font-semibold text-glass-text-muted tracking-wider uppercase">
                AI 게임 생성 기술 체험
              </h2>
              <div className="divider-glass flex-1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEMO_GAMES.map((game) => (
                <DemoGameCard key={game.id} game={game} onPlay={playDemo} />
              ))}
            </div>
          </section>

          {/* Create CTA */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-[13px] font-semibold text-glass-text-muted tracking-wider uppercase">
                나만의 게임
              </h2>
              <div className="divider-glass flex-1" />
            </div>
            <button
              onClick={() => setView('create')}
              className="liquid-glass w-full py-6 text-center cursor-pointer group"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-glass-accent/10 flex items-center justify-center">
                  <span className="text-glass-accent text-xl">+</span>
                </div>
                <p className="text-[15px] font-semibold text-glass-text group-hover:text-glass-accent transition-colors">
                  나만의 게임 만들기
                </p>
                <p className="text-[13px] text-glass-text-secondary mt-1">
                  자연어로 게임 아이디어를 설명하면 AI가 코드를 작성합니다
                </p>
              </div>
            </button>
          </section>

          {/* Footer */}
          <footer className="mt-12 text-center">
            <div className="divider-glass w-48 mx-auto mb-4" />
            <p className="text-[10px] text-glass-text-muted/50 tracking-wide mb-2">
              Next.js &middot; Claude AI &middot; Web Audio API &middot; HTML5 Canvas
            </p>
            <span className="text-[11px] text-glass-text-muted tracking-widest uppercase">
              Powered by ByteForce × Claude AI
            </span>
          </footer>
        </div>
      )}

      {view === 'create' && (
        <div className="max-w-[640px] mx-auto py-8 md:py-12 animate-fade-in">
          <button
            onClick={reset}
            className="mb-5 text-[13px] text-glass-text-secondary hover:text-glass-text transition-colors"
          >
            ← 돌아가기
          </button>
          <GameIdeaInput
            idea={idea}
            setIdea={setIdea}
            onGenerate={generateGame}
            generating={generating}
            error={error}
          />
        </div>
      )}

      {view === 'generating' && generating && (
        <div className="max-w-[640px] mx-auto py-8 md:py-12 animate-fade-in">
          <GeneratingOverlay streamingCode={streamingCode} statusMsg={statusMsg} />
        </div>
      )}

      {/* Demo generating — theatrical code streaming */}
      {view === 'demoGenerating' && (
        <div className="max-w-[640px] mx-auto py-8 md:py-12 animate-fade-in">
          {currentDemo && (
            <div className="liquid-glass-sm px-4 py-3 mb-4 flex items-center gap-3">
              <span className="text-lg">{currentDemo.icon}</span>
              <div>
                <p className="text-[13px] font-medium text-glass-text">입력된 프롬프트</p>
                <p className="text-[12px] text-glass-text-secondary font-mono">&ldquo;{currentDemo.prompt}&rdquo;</p>
              </div>
            </div>
          )}
          <GeneratingOverlay streamingCode={streamingCode} statusMsg={statusMsg} />
        </div>
      )}

      {(view === 'playing' || view === 'playingDemo') && (
        <div className="py-6 md:py-8 animate-fade-in">
          {view === 'playingDemo' && currentDemo && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{currentDemo.icon}</span>
              <span className="text-[15px] font-semibold text-glass-text">{currentDemo.title}</span>
              <span className="text-[12px] text-glass-green font-medium ml-auto">✓ AI 생성 완료</span>
            </div>
          )}
          <GamePlayer
            gameCode={gameCode}
            gameId={currentDemo?.id || 'custom'}
            onReset={reset}
            onEditCode={() => setActiveTab('edit')}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          >
            <GameEditor code={gameCode} onApply={applyEditedCode} />
          </GamePlayer>
        </div>
      )}
    </div>
  );
}
