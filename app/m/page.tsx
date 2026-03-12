'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { DEMO_GAMES, type DemoGame } from '@/lib/demoGames';
import { getGameExtensionsScript } from '@/lib/gameExtensions';
import LeaderboardOverlay from '@/components/LeaderboardOverlay';

const STATUS_MESSAGES = [
  '게임 컨셉 분석 중...',
  '게임 로직 설계 중...',
  '캔버스 렌더링 코드 생성 중...',
  '물리엔진 시뮬레이션 구축 중...',
  '충돌 감지 시스템 구현 중...',
  'UI/UX 레이아웃 생성 중...',
  '최종 코드 컴파일 중...',
];

function cleanHtml(raw: string): string {
  let html = raw;
  if (html.includes('```html')) {
    html = html.split('```html')[1]?.split('```')[0] || html;
  } else if (html.includes('```')) {
    html = html.split('```')[1]?.split('```')[0] || html;
  }
  return html.trim();
}

type MobileView = 'home' | 'generating' | 'demoGenerating' | 'playing';

export default function MobilePage() {
  const [view, setView] = useState<MobileView>('home');
  const [idea, setIdea] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [streamingCode, setStreamingCode] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [currentDemo, setCurrentDemo] = useState<DemoGame | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameScore, setGameScore] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const demoAnimRef = useRef<number | null>(null);
  const demoStatusRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      if (demoAnimRef.current) cancelAnimationFrame(demoAnimRef.current);
      if (demoStatusRef.current) clearInterval(demoStatusRef.current);
    };
  }, []);

  // Listen for gameOver messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'gameOver' && typeof event.data.score === 'number') {
        setGameScore(event.data.score);
        setShowLeaderboard(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const writeGameToIframe = useCallback(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(gameCode);
    doc.close();
    setTimeout(() => {
      try {
        const innerDoc = iframeRef.current?.contentDocument;
        if (innerDoc?.body) {
          const script = innerDoc.createElement('script');
          script.textContent = getGameExtensionsScript();
          innerDoc.body.appendChild(script);
        }
      } catch {
        // Sandbox may block
      }
    }, 200);
  }, [gameCode]);

  // Write game code to iframe when entering playing state
  useEffect(() => {
    if (view === 'playing' && gameCode) {
      const t = setTimeout(() => writeGameToIframe(), 50);
      return () => clearTimeout(t);
    }
  }, [view, gameCode, writeGameToIframe]);

  const reset = () => {
    if (demoAnimRef.current) cancelAnimationFrame(demoAnimRef.current);
    if (demoStatusRef.current) clearInterval(demoStatusRef.current);
    if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    setView('home');
    setIdea('');
    setGameCode('');
    setStreamingCode('');
    setError('');
    setStatusMsg('');
    setCurrentDemo(null);
    setShowLeaderboard(false);
    setGameScore(0);
    setGenerating(false);
  };

  const restartGame = () => {
    setShowLeaderboard(false);
    setGameScore(0);
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: 'resetGameOver' }, '*');
    } catch {}
    writeGameToIframe();
  };

  /** Theatrical demo animation — streams code char by char over 4.5s */
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
      const eased =
        progress < 0.5
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
          setView('playing');
          setStreamingCode('');
          setStatusMsg('');
        }, 800);
      }
    };
    demoAnimRef.current = requestAnimationFrame(animate);
  };

  /** Real AI generation */
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
      if (
        !finalHtml.startsWith('<!DOCTYPE') &&
        !finalHtml.startsWith('<html') &&
        !finalHtml.startsWith('<')
      ) {
        throw new Error('유효한 게임 코드를 생성하지 못했습니다. 다시 시도해주세요.');
      }

      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      setGameCode(finalHtml);
      setCurrentDemo(null);
      setView('playing');
      setStatusMsg('');
    } catch (err: unknown) {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      setError(err instanceof Error ? err.message : '게임 생성 중 오류가 발생했습니다.');
      setView('home');
      setStatusMsg('');
    } finally {
      setGenerating(false);
    }
  }, [idea]);

  // ─── HOME VIEW ───
  if (view === 'home') {
    return (
      <div
        style={{
          height: '100dvh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            textAlign: 'center',
            margin: 0,
            letterSpacing: '-0.5px',
          }}
        >
          🎮 AI 게임 팩토리
        </h1>

        {/* Demo Games */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {DEMO_GAMES.slice(0, 3).map((game) => (
            <button
              key={game.id}
              onClick={() => playDemo(game)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                width: '100%',
                padding: '16px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                color: '#e5e5e5',
                textAlign: 'left',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: '32px', lineHeight: 1 }}>{game.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>{game.title}</div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {game.description}
                </div>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '18px' }}>▶</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            background: 'rgba(255,255,255,0.08)',
            margin: '4px 0',
          }}
        />

        {/* Create Section */}
        <div>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 700,
              marginBottom: '4px',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            ✨ 나만의 게임 만들기
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.4)',
              marginBottom: '12px',
              marginTop: 0,
            }}
          >
            어떤 게임을 만들고 싶으세요? AI가 바로 만들어드릴게요!
          </p>

          {error && (
            <div
              style={{
                fontSize: '13px',
                color: '#f87171',
                marginBottom: '10px',
                padding: '10px 12px',
                background: 'rgba(248,113,113,0.1)',
                borderRadius: '10px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateGame()}
              placeholder="예: 좀비를 피해 도망치는 게임"
              style={{
                flex: 1,
                padding: '14px 16px',
                fontSize: '15px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#e5e5e5',
                outline: 'none',
              }}
            />
            <button
              onClick={generateGame}
              disabled={generating || !idea.trim()}
              style={{
                padding: '14px 20px',
                fontSize: '15px',
                fontWeight: 700,
                background: !idea.trim()
                  ? 'rgba(255,255,255,0.06)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: '12px',
                color: !idea.trim() ? 'rgba(255,255,255,0.3)' : '#fff',
                cursor: !idea.trim() ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              ⚡ 생성하기
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '16px',
            textAlign: 'center',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.5px',
          }}
        >
          Powered by ByteForce × Claude AI
        </div>
      </div>
    );
  }

  // ─── GENERATING / DEMO GENERATING VIEW ───
  if (view === 'generating' || view === 'demoGenerating') {
    return (
      <div
        style={{
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          gap: '16px',
        }}
      >
        {/* Demo prompt badge */}
        {view === 'demoGenerating' && currentDemo && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '12px',
            }}
          >
            <span style={{ fontSize: '22px' }}>{currentDemo.icon}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>입력된 프롬프트</div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: 'monospace',
                }}
              >
                &ldquo;{currentDemo.prompt}&rdquo;
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-block',
              width: '32px',
              height: '32px',
              border: '3px solid rgba(99,102,241,0.3)',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ fontSize: '14px', fontWeight: 600, marginTop: '12px' }}>
            {statusMsg || 'AI 엔진 초기화 중...'}
          </p>
        </div>

        {/* Code preview */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '12px',
            position: 'relative',
          }}
        >
          <pre
            style={{
              margin: 0,
              fontSize: '10px',
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              overflow: 'hidden',
              maxHeight: '100%',
            }}
          >
            {streamingCode.slice(-2000)}
          </pre>
          {/* Fade overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Spin animation */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── PLAYING VIEW ───
  if (view === 'playing') {
    return (
      <div
        style={{
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          background: '#000',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            background: 'rgba(0,0,0,0.9)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={reset}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '13px',
              padding: '6px 10px',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            ← 나가기
          </button>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.8)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '45%',
              textAlign: 'center',
            }}
          >
            {currentDemo?.title || '나의 게임'}
          </span>
          <button
            onClick={restartGame}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '13px',
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            ↻
          </button>
        </div>

        {/* Game iframe */}
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <iframe
            ref={iframeRef}
            title="game"
            sandbox="allow-scripts allow-same-origin"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            }}
          />

          {/* Leaderboard overlay */}
          {showLeaderboard && (
            <LeaderboardOverlay
              gameId={currentDemo?.id || 'custom'}
              score={gameScore}
              onRestart={restartGame}
              onClose={() => setShowLeaderboard(false)}
            />
          )}
        </div>
      </div>
    );
  }

  return null;
}
