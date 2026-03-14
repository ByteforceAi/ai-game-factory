'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { DEMO_GAMES, DemoGame } from '@/lib/demoGames';
import { getGameExtensionsScript } from '@/lib/gameExtensions';
import IntroScreen from '@/components/IntroScreen';
import PromptTerminal from '@/components/PromptTerminal';
import CodeStreamView from '@/components/CodeStreamView';
import RemixPanel from '@/components/RemixPanel';
import ShareModal from '@/components/ShareModal';
import { VIBE_STATUS_MESSAGES } from '@/lib/codeSimulator';

interface LeaderboardEntry {
  name: string;
  score: number;
  ts: number;
}

type AppView = 'intro' | 'select' | 'generating' | 'playing';

export default function Home() {
  const [view, setView] = useState<AppView>('intro');
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
    setView('intro');
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

  if (view === 'intro') {
    return <IntroScreen onComplete={() => setView('select')} />;
  }

  if (view === 'select') {
    return <PromptTerminal onComplete={handleSelectGame} />;
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
      height: '100dvh',
      width: '100vw',
      position: 'relative',
      overflow: 'hidden',
      background: '#000',
    }}>
      {/* Game — Full Screen */}
      <iframe
        ref={iframeRef}
        title="game"
        sandbox="allow-scripts allow-same-origin"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          zIndex: 1,
        }}
      />

      {/* Top HUD — Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'linear-gradient(to bottom, rgba(5,5,16,0.7) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <button
          onClick={handleReset}
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.7)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '8px',
            pointerEvents: 'auto',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          EXIT
        </button>
        <span style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: '13px',
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.08em',
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}>
          {selectedGame?.title}
        </span>
        <button
          onClick={handleRestart}
          style={{
            background: 'rgba(99,102,241,0.3)',
            border: '1px solid rgba(99,102,241,0.4)',
            color: '#a5b4fc',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '8px',
            fontWeight: 500,
            pointerEvents: 'auto',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          RESTART
        </button>
      </div>

      {/* Game Over Overlay */}
      {showLeaderboard && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5,5,16,0.85)',
          backdropFilter: 'blur(30px) saturate(150%)',
          WebkitBackdropFilter: 'blur(30px) saturate(150%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: '8vh',
          gap: '12px',
          zIndex: 30,
          overflowY: 'auto',
          padding: '8vh 20px 20px',
        }}>
            <span className="mono-xs" style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'var(--ai-cyan)' }}>
              FINAL SCORE
            </span>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '48px',
              fontWeight: 700,
              lineHeight: 1,
              color: 'var(--text-bright)',
              textShadow: '0 0 30px rgba(99,102,241,0.4), 0 0 60px rgba(99,102,241,0.15)',
            }}>
              {gameScore}
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
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-dim)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-bright)',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: "'JetBrains Mono', monospace",
                    transition: 'border-color 0.3s',
                  }}
                />
                <button
                  onClick={handleSubmitScore}
                  disabled={!playerName.trim() || submittingScore}
                  className="btn-glow"
                  style={{
                    opacity: playerName.trim() ? 1 : 0.4,
                    cursor: playerName.trim() ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {submittingScore ? '...' : 'SUBMIT'}
                </button>
              </div>
            ) : myRank && (
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                fontWeight: 600,
              }}>
                <span className="text-glow-emerald">RANKED #{myRank}</span>
              </div>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="card-cinematic" style={{
                width: '100%',
                maxWidth: '300px',
                marginTop: '8px',
                padding: '14px',
              }}>
                <div className="mono-xs" style={{ marginBottom: '10px', fontSize: '9px', letterSpacing: '0.12em' }}>
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
                      borderBottom: i < Math.min(leaderboard.length, 10) - 1 ? '1px solid var(--border-dim)' : 'none',
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
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-glow)',
                  color: 'var(--ai-indigo)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                SHARE
              </button>
              <button
                onClick={handleRestart}
                className="btn-glow"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                }}
              >
                RETRY
              </button>
            </div>
          </div>
        )}

      {/* Bottom Dev Tools Bar — Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        display: 'flex',
        gap: '8px',
        padding: '8px 12px',
        background: 'linear-gradient(to top, rgba(5,5,16,0.7) 0%, transparent 100%)',
        alignItems: 'center',
        pointerEvents: 'none',
      }}>
        <button
          onClick={() => setShowCode(!showCode)}
          style={{
            flex: 1,
            background: showCode ? 'rgba(99,102,241,0.3)' : 'rgba(0,0,0,0.5)',
            border: showCode ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.15)',
            color: showCode ? '#a5b4fc' : 'rgba(255,255,255,0.7)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            fontWeight: 500,
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer',
            pointerEvents: 'auto',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {'</>'} CODE
        </button>
        <button
          onClick={() => setShowRemix(!showRemix)}
          style={{
            flex: 1,
            background: showRemix ? 'rgba(16,185,129,0.3)' : 'rgba(0,0,0,0.5)',
            border: showRemix ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.15)',
            color: showRemix ? '#6ee7b7' : 'rgba(255,255,255,0.7)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            fontWeight: 500,
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer',
            pointerEvents: 'auto',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          VIBE CODING
        </button>
        <span className="mono-xs" style={{ fontSize: '9px', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.4)' }}>
          {lineCount} LOC
        </span>
      </div>

      {/* Code Panel — Overlay */}
      {showCode && (
        <div style={{
          position: 'absolute',
          bottom: '50px',
          left: 0,
          right: 0,
          maxHeight: '40vh',
          overflow: 'auto',
          zIndex: 25,
        }}>
          <div className="code-terminal" style={{ padding: '12px 16px', minHeight: '100px', background: 'rgba(5,5,16,0.95)' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              borderBottom: '1px solid var(--border-dim)',
              paddingBottom: '8px',
            }}>
              <span className="mono-xs" style={{ color: 'var(--text-dim)' }}>
                {selectedGame?.title}.html — {lineCount} lines
              </span>
              <button
                onClick={() => setShowCode(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}
              >
                CLOSE
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

      {/* Remix Panel — Overlay */}
      {showRemix && selectedGame && (
        <div style={{ position: 'absolute', bottom: '50px', left: 0, right: 0, zIndex: 25 }}>
          <RemixPanel
            gameId={selectedGame.id}
            gameHtml={gameCode}
            onApplyRemix={handleApplyRemix}
            onBack={() => setShowRemix(false)}
          />
        </div>
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
