'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { DEMO_GAMES, DemoGame } from '@/lib/demoGames';
import { getGameExtensionsScript } from '@/lib/gameExtensions';
import IntroScreen from '@/components/IntroScreen';
import PromptTerminal from '@/components/PromptTerminal';
import CodeStreamView from '@/components/CodeStreamView';
import RemixPanel from '@/components/RemixPanel';
import ShareModal from '@/components/ShareModal';
import VibeOverlay from '@/components/VibeOverlay';
import LaunchSequence from '@/components/LaunchSequence';
import { VIBE_STATUS_MESSAGES } from '@/lib/codeSimulator';

interface LeaderboardEntry {
  name: string;
  score: number;
  ts: number;
}

type AppView = 'intro' | 'select' | 'generating' | 'launching' | 'playing';

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
  const [vibeMode, setVibeMode] = useState<'full' | 'overlay'>('full');
  const [vibeCodeSnippet, setVibeCodeSnippet] = useState('');

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
        setShowRemix(false);  // close remix panel on game over
        setShowCode(false);   // close code panel on game over
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
    setView('launching');
  }, []);

  const handleLaunchComplete = useCallback(() => {
    setView('playing');
    setTimeout(() => writeGameToIframe(gameCode), 100);
  }, [gameCode, writeGameToIframe]);

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

  const handleApplyRemix = (newHtml: string, presetLabel: string, codeSnippet?: string) => {
    setShowRemix(false);
    setShowCode(false);
    setPendingVibeHtml(newHtml);
    setVibePresetLabel(presetLabel);
    if (codeSnippet) {
      // Visual theme → lightweight overlay (game stays visible)
      setVibeMode('overlay');
      setVibeCodeSnippet(codeSnippet);
    } else {
      // Gameplay mod → full-screen code stream
      setVibeMode('full');
      setVibeCodeSnippet('');
    }
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

  if (view === 'launching' && selectedGame) {
    return (
      <LaunchSequence
        gameTitle={selectedGame.title}
        onComplete={handleLaunchComplete}
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
      <div className="anim-slide-down" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        background: 'linear-gradient(to bottom, rgba(5,5,16,0.75) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <button onClick={handleReset} className="btn-hud">
          ← EXIT
        </button>
        <span style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: 'clamp(11px, 3vw, 14px)',
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.08em',
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}>
          {selectedGame?.title}
        </span>
        <button onClick={handleRestart} className="btn-hud btn-hud--active">
          ↻ RESTART
        </button>
      </div>

      {/* Game Over Overlay */}
      {showLeaderboard && (
        <div className="overlay-game-over">
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
            <div className="anim-fade-in-up" style={{
              display: 'flex',
              gap: '8px',
              width: '100%',
              maxWidth: '300px',
              marginTop: '8px',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={() => setShowShare(true)}
                style={{
                  flex: 1,
                  minWidth: '80px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-glow)',
                  color: 'var(--ai-indigo)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '11px 8px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                📤 SHARE
              </button>
              <button
                onClick={() => {
                  setShowLeaderboard(false);
                  setShowRemix(true);
                }}
                style={{
                  flex: 1,
                  minWidth: '80px',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  color: '#6ee7b7',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '11px 8px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                ✨ VIBE
              </button>
              <button
                onClick={handleRestart}
                className="btn-glow"
                style={{
                  flex: 1,
                  minWidth: '80px',
                  padding: '11px 8px',
                  borderRadius: '12px',
                }}
              >
                ↻ RETRY
              </button>
              <button
                onClick={() => {
                  setShowLeaderboard(false);
                  setView('select');
                  setSelectedGame(null);
                  setGameCode('');
                  setShowRemix(false);
                  setShowCode(false);
                }}
                style={{
                  flex: 1,
                  minWidth: '80px',
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  color: '#a5b4fc',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '11px 8px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                + NEW GAME
              </button>
            </div>
          </div>
        )}

      {/* Bottom Dev Tools Bar — Overlay (44px+ touch targets) */}
      <div className="anim-fade-in" style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        display: 'flex',
        gap: '8px',
        padding: '10px 12px',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom, 0px))',
        background: 'linear-gradient(to top, rgba(5,5,16,0.85) 0%, rgba(5,5,16,0.4) 60%, transparent 100%)',
        alignItems: 'center',
        pointerEvents: 'none',
      }}>
        <button
          onClick={() => { setShowCode(!showCode); if (!showCode) setShowRemix(false); }}
          className={`btn-hud ${showCode ? 'btn-hud--active' : ''}`}
          style={{ flex: 1, minHeight: '44px' }}
        >
          {'</>'} CODE
        </button>
        <button
          onClick={() => { setShowRemix(!showRemix); if (!showRemix) setShowCode(false); }}
          className={`btn-hud ${showRemix ? 'btn-hud--accent' : ''}`}
          style={{ flex: 1, minHeight: '44px' }}
        >
          ✨ VIBE
        </button>
        <span className="mono-xs" style={{
          fontSize: '9px',
          whiteSpace: 'nowrap',
          color: 'rgba(255,255,255,0.4)',
          pointerEvents: 'auto',
        }}>
          {lineCount} LOC
        </span>
      </div>

      {/* Code Panel — Overlay */}
      {showCode && (
        <div className="panel-slide-up" style={{
          maxHeight: '40vh',
          overflow: 'auto',
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
        <div className="panel-slide-up">
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

      {vibeGenerating && pendingVibeHtml && vibeMode === 'full' && (
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

      {vibeGenerating && pendingVibeHtml && vibeMode === 'overlay' && (
        <VibeOverlay
          codeSnippet={vibeCodeSnippet}
          label={vibePresetLabel}
          duration={2200}
          onComplete={() => handleVibeComplete(pendingVibeHtml)}
        />
      )}
    </div>
  );
}
