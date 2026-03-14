'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { DEMO_GAMES, DemoGame } from '@/lib/demoGames';
import { getGameExtensionsScript } from '@/lib/gameExtensions';
import GameSelector from '@/components/GameSelector';
import CodeStreamView from '@/components/CodeStreamView';
import RemixPanel from '@/components/RemixPanel';
import ShareModal from '@/components/ShareModal';
import { VIBE_STATUS_MESSAGES } from '@/lib/codeSimulator';

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
  const [vibeGenerating, setVibeGenerating] = useState(false);
  const [pendingVibeHtml, setPendingVibeHtml] = useState<string | null>(null);
  const [vibePresetLabel, setVibePresetLabel] = useState('');

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

  const handleApplyRemix = (newHtml: string, presetLabel: string) => {
    setShowRemix(false);
    setShowCode(false);
    setPendingVibeHtml(newHtml);
    setVibePresetLabel(presetLabel);
    setVibeGenerating(true);
  };

  const handleVibeComplete = useCallback((html: string) => {
    setGameCode(html);
    setVibeGenerating(false);
    setPendingVibeHtml(null);
    setVibePresetLabel('');
    setTimeout(() => writeGameToIframe(html), 100);
  }, [writeGameToIframe]);

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

  // --- Glass style constants ---
  const glassBar = {
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    borderColor: 'rgba(255,255,255,0.4)',
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top Bar — frosted glass */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: `1px solid ${glassBar.borderColor}`,
        background: glassBar.background,
        backdropFilter: glassBar.backdropFilter,
        WebkitBackdropFilter: glassBar.WebkitBackdropFilter,
        flexShrink: 0,
      }}>
        <button
          onClick={handleReset}
          style={{
            background: 'rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.08)',
            color: '#6b7280',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '10px',
          }}
        >
          ← 나가기
        </button>
        <span style={{
          color: '#1e1b4b',
          fontSize: '15px',
          fontWeight: 600,
        }}>
          {selectedGame?.icon} {selectedGame?.title}
        </span>
        <button
          onClick={handleRestart}
          style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.15)',
            color: '#6366f1',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '10px',
            fontWeight: 500,
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

        {/* Game Over Overlay — frosted glass */}
        {showLeaderboard && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: '8vh',
            gap: '12px',
            zIndex: 10,
            overflowY: 'auto',
            padding: '8vh 20px 20px',
          }}>
            <div style={{ fontSize: '40px' }}>🏆</div>
            <div style={{
              color: '#1e1b4b',
              fontSize: '28px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
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
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#1e1b4b',
                    fontSize: '14px',
                    outline: 'none',
                    backdropFilter: 'blur(10px)',
                  }}
                />
                <button
                  onClick={handleSubmitScore}
                  disabled={!playerName.trim() || submittingScore}
                  style={{
                    background: playerName.trim()
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : 'rgba(0,0,0,0.06)',
                    border: 'none',
                    color: playerName.trim() ? '#fff' : '#9ca3af',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '10px 16px',
                    borderRadius: '12px',
                    cursor: playerName.trim() ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {submittingScore ? '...' : '등록'}
                </button>
              </div>
            ) : myRank && (
              <div style={{ color: '#16a34a', fontSize: '14px', fontWeight: 600 }}>
                🎉 {myRank}위에 등록되었습니다!
              </div>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div style={{
                width: '100%',
                maxWidth: '300px',
                marginTop: '8px',
                background: 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '16px',
                padding: '14px',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  color: '#6b7280',
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
                      borderBottom: i < Math.min(leaderboard.length, 10) - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                    }}>
                      <span style={{
                        color: isMe ? '#d97706' : '#1e1b4b',
                        fontSize: '13px',
                        fontWeight: isMe ? 700 : 400,
                      }}>
                        <span style={{ display: 'inline-block', width: '28px', textAlign: 'center' }}>
                          {medal}
                        </span>
                        {entry.name}
                      </span>
                      <span style={{
                        color: isMe ? '#d97706' : '#6b7280',
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
                  background: 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  color: '#7c3aed',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '12px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(139,92,246,0.08)',
                }}
              >
                📤 공유
              </button>
              <button
                onClick={handleRestart}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '12px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
                }}
              >
                🔄 다시
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar — frosted glass */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '10px 16px',
        borderTop: `1px solid ${glassBar.borderColor}`,
        background: glassBar.background,
        backdropFilter: glassBar.backdropFilter,
        WebkitBackdropFilter: glassBar.WebkitBackdropFilter,
        flexShrink: 0,
      }}>
        <button
          onClick={() => setShowCode(!showCode)}
          style={{
            flex: 1,
            background: showCode ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.04)',
            border: showCode ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(0,0,0,0.08)',
            color: showCode ? '#6366f1' : '#6b7280',
            fontSize: '13px',
            fontWeight: 500,
            padding: '10px',
            borderRadius: '12px',
            cursor: 'pointer',
          }}
        >
          {'</>'} 코드 보기
        </button>
        <button
          onClick={() => setShowRemix(!showRemix)}
          style={{
            flex: 1,
            background: showRemix ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.04)',
            border: showRemix ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(0,0,0,0.08)',
            color: showRemix ? '#059669' : '#6b7280',
            fontSize: '13px',
            fontWeight: 500,
            padding: '10px',
            borderRadius: '12px',
            cursor: 'pointer',
          }}
        >
          ✨ 바이브 코딩하기
        </button>
      </div>

      {/* Code Panel */}
      {showCode && (
        <div style={{
          maxHeight: '40vh',
          overflow: 'auto',
          background: 'rgba(255,255,255,0.45)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderTop: '1px solid rgba(255,255,255,0.4)',
          padding: '12px 16px',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}>
            <span style={{ color: '#6b7280', fontSize: '12px' }}>
              {selectedGame?.title}.html — {gameCode.split('\n').length} lines
            </span>
            <button
              onClick={() => setShowCode(false)}
              style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <pre style={{
            color: '#312e81',
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

      {vibeGenerating && pendingVibeHtml && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
        }}>
          <CodeStreamView
            gameHtml={pendingVibeHtml}
            gameTitle={`${selectedGame?.title} — ${vibePresetLabel}`}
            onComplete={handleVibeComplete}
            duration={3500}
            statusMessages={VIBE_STATUS_MESSAGES}
            completionText="바이브 코딩 완료!"
          />
        </div>
      )}
    </div>
  );
}
