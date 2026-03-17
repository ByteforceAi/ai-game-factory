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
import VibeControlPanel from '@/components/VibeControlPanel';
import LaunchSequence from '@/components/LaunchSequence';
import { VIBE_STATUS_MESSAGES } from '@/lib/codeSimulator';
import { playAmbient, stopAmbient } from '@/lib/sounds';

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
  const [showVibeControl, setShowVibeControl] = useState(false);
  const [vibeCodeSnippet, setVibeCodeSnippet] = useState('');
  const [transitioning, setTransitioning] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const confettiRef = useRef<HTMLCanvasElement>(null);
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);
  const hudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Instructor override ──
  const [instructorGame, setInstructorGame] = useState<string | null>(null);
  const [instructorSkip, setInstructorSkip] = useState(false);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    try {
      const override = localStorage.getItem('instructor-override');
      const skip = localStorage.getItem('instructor-skip') === 'true';
      const name = localStorage.getItem('student-name') || '';
      if (override) setInstructorGame(override);
      if (skip) setInstructorSkip(skip);
      if (name) setStudentName(name);
    } catch {}
  }, []);

  const changeView = useCallback((newView: AppView) => {
    setTransitioning(true);
    setTimeout(() => {
      setView(newView);
      setTimeout(() => setTransitioning(false), 50);
    }, 350);
  }, []);

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
        setShowVibeControl(false);  // close vibe control on game over
        setToolbarOpen(false);     // close toolbar on game over
        if (selectedGame) fetchLeaderboard(selectedGame.id);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedGame, fetchLeaderboard]);

  // Score count-up animation
  useEffect(() => {
    if (showLeaderboard && gameScore > 0) {
      setDisplayScore(0);
      const duration = 1500;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(Math.floor(eased * gameScore));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [showLeaderboard, gameScore]);

  // Confetti particle burst on game over
  useEffect(() => {
    if (showLeaderboard && confettiRef.current) {
      const canvas = confettiRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      const particles: Array<{x:number;y:number;vx:number;vy:number;color:string;size:number;rotation:number;rotSpeed:number}> = [];
      const colors = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899'];

      for (let i = 0; i < 80; i++) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height * 0.3,
          vx: (Math.random() - 0.5) * 12,
          vy: Math.random() * -10 - 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 6 + 3,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.2,
        });
      }

      let frame = 0;
      const animateConfetti = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15;
          p.vx *= 0.99;
          p.rotation += p.rotSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, 1 - frame / 120);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        });
        frame++;
        if (frame < 120) requestAnimationFrame(animateConfetti);
      };
      requestAnimationFrame(animateConfetti);
    }
  }, [showLeaderboard]);

  // Auto-hide HUD after 3 seconds of inactivity
  const resetHudTimer = useCallback(() => {
    setHudVisible(true);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => {
      // Only hide if no panels are open
      if (!showCode && !showRemix && !showVibeControl && !showLeaderboard && !toolbarOpen) {
        setHudVisible(false);
      }
    }, 3500);
  }, [showCode, showRemix, showVibeControl, showLeaderboard, toolbarOpen]);

  // Show HUD on any tap, then auto-hide
  const handleScreenTap = useCallback(() => {
    if (showLeaderboard || showCode || showRemix || showVibeControl) return;
    resetHudTimer();
  }, [showLeaderboard, showCode, showRemix, showVibeControl, resetHudTimer]);

  // Start auto-hide timer when entering play mode
  useEffect(() => {
    if (view === 'playing') {
      resetHudTimer();
    }
    return () => { if (hudTimerRef.current) clearTimeout(hudTimerRef.current); };
  }, [view, resetHudTimer]);

  // Keep HUD visible when panels are open
  useEffect(() => {
    if (showCode || showRemix || showVibeControl || showLeaderboard || toolbarOpen) {
      setHudVisible(true);
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    }
  }, [showCode, showRemix, showVibeControl, showLeaderboard, toolbarOpen]);

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
    // Instructor override: force a specific game regardless of user selection
    let finalGame = game;
    if (instructorGame) {
      const override = DEMO_GAMES.find(g => g.id === instructorGame);
      if (override) finalGame = override;
    }
    setSelectedGame(finalGame);
    changeView('generating');
    playAmbient();
  };

  const handleGenerationComplete = useCallback((html: string) => {
    setGameCode(html);
    stopAmbient();
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
    changeView('intro');
    setSelectedGame(null);
    setGameCode('');
    setShowRemix(false);
    setShowCode(false);
    setShowVibeControl(false);
    setToolbarOpen(false);
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
    return (
      <div style={{
        opacity: transitioning ? 0 : 1,
        transform: transitioning ? 'scale(0.97)' : 'scale(1)',
        transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <IntroScreen onComplete={() => changeView('select')} />
      </div>
    );
  }

  if (view === 'select') {
    return (
      <div style={{
        opacity: transitioning ? 0 : 1,
        transform: transitioning ? 'scale(0.97)' : 'scale(1)',
        transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <PromptTerminal onComplete={handleSelectGame} />
      </div>
    );
  }

  if (view === 'generating' && selectedGame) {
    return (
      <div style={{
        opacity: transitioning ? 0 : 1,
        transform: transitioning ? 'scale(0.97)' : 'scale(1)',
        transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <CodeStreamView
          gameHtml={selectedGame.html}
          gameTitle={studentName ? `${studentName}의 ${selectedGame.title}` : selectedGame.title}
          onComplete={handleGenerationComplete}
          duration={instructorSkip ? 3000 : undefined}
          accentColor={selectedGame.accentColor}
          gameIcon={selectedGame.icon}
        />
      </div>
    );
  }

  if (view === 'launching' && selectedGame) {
    return (
      <LaunchSequence
        gameTitle={studentName ? `${studentName}의 ${selectedGame.title}` : selectedGame.title}
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
        onClick={handleScreenTap}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          zIndex: 1,
        }}
      />

      {/* Tap overlay to detect taps for showing HUD */}
      {!showLeaderboard && !showCode && !showRemix && !showVibeControl && !hudVisible && (
        <div
          onClick={handleScreenTap}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            cursor: 'pointer',
          }}
        />
      )}

      {/* Top HUD — Auto-hide overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        paddingTop: 'max(10px, env(safe-area-inset-top, 10px))',
        background: 'linear-gradient(to bottom, rgba(10,10,26,0.75) 0%, transparent 100%)',
        pointerEvents: 'none',
        opacity: hudVisible ? 1 : 0,
        transform: hudVisible ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}>
        <button onClick={handleReset} className="btn-hud" style={{ fontSize: '12px' }}>
          ← 나가기
        </button>
        <span style={{
          color: 'rgba(255,255,255,0.85)',
          fontSize: 'clamp(12px, 3vw, 14px)',
          fontWeight: 600,
          letterSpacing: '-0.3px',
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}>
          {studentName ? `${studentName}의 ${selectedGame?.title}` : selectedGame?.title}
        </span>
        <button onClick={handleRestart} className="btn-hud btn-hud--active" style={{ fontSize: '12px' }}>
          ↻ 다시
        </button>
      </div>

      {/* Game Over Overlay */}
      {showLeaderboard && (
        <div className="overlay-game-over" style={{ position: 'absolute' }}>
            <canvas ref={confettiRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />
            <span className="mono-xs" style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'var(--ai-cyan)', position: 'relative', zIndex: 2 }}>
              FINAL SCORE
            </span>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '48px',
              fontWeight: 700,
              lineHeight: 1,
              color: 'var(--text-bright)',
              textShadow: '0 0 30px rgba(99,102,241,0.4), 0 0 60px rgba(99,102,241,0.15)',
              position: 'relative',
              zIndex: 2,
            }}>
              {displayScore}
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
                ✨ 바이브 코딩하기
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
                  changeView('select');
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

      {/* ═══ Bottom — Dynamic Island Pill + Expandable Toolbar ═══ */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
        pointerEvents: 'none',
        opacity: hudVisible || toolbarOpen ? 1 : 0,
        transform: (hudVisible || toolbarOpen) ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}>
        {/* Expanded toolbar */}
        {toolbarOpen && (
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '8px',
            marginBottom: '8px',
            background: 'rgba(10,10,26,0.85)',
            backdropFilter: 'blur(20px) saturate(150%)',
            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
            pointerEvents: 'auto',
            animation: 'toolbarExpand 0.3s cubic-bezier(0.16,1,0.3,1) both',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <button
              onClick={() => { setShowCode(!showCode); if (!showCode) { setShowRemix(false); setShowVibeControl(false); } setToolbarOpen(false); }}
              className={`btn-hud ${showCode ? 'btn-hud--active' : ''}`}
              style={{ minHeight: '44px', padding: '10px 18px', fontSize: '12px' }}
            >
              {'</>'} 코드
            </button>
            <button
              onClick={() => { setShowVibeControl(!showVibeControl); if (!showVibeControl) { setShowCode(false); setShowRemix(false); } setToolbarOpen(false); }}
              className={`btn-hud ${showVibeControl ? 'btn-hud--accent' : ''}`}
              style={{ minHeight: '44px', padding: '10px 18px', fontSize: '12px' }}
            >
              🎛️ 라이브
            </button>
            <button
              onClick={() => { setShowRemix(!showRemix); if (!showRemix) { setShowCode(false); setShowVibeControl(false); } setToolbarOpen(false); }}
              className={`btn-hud ${showRemix ? 'btn-hud--accent' : ''}`}
              style={{ minHeight: '44px', padding: '10px 18px', fontSize: '12px' }}
            >
              ✨ 바이브 코딩
            </button>
          </div>
        )}

        {/* Collapsed pill — Dynamic Island style */}
        <button
          onClick={() => {
            setToolbarOpen(!toolbarOpen);
            resetHudTimer();
          }}
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: toolbarOpen ? '8px 20px' : '8px 16px',
            minHeight: '36px',
            borderRadius: '20px',
            background: toolbarOpen
              ? 'rgba(10,10,26,0.9)'
              : 'rgba(10,10,26,0.75)',
            backdropFilter: 'blur(20px) saturate(150%)',
            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
            border: `1px solid ${toolbarOpen ? 'rgba(0,122,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: toolbarOpen
              ? '0 4px 20px rgba(0,122,255,0.15)'
              : '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          {/* Status dot */}
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: (showCode || showVibeControl || showRemix) ? '#007AFF' : '#34C759',
            boxShadow: (showCode || showVibeControl || showRemix)
              ? '0 0 6px rgba(0,122,255,0.5)'
              : '0 0 6px rgba(52,199,89,0.5)',
            transition: 'all 0.3s',
          }} />

          {/* Label */}
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '-0.2px',
            whiteSpace: 'nowrap',
          }}>
            {toolbarOpen ? '닫기' : (showCode ? '코드 보는 중' : showVibeControl ? '라이브 수정 중' : showRemix ? '바이브 코딩 중' : `${lineCount} LOC`)}
          </span>

          {/* Chevron */}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{
            transform: toolbarOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <path d="M2 6.5L5 3.5L8 6.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Click outside to close toolbar */}
      {toolbarOpen && (
        <div
          onClick={() => setToolbarOpen(false)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 15,
          }}
        />
      )}

      {/* Code Panel — Overlay */}
      {showCode && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          left: 0,
          right: 0,
          zIndex: 25,
          maxHeight: '45vh',
          overflow: 'auto',
          animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}>
          <div className="code-terminal" style={{
            padding: '12px 16px',
            minHeight: '100px',
            background: 'rgba(10,10,26,0.95)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              borderBottom: '1px solid var(--border-dim)',
              paddingBottom: '8px',
            }}>
              <span className="mono-xs" style={{ color: 'var(--text-tertiary)' }}>
                {selectedGame?.title}.html — {lineCount} lines
              </span>
              <button
                onClick={() => setShowCode(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  letterSpacing: '-0.2px',
                }}
              >
                닫기
              </button>
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {gameCode}
            </pre>
          </div>
        </div>
      )}

      {/* Vibe Control Panel — Live Parameter + AI Chat */}
      {showVibeControl && selectedGame && (
        <VibeControlPanel
          gameId={selectedGame.id}
          iframeRef={iframeRef}
          onClose={() => setShowVibeControl(false)}
        />
      )}

      {/* Remix Panel — Overlay */}
      {showRemix && selectedGame && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          left: 0,
          right: 0,
          zIndex: 25,
          animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}>
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
            accentColor={selectedGame?.accentColor}
            gameIcon={selectedGame?.icon}
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
