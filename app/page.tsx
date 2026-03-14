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
    } catch {}
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
        body: JSON.stringify({ gameId: selectedGame.id, name: playerName.trim(), score: gameScore }),
      });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setMyRank(data.rank || null);
        setScoreSubmitted(true);
      }
    } catch {} finally { setSubmittingScore(false); }
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

  const lineCount = gameCode.split('\n').length;

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top Bar — Minimal HUD */}
      <div className="glass-surface" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '0.5px solid rgba(255,255,255,0.4)',
        flexShrink: 0,
      }}>
        <button
          onClick={handleReset}
          style={{
            background: 'rgba(0,0,0,0.03)',
            border: '0.5px solid rgba(0,0,0,0.08)',
            color: 'var(--text-secondary)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '8px',
          }}
        >
          ← EXIT
        </button>
        <span style={{
          color: 'var(--text-primary)',
          fontSize: '14px',
          fontWeight: 600,
        }}>
          {selectedGame?.title}
        </span>
        <button
          onClick={handleRestart}
          style={{
            background: 'rgba(99,102,241,0.06)',
            border: '0.5px solid rgba(99,102,241,0.15)',
            color: 'var(--ai-indigo)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '8px',
            fontWeight: 500,
          }}
        >
          ↻ RESTART
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
          style={{ width: '100%', height: '100%', border: 'none' }}
        />

        {/* Game Over Overlay */}
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
            <span className="mono-label" style={{ fontSize: '10px', letterSpacing: '0.15em' }}>
              FINAL SCORE
            </span>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '48px',
              fontWeight: 700,
              lineHeight: 1,
            }}>
              <span className="text-gradient-gold">{gameScore}</span>
            </div>

            {/* Name input */}
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
                    border: '0.5px solid rgba(0,0,0,0.1)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleSubmitScore}
                  disabled={!playerName.trim() || submittingScore}
                  style={{
                    background: playerName.trim()
                      ? 'linear-gradient(135deg, var(--ai-indigo), var(--ai-violet))'
                      : 'rgba(0,0,0,0.04)',
                    border: 'none',
                    color: playerName.trim() ? '#fff' : 'var(--text-muted)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '10px 16px',
                    borderRadius: '10px',
                    cursor: playerName.trim() ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                    boxShadow: playerName.trim() ? '0 4px 12px rgba(99,102,241,0.25)' : 'none',
                  }}
                >
                  {submittingScore ? '...' : 'SUBMIT'}
                </button>
              </div>
            ) : myRank && (
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--ai-emerald)',
                fontSize: '13px',
                fontWeight: 600,
              }}>
                RANKED #{myRank}
              </div>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="glass-card" style={{
                width: '100%',
                maxWidth: '300px',
                marginTop: '8px',
                padding: '14px',
                borderRadius: '14px',
              }}>
                <div className="mono-label" style={{ marginBottom: '10px', fontSize: '9px', letterSpacing: '0.12em' }}>
                  LEADERBOARD
                </div>
                {leaderboard.slice(0, 10).map((entry, i) => {
                  const isMe = scoreSubmitted && myRank === i + 1;
                  const rankColors = ['#f59e0b', '#94a3b8', '#b45309'];
                  return (
                    <div key={`${entry.name}-${entry.ts}`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 0',
                      borderBottom: i < Math.min(leaderboard.length, 10) - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                      borderLeft: i < 3 ? `2px solid ${rankColors[i]}` : '2px solid transparent',
                      paddingLeft: '8px',
                    }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '12px',
                        color: isMe ? 'var(--ai-indigo)' : 'var(--text-body)',
                        fontWeight: isMe ? 700 : 400,
                      }}>
                        <span style={{
                          display: 'inline-block',
                          width: '24px',
                          color: i < 3 ? rankColors[i] : 'var(--text-muted)',
                          fontWeight: 600,
                        }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {entry.name}
                      </span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '12px',
                        color: isMe ? 'var(--ai-indigo)' : 'var(--text-muted)',
                        fontWeight: isMe ? 700 : 400,
                      }}>
                        {entry.score}
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
                  border: '0.5px solid rgba(99,102,241,0.2)',
                  color: 'var(--ai-indigo)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                }}
              >
                ↗ SHARE
              </button>
              <button
                onClick={handleRestart}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, var(--ai-indigo), var(--ai-violet))',
                  border: 'none',
                  color: '#fff',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
                }}
              >
                ↻ RETRY
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Dev Tools Bar */}
      <div className="glass-surface" style={{
        display: 'flex',
        gap: '8px',
        padding: '8px 16px',
        borderTop: '0.5px solid rgba(255,255,255,0.4)',
        flexShrink: 0,
        alignItems: 'center',
      }}>
        <button
          onClick={() => setShowCode(!showCode)}
          style={{
            flex: 1,
            background: showCode ? 'rgba(99,102,241,0.1)' : 'rgba(0,0,0,0.03)',
            border: showCode ? '0.5px solid rgba(99,102,241,0.25)' : '0.5px solid rgba(0,0,0,0.06)',
            color: showCode ? 'var(--ai-indigo)' : 'var(--text-secondary)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            fontWeight: 500,
            padding: '10px',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
        >
          {'</>'} CODE
        </button>
        <button
          onClick={() => setShowRemix(!showRemix)}
          style={{
            flex: 1,
            background: showRemix ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.03)',
            border: showRemix ? '0.5px solid rgba(16,185,129,0.25)' : '0.5px solid rgba(0,0,0,0.06)',
            color: showRemix ? 'var(--ai-emerald)' : 'var(--text-secondary)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            fontWeight: 500,
            padding: '10px',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
        >
          ◇ REMIX
        </button>
        <span className="mono-metric" style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
          {lineCount} LOC
        </span>
      </div>

      {/* Code Panel */}
      {showCode && (
        <div style={{
          maxHeight: '40vh',
          overflow: 'auto',
          flexShrink: 0,
        }}>
          <div className="code-terminal" style={{ padding: '12px 16px', minHeight: '100px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              paddingBottom: '8px',
            }}>
              <span className="mono-label" style={{ color: '#64748b' }}>
                {selectedGame?.title}.html — {lineCount} lines
              </span>
              <button
                onClick={() => setShowCode(false)}
                style={{ background: 'none', border: 'none', color: '#475569', fontSize: '12px', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}
              >
                ✕
              </button>
            </div>
            <pre style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {gameCode}
            </pre>
          </div>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <CodeStreamView
            gameHtml={pendingVibeHtml}
            gameTitle={`${selectedGame?.title} — ${vibePresetLabel}`}
            onComplete={handleVibeComplete}
            duration={3500}
            statusMessages={VIBE_STATUS_MESSAGES}
            completionText="VIBE CODING COMPLETE"
          />
        </div>
      )}
    </div>
  );
}
