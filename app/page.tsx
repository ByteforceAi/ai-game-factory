'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { DEMO_GAMES, DemoGame } from '@/lib/demoGames';
import { getGameExtensionsScript } from '@/lib/gameExtensions';
import GameSelector from '@/components/GameSelector';
import CodeStreamView from '@/components/CodeStreamView';
import RemixPanel from '@/components/RemixPanel';

type AppView = 'select' | 'generating' | 'playing';

export default function Home() {
  const [view, setView] = useState<AppView>('select');
  const [selectedGame, setSelectedGame] = useState<DemoGame | null>(null);
  const [gameCode, setGameCode] = useState('');
  const [showRemix, setShowRemix] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameScore, setGameScore] = useState(0);

  const writeGameToIframe = useCallback((html: string) => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      try {
        const innerDoc = iframeRef.current?.contentDocument;
        if (innerDoc?.body) {
          const script = innerDoc.createElement('script');
          script.textContent = getGameExtensionsScript();
          innerDoc.body.appendChild(script);
        }
      } catch {}
    }, 200);
  }, []);

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

  const handleSelectGame = (game: DemoGame) => {
    setSelectedGame(game);
    setView('generating');
  };

  const handleGenerationComplete = useCallback((html: string) => {
    setGameCode(html);
    setView('playing');
    setTimeout(() => writeGameToIframe(html), 100);
  }, [writeGameToIframe]);

  const handleRestart = () => {
    setShowLeaderboard(false);
    setGameScore(0);
    if (gameCode) writeGameToIframe(gameCode);
  };

  const handleReset = () => {
    setView('select');
    setSelectedGame(null);
    setGameCode('');
    setShowRemix(false);
    setShowCode(false);
    setShowLeaderboard(false);
    setGameScore(0);
  };

  const handleApplyRemix = (newHtml: string) => {
    setGameCode(newHtml);
    setShowRemix(false);
    writeGameToIframe(newHtml);
  };

  if (view === 'select') {
    return <GameSelector onSelect={handleSelectGame} />;
  }

  if (view === 'generating' && selectedGame) {
    return (
      <CodeStreamView
        gameHtml={selectedGame.html}
        gameTitle={selectedGame.title}
        onComplete={handleGenerationComplete}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0d1117',
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid #21262d',
        background: '#161b22',
        flexShrink: 0,
      }}>
        <button
          onClick={handleReset}
          style={{
            background: 'none',
            border: 'none',
            color: '#8b949e',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: '8px',
          }}
        >
          ← 나가기
        </button>
        <span style={{
          color: '#e6edf3',
          fontSize: '15px',
          fontWeight: 600,
        }}>
          {selectedGame?.icon} {selectedGame?.title}
        </span>
        <button
          onClick={handleRestart}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: '#e6edf3',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '8px',
          }}
        >
          ↻ 다시
        </button>
      </div>

      {/* Game Area */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 0,
      }}>
        <iframe
          ref={iframeRef}
          title="game"
          sandbox="allow-scripts allow-same-origin"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />

        {showLeaderboard && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            zIndex: 10,
          }}>
            <div style={{ fontSize: '48px' }}>🏆</div>
            <div style={{ color: '#FFD700', fontSize: '32px', fontWeight: 700 }}>
              {gameScore} 점
            </div>
            <button
              onClick={handleRestart}
              style={{
                background: 'linear-gradient(135deg, #58a6ff, #388bfd)',
                border: 'none',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 600,
                padding: '12px 32px',
                borderRadius: '12px',
                cursor: 'pointer',
                marginTop: '8px',
              }}
            >
              다시 시작
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '10px 16px',
        borderTop: '1px solid #21262d',
        background: '#161b22',
        flexShrink: 0,
      }}>
        <button
          onClick={() => setShowCode(!showCode)}
          style={{
            flex: 1,
            background: showCode ? 'rgba(88,166,255,0.15)' : 'rgba(255,255,255,0.06)',
            border: showCode ? '1px solid #58a6ff' : '1px solid #21262d',
            color: showCode ? '#58a6ff' : '#8b949e',
            fontSize: '13px',
            fontWeight: 500,
            padding: '10px',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
        >
          {'</>'} 코드 보기
        </button>
        <button
          onClick={() => setShowRemix(!showRemix)}
          style={{
            flex: 1,
            background: showRemix ? 'rgba(63,185,80,0.15)' : 'rgba(255,255,255,0.06)',
            border: showRemix ? '1px solid #3fb950' : '1px solid #21262d',
            color: showRemix ? '#3fb950' : '#8b949e',
            fontSize: '13px',
            fontWeight: 500,
            padding: '10px',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
        >
          🎨 리믹스
        </button>
      </div>

      {showCode && (
        <div style={{
          maxHeight: '40vh',
          overflow: 'auto',
          background: '#0d1117',
          borderTop: '1px solid #21262d',
          padding: '12px 16px',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}>
            <span style={{ color: '#8b949e', fontSize: '12px' }}>
              {selectedGame?.title}.html — {gameCode.split('\n').length} lines
            </span>
            <button
              onClick={() => setShowCode(false)}
              style={{ background: 'none', border: 'none', color: '#484f58', fontSize: '13px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <pre style={{
            color: '#a5d6ff',
            fontSize: '10px',
            lineHeight: 1.5,
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontFamily: "'Fira Code', 'Courier New', monospace",
          }}>
            {gameCode}
          </pre>
        </div>
      )}

      {showRemix && selectedGame && (
        <RemixPanel
          gameId={selectedGame.id}
          gameHtml={gameCode}
          onApplyRemix={handleApplyRemix}
          onBack={() => setShowRemix(false)}
        />
      )}
    </div>
  );
}
