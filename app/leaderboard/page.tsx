'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

/* ── Game metadata (no html import — keep bundle small) ── */
const GAMES = [
  { id: 'neon-shooter', title: '네온 슈터', icon: '◆', color: '#00FFFF' },
  { id: 'neon-platformer', title: '네온 러너', icon: '◈', color: '#FF00FF' },
  { id: 'temple-runner', title: '템플 러너', icon: '▸▸', color: '#00CCFF' },
  { id: 'tetris', title: '테트리스', icon: '⊞', color: '#B400FF' },
  { id: 'dot-rpg', title: '도트 RPG', icon: '⚔', color: '#FFD700' },
];

interface Entry {
  name: string;
  score: number;
  ts: number;
  gameId?: string;
  gameTitle?: string;
  gameColor?: string;
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#333', fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', letterSpacing: '0.2em' }}>
          LOADING...
        </div>
      </div>
    }>
      <LeaderboardContent />
    </Suspense>
  );
}

function LeaderboardContent() {
  const searchParams = useSearchParams();
  const paramGameId = searchParams.get('gameId');

  const [activeTab, setActiveTab] = useState<string>(paramGameId || 'ALL');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [prevEntries, setPrevEntries] = useState<Entry[]>([]);
  const [newEntryKeys, setNewEntryKeys] = useState<Set<string>>(new Set());
  const [autoRotate, setAutoRotate] = useState(!paramGameId);
  const [showCursor, setShowCursor] = useState(true);
  const [showToast, setShowToast] = useState(true);
  const [clock, setClock] = useState('');
  const cursorTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const rotateTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Clock ──
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Cursor auto-hide ──
  useEffect(() => {
    const handleMove = () => {
      setShowCursor(true);
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
      cursorTimerRef.current = setTimeout(() => setShowCursor(false), 3000);
    };
    window.addEventListener('mousemove', handleMove);
    cursorTimerRef.current = setTimeout(() => setShowCursor(false), 3000);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
    };
  }, []);

  // ── F11 toast ──
  useEffect(() => {
    if (showToast) {
      const t = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showToast]);

  // ── Fetch leaderboard ──
  const fetchData = useCallback(async (tab: string) => {
    try {
      if (tab === 'ALL') {
        // Fetch all games in parallel
        const results = await Promise.all(
          GAMES.map(async (g) => {
            try {
              const res = await fetch(`/api/leaderboard?gameId=${g.id}`);
              if (!res.ok) return [];
              const data = await res.json();
              return ((data.leaderboard || []) as Entry[]).map((e: Entry) => ({
                ...e,
                gameId: g.id,
                gameTitle: g.title,
                gameColor: g.color,
              }));
            } catch { return []; }
          })
        );
        const all = results.flat();
        all.sort((a, b) => b.score - a.score || a.ts - b.ts);
        return all.slice(0, 50);
      } else {
        const res = await fetch(`/api/leaderboard?gameId=${tab}`);
        if (!res.ok) return [];
        const data = await res.json();
        const game = GAMES.find(g => g.id === tab);
        return ((data.leaderboard || []) as Entry[]).map((e: Entry) => ({
          ...e,
          gameId: tab,
          gameTitle: game?.title || tab,
          gameColor: game?.color || '#fff',
        }));
      }
    } catch { return []; }
  }, []);

  // ── Polling ──
  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      const data = await fetchData(activeTab);
      if (!mounted) return;

      // Detect new entries
      const prevKeys = new Set(prevEntries.map(e => `${e.name}-${e.score}-${e.ts}`));
      const freshKeys = new Set<string>();
      data.forEach((e: Entry) => {
        const key = `${e.name}-${e.score}-${e.ts}`;
        if (!prevKeys.has(key) && prevEntries.length > 0) {
          freshKeys.add(key);
        }
      });

      setPrevEntries(data);
      setEntries(data);
      if (freshKeys.size > 0) {
        setNewEntryKeys(freshKeys);
        setTimeout(() => setNewEntryKeys(new Set()), 2000);
      }
    };

    poll();
    const id = setInterval(poll, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, [activeTab, fetchData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-rotation ──
  useEffect(() => {
    if (!autoRotate) {
      if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current);
      return;
    }
    const tabs = ['ALL', ...GAMES.map(g => g.id)];
    const advance = () => {
      setActiveTab(prev => {
        const idx = tabs.indexOf(prev);
        return tabs[(idx + 1) % tabs.length];
      });
    };
    rotateTimerRef.current = setTimeout(advance, 10000);
    return () => { if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current); };
  }, [autoRotate, activeTab]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setAutoRotate(false); // manual click stops rotation
  };

  const handleToggleRotate = () => {
    setAutoRotate(prev => !prev);
  };

  const activeGame = GAMES.find(g => g.id === activeTab);
  const displayTitle = activeTab === 'ALL' ? 'ALL GAMES' : (activeGame?.title || activeTab);
  const accentColor = activeTab === 'ALL' ? '#818cf8' : (activeGame?.color || '#818cf8');

  const top10 = entries.slice(0, 10);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      color: '#fff',
      fontFamily: "'JetBrains Mono', monospace",
      display: 'flex',
      flexDirection: 'column',
      cursor: showCursor ? 'default' : 'none',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ── Background glow ── */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '120%',
        height: '50%',
        background: `radial-gradient(ellipse at center, ${accentColor}08 0%, transparent 70%)`,
        pointerEvents: 'none',
        transition: 'background 1s ease',
      }} />

      {/* ── Header ── */}
      <header style={{
        padding: '24px 40px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 2,
      }}>
        <div>
          <div style={{
            fontSize: 'clamp(14px, 2vw, 18px)',
            letterSpacing: '0.2em',
            color: accentColor,
            fontWeight: 700,
            transition: 'color 0.5s',
          }}>
            LEADERBOARD
          </div>
          <div style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 800,
            color: '#e2e8f0',
            marginTop: '4px',
            lineHeight: 1.1,
            transition: 'all 0.5s',
          }}>
            {activeGame?.icon && <span style={{ marginRight: '12px', color: accentColor }}>{activeGame.icon}</span>}
            {displayTitle}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 'clamp(32px, 4vw, 56px)',
            fontWeight: 300,
            color: '#334155',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {clock}
          </div>
        </div>
      </header>

      {/* ── Game Tabs ── */}
      <nav style={{
        padding: '16px 40px',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
      }}>
        <TabButton
          label="ALL"
          active={activeTab === 'ALL'}
          color="#818cf8"
          onClick={() => handleTabClick('ALL')}
        />
        {GAMES.map(g => (
          <TabButton
            key={g.id}
            label={`${g.icon} ${g.title}`}
            active={activeTab === g.id}
            color={g.color}
            onClick={() => handleTabClick(g.id)}
          />
        ))}
        <button
          onClick={handleToggleRotate}
          style={{
            marginLeft: 'auto',
            background: autoRotate ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${autoRotate ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '8px',
            padding: '8px 16px',
            color: autoRotate ? '#10b981' : '#475569',
            fontSize: 'clamp(10px, 1.2vw, 13px)',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.05em',
            transition: 'all 0.3s',
          }}
        >
          {autoRotate ? '⟳ AUTO' : '⏸ MANUAL'}
        </button>
      </nav>

      {/* ── Ranking List ── */}
      <main style={{
        flex: 1,
        padding: '8px 40px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        position: 'relative',
        zIndex: 2,
        overflow: 'hidden',
      }}>
        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeTab === 'ALL' ? '80px 1fr 1fr 160px' : '80px 1fr 160px',
          padding: '8px 20px',
          color: '#475569',
          fontSize: 'clamp(10px, 1.2vw, 13px)',
          letterSpacing: '0.15em',
          fontWeight: 600,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <span>RANK</span>
          <span>PLAYER</span>
          {activeTab === 'ALL' && <span>GAME</span>}
          <span style={{ textAlign: 'right' }}>SCORE</span>
        </div>

        {top10.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1e293b',
            fontSize: 'clamp(16px, 2.5vw, 28px)',
            letterSpacing: '0.1em',
          }}>
            아직 기록이 없습니다
          </div>
        ) : (
          top10.map((entry, i) => {
            const rank = i + 1;
            const entryKey = `${entry.name}-${entry.score}-${entry.ts}`;
            const isNew = newEntryKeys.has(entryKey);
            const isTop3 = rank <= 3;
            const rankColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : '#334155';
            const entryColor = entry.gameColor || accentColor;

            return (
              <div
                key={entryKey}
                style={{
                  display: 'grid',
                  gridTemplateColumns: activeTab === 'ALL' ? '80px 1fr 1fr 160px' : '80px 1fr 160px',
                  alignItems: 'center',
                  padding: isTop3 ? '14px 20px' : '10px 20px',
                  borderRadius: '12px',
                  background: isNew
                    ? `linear-gradient(90deg, ${accentColor}20, transparent)`
                    : isTop3
                      ? 'rgba(255,255,255,0.02)'
                      : 'transparent',
                  borderLeft: isTop3 ? `3px solid ${rankColor}` : '3px solid transparent',
                  transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
                  animation: isNew ? 'slideIn 0.5s ease-out' : undefined,
                }}
              >
                {/* Rank */}
                <div style={{
                  fontSize: isTop3 ? 'clamp(28px, 3.5vw, 44px)' : 'clamp(18px, 2vw, 24px)',
                  fontWeight: 800,
                  color: rankColor,
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: rank === 1 ? '0 0 20px rgba(245,158,11,0.3)' : undefined,
                }}>
                  {String(rank).padStart(2, '0')}
                </div>

                {/* Name */}
                <div style={{
                  fontSize: isTop3 ? 'clamp(22px, 3vw, 36px)' : 'clamp(16px, 2vw, 24px)',
                  fontWeight: isTop3 ? 700 : 500,
                  color: isTop3 ? '#e2e8f0' : '#94a3b8',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {entry.name}
                </div>

                {/* Game tag (ALL mode) */}
                {activeTab === 'ALL' && (
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      background: `${entryColor}15`,
                      border: `1px solid ${entryColor}30`,
                      color: entryColor,
                      fontSize: 'clamp(10px, 1.2vw, 14px)',
                      fontWeight: 600,
                    }}>
                      {entry.gameTitle}
                    </span>
                  </div>
                )}

                {/* Score */}
                <div style={{
                  textAlign: 'right',
                  fontSize: isTop3 ? 'clamp(26px, 3.5vw, 42px)' : 'clamp(18px, 2vw, 28px)',
                  fontWeight: 800,
                  color: rank === 1 ? '#f59e0b' : isTop3 ? '#e2e8f0' : '#64748b',
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: rank === 1 ? '0 0 20px rgba(245,158,11,0.2)' : undefined,
                }}>
                  {entry.score.toLocaleString()}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        padding: '16px 40px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 2,
        borderTop: '1px solid rgba(255,255,255,0.03)',
      }}>
        <div style={{
          fontSize: 'clamp(11px, 1.3vw, 15px)',
          color: '#1e293b',
          letterSpacing: '0.15em',
          fontWeight: 700,
        }}>
          BYTEFORCE
        </div>
        <div style={{
          fontSize: 'clamp(10px, 1.1vw, 13px)',
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#10b981',
            display: 'inline-block',
            animation: 'pulse 2s infinite',
          }} />
          LIVE — 5초마다 갱신
        </div>
        <div style={{
          fontSize: 'clamp(10px, 1.1vw, 13px)',
          color: '#1e293b',
        }}>
          AI GAME FACTORY
        </div>
      </footer>

      {/* ── F11 Toast ── */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '12px 24px',
          color: '#64748b',
          fontSize: '13px',
          zIndex: 100,
          animation: 'fadeIn 0.3s ease-out',
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{ color: '#818cf8', fontWeight: 600 }}>F11</span> 키를 눌러 풀스크린으로 전환하세요
        </div>
      )}

      {/* ── Inline keyframes ── */}
      <style>{`
        @keyframes slideIn {
          0% { opacity: 0; transform: translateX(-30px); background: ${accentColor}30; }
          50% { background: ${accentColor}20; }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ── Tab Button ── */
function TabButton({ label, active, color, onClick }: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? `${color}18` : 'rgba(255,255,255,0.02)',
        border: `1.5px solid ${active ? color : 'rgba(255,255,255,0.04)'}`,
        borderRadius: '8px',
        padding: '8px 16px',
        color: active ? color : '#475569',
        fontSize: 'clamp(11px, 1.3vw, 14px)',
        fontWeight: active ? 700 : 500,
        fontFamily: "'JetBrains Mono', monospace",
        cursor: 'pointer',
        letterSpacing: '0.05em',
        transition: 'all 0.3s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}
