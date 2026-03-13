'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { DEMO_GAMES, DemoGame } from '@/lib/demoGames';
import { getGameExtensionsScript } from '@/lib/gameExtensions';
import GameSelector from '@/components/GameSelector';
import CodeStreamView from '@/components/CodeStreamView';
import RemixPanel from '@/components/RemixPanel';
import ShareModal from '@/components/ShareModal';

interface LeaderboardEntry {
  name: string;
  score: number;
  ts: number;
}

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
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [submittingScore, setSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [myRank, setMyRank] = useState<number | null>(null);

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

  const fetchLeaderboard = useCallback(async (gameId: string) => {
    try {
      const res = await fetch(`/api/leaderboard?gameId=${gameId}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch {
      // KV not available — ignore silently
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'gameOver' && typeof event.data.score === 'number') {
        setGameScore(event.data.score);
        setShowLeaderboard(true);
        setScoreSubmitted(false);
        setMyRank(null);
        if (selectedGame) fetchLeaderboard(selectedGame.id);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedGame, fetchLeaderboard]);

  const handleSubmitScore = async () => {
    if (!selectedGame || !playerName.trim() || submittingScore) return;
    setSubmittingScore(true);
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: selectedGame.id,
          name: playerName.trim(),
          score: gameScore,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setMyRank(data.rank || null);
        setScoreSubmitted(true);
      }
    } catch {
      // KV not available — ignore
    } finally {
      setSubmittingScore(false);
    }
  };

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
    setScoreSubmitted(false);
    setMyRank(null);
    setPlayerName('');
    setLeaderboard([]);
    if (gameCode) writeGameToIframe(gameCode);
  };

  const handleReset = () => {
    setView('select');
    setSelectedGame(null);
    setGameCode('');
    setShowRemix(false);
    setShowCode(false);
    setShowLeaderboard(false);
    setShowShare(false);
    setGameScore(0);
    setScoreSubmitted(false);
    setMyRank(null);
    setPlayerName('');
    setLeaderboard([]);
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
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: '10vh',
            gap: '12px',
            zIndex: 10,
            overflowY: 'auto',
            padding: '10vh 20px 20px',
          }}>
            <div style={{ fontSize: '40px' }}>🏆</div>
            <div style={{ color: '#FFD700', fontSize: '28px', fontWeight: 700 }}>
              {gameScore} 점
            </div>

            {/* Name input + submit */}
            {!scoreSubmitted ? (
              <div style={{
                display: 'flex',
                gap: '8px',
                width: '100%',
                maxWidth: '300px',
                marginTop: '8px',
              }}>
                <input
                  type="text"
                  placeholder="이름 입력"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitScore()}
                  maxLength={20}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid #30363d',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: '#e6edf3',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleSubmitScore}
                  disabled={!playerName.trim() || submittingScore}
                  style={{
                    background: playerName.trim()
                      ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                      : 'rgba(255,255,255,0.06)',
                    border: 'none',
                    color: playerName.trim() ? '#000' : '#484f58',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '10px 16px',
                    borderRadius: '10px',
                    cursor: playerName.trim() ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {submittingScore ? '...' : '등록'}
                </button>
              </div>
            ) : myRank && (
              <div style={{ color: '#3fb950', fontSize: '14px', fontWeight: 500 }}>
                🎉 {myRank}위에 등록되었습니다!
              </div>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div style={{
                width: '100%',
                maxWidth: '300px',
                marginTop: '8px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid #21262d',
              }}>
                <div style={{
                  color: '#8b949e',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}>
                  순위
                </div>
                {leaderboard.slice(0, 10).map((entry, i) => {
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
                  const isMe = scoreSubmitted && myRank === i + 1;
                  return (
                    <div key={`${entry.name}-${entry.ts}`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: i < Math.min(leaderboard.length, 10) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}>
                      <span style={{
                        color: isMe ? '#FFD700' : '#e6edf3',
                        fontSize: '13px',
                        fontWeight: isMe ? 700 : 400,
                      }}>
                        <span style={{ display: 'inline-block', width: '28px', textAlign: 'center' }}>
                          {medal}
                        </span>
                        {entry.name}
                      </span>
                      <span style={{
                        color: isMe ? '#FFD700' : '#8b949e',
                        fontSize: '13px',
                        fontWeight: isMe ? 700 : 400,
                      }}>
                        {entry.score}점
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
              width: '100%',
              maxWidth: '300px',
              marginTop: '8px',
            }}>
              <button
                onClick={() => setShowShare(true)}
                style={{
                  flex: 1,
                  background: 'rgba(136,108,228,0.15)',
                  border: '1px solid #8b6ce4',
                  color: '#8b6ce4',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                }}
              >
                📤 공유
              </button>
              <button
                onClick={handleRestart}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #58a6ff, #388bfd)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                }}
              >
                🔄 다시
              </button>
            </div>
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
          ✨ 바이브 코딩하기
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

      {showShare && selectedGame && (
        <ShareModal
          gameHtml={gameCode}
          gameTitle={selectedGame.title}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
