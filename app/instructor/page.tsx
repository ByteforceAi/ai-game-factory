'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DEMO_GAMES } from '@/lib/demoGames';

// 빌드 시 NEXT_PUBLIC_INSTRUCTOR_PIN으로 교체 가능 (기관/반별 PIN 운영)
// 클라이언트 노출되는 소프트 락 — 학생 접근 차단용이지 보안 경계가 아님
const CORRECT_PIN = process.env.NEXT_PUBLIC_INSTRUCTOR_PIN || '0608';

export default function InstructorPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', background: '#050510', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>Loading...</div>
      </div>
    }>
      <InstructorContent />
    </Suspense>
  );
}

function InstructorContent() {
  const searchParams = useSearchParams();
  const [authed, setAuthed] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // State mirrors of localStorage
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [skipSim, setSkipSim] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [appTheme, setAppTheme] = useState<'dark' | 'gov'>('dark');

  // Check PIN from URL on mount
  useEffect(() => {
    const pin = searchParams.get('pin');
    if (pin === CORRECT_PIN) {
      setAuthed(true);
    }
    // Load current state from localStorage
    setSelectedGameId(localStorage.getItem('instructor-override'));
    setSkipSim(localStorage.getItem('instructor-skip') === 'true');
    setStudentName(localStorage.getItem('student-name') || '');
    setSchoolName(localStorage.getItem('school-name') || '');
    setAppTheme(localStorage.getItem('app-theme') === 'gov' ? 'gov' : 'dark');
  }, [searchParams]);

  const handlePinSubmit = () => {
    if (pinInput === CORRECT_PIN) {
      setAuthed(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleSelectGame = (gameId: string) => {
    if (selectedGameId === gameId) {
      // Toggle off
      localStorage.removeItem('instructor-override');
      setSelectedGameId(null);
    } else {
      localStorage.setItem('instructor-override', gameId);
      setSelectedGameId(gameId);
    }
  };

  const handleToggleSkip = () => {
    const next = !skipSim;
    setSkipSim(next);
    if (next) {
      localStorage.setItem('instructor-skip', 'true');
    } else {
      localStorage.removeItem('instructor-skip');
    }
  };

  const handleNameChange = (name: string) => {
    setStudentName(name);
    if (name.trim()) {
      localStorage.setItem('student-name', name.trim());
    } else {
      localStorage.removeItem('student-name');
    }
  };

  const handleSchoolChange = (name: string) => {
    setSchoolName(name);
    if (name.trim()) {
      localStorage.setItem('school-name', name.trim());
    } else {
      localStorage.removeItem('school-name');
    }
  };

  const handleThemeChange = (theme: 'dark' | 'gov') => {
    setAppTheme(theme);
    if (theme === 'gov') {
      localStorage.setItem('app-theme', 'gov');
    } else {
      localStorage.removeItem('app-theme');
    }
  };

  const handleClearAll = () => {
    localStorage.removeItem('instructor-override');
    localStorage.removeItem('instructor-skip');
    localStorage.removeItem('student-name');
    localStorage.removeItem('school-name');
    localStorage.removeItem('app-theme');
    setSelectedGameId(null);
    setSkipSim(false);
    setStudentName('');
    setSchoolName('');
    setAppTheme('dark');
  };

  // ── PIN Gate ──
  if (!authed) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: '#050510',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: '40px 32px',
          width: '100%',
          maxWidth: '360px',
          margin: '0 16px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '11px',
            letterSpacing: '0.15em',
            color: '#818cf8',
            marginBottom: '8px',
            fontWeight: 600,
          }}>
            INSTRUCTOR MODE
          </div>
          <div style={{
            fontSize: '13px',
            color: '#64748b',
            marginBottom: '24px',
          }}>
            접근 PIN을 입력하세요
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="PIN"
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${pinError ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#e2e8f0',
                fontSize: '18px',
                textAlign: 'center',
                letterSpacing: '0.3em',
                outline: 'none',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'border-color 0.2s',
              }}
            />
            <button
              onClick={handlePinSubmit}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 20px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              ENTER
            </button>
          </div>
          {pinError && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '12px' }}>
              PIN이 올바르지 않습니다
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Dashboard ──
  const selectedGameData = DEMO_GAMES.find(g => g.id === selectedGameId);

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#050510',
      padding: '24px 16px',
      fontFamily: "'JetBrains Mono', monospace",
      maxWidth: '600px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
      }}>
        <div>
          <div style={{
            fontSize: '11px',
            letterSpacing: '0.15em',
            color: '#818cf8',
            fontWeight: 600,
          }}>
            INSTRUCTOR PANEL
          </div>
          <div style={{
            fontSize: '20px',
            color: '#e2e8f0',
            fontWeight: 700,
            marginTop: '4px',
          }}>
            수업 제어판
          </div>
        </div>
        <a
          href="/"
          style={{
            fontSize: '11px',
            color: '#64748b',
            textDecoration: 'none',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.06)',
            transition: 'all 0.2s',
          }}
        >
          ← 메인으로
        </a>
      </div>

      {/* ── 1. Game Selection ── */}
      <Section title="1. 게임 선택" subtitle="수강생에게 강제 할당할 게임">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '10px',
        }}>
          {DEMO_GAMES.map(game => {
            const isActive = selectedGameId === game.id;
            return (
              <button
                key={game.id}
                onClick={() => handleSelectGame(game.id)}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${game.accentColor}22, ${game.accentColor}11)`
                    : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isActive ? game.accentColor : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '12px',
                  padding: '14px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: game.accentColor,
                    color: '#000',
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.05em',
                  }}>
                    ON
                  </div>
                )}
                <div style={{
                  fontSize: '18px',
                  marginBottom: '6px',
                }}>
                  {game.icon}
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isActive ? game.accentColor : '#e2e8f0',
                  marginBottom: '4px',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {game.title}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#64748b',
                  lineHeight: 1.4,
                }}>
                  {game.id}
                </div>
              </button>
            );
          })}
        </div>
        {selectedGameId && (
          <div style={{
            marginTop: '10px',
            fontSize: '11px',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10b981',
              display: 'inline-block',
              animation: 'pulse 2s infinite',
            }} />
            현재 선택: {selectedGameData?.title} — 수강생이 어떤 프롬프트를 입력해도 이 게임이 로드됩니다
          </div>
        )}
      </Section>

      {/* ── 2. Simulation Skip ── */}
      <Section title="2. 시뮬레이션 스킵" subtitle="45초 코드 생성 연출을 3초로 단축">
        <button
          onClick={handleToggleSkip}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: skipSim ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1.5px solid ${skipSim ? '#10b981' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '12px',
            padding: '14px 18px',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.2s',
          }}
        >
          {/* Toggle switch */}
          <div style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            background: skipSim ? '#10b981' : '#334155',
            position: 'relative',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}>
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#fff',
              position: 'absolute',
              top: '3px',
              left: skipSim ? '23px' : '3px',
              transition: 'left 0.2s',
            }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: skipSim ? '#10b981' : '#e2e8f0',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {skipSim ? 'ON — 3초 스킵' : 'OFF — 45초 풀 연출'}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#64748b',
              marginTop: '2px',
            }}>
              {skipSim ? '부팅 연출 없이 바로 이름 입력으로 갑니다' : '기본 부팅 연출(약 7초)을 보여줍니다'}
            </div>
          </div>
        </button>
      </Section>

      {/* ── 3. Student Name ── */}
      <Section title="3. 수강생 이름 설정" subtitle="게임 타이틀에 '○○의 게임명' 으로 표시">
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="예: 홍길동"
            value={studentName}
            onChange={(e) => handleNameChange(e.target.value)}
            maxLength={20}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#e2e8f0',
              fontSize: '14px',
              outline: 'none',
              fontFamily: "'JetBrains Mono', monospace",
              transition: 'border-color 0.2s',
            }}
          />
          {studentName && (
            <button
              onClick={() => handleNameChange('')}
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px',
                padding: '12px 14px',
                color: '#ef4444',
                fontSize: '11px',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
              }}
            >
              삭제
            </button>
          )}
        </div>
        {studentName && (
          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#818cf8',
          }}>
            미리보기: <strong>{studentName}의 {selectedGameData?.title || '게임명'}</strong>
          </div>
        )}
      </Section>

      {/* ── 4. School Name ── */}
      <Section title="4. 학교(기관)명 설정" subtitle="시작 화면과 입장 카드에 학교명이 표시됩니다">
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="예: 해강초등학교"
            value={schoolName}
            onChange={(e) => handleSchoolChange(e.target.value)}
            maxLength={30}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#e2e8f0',
              fontSize: '14px',
              outline: 'none',
              fontFamily: "'JetBrains Mono', monospace",
              transition: 'border-color 0.2s',
            }}
          />
          {schoolName && (
            <button
              onClick={() => handleSchoolChange('')}
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px',
                padding: '12px 14px',
                color: '#ef4444',
                fontSize: '11px',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
              }}
            >
              삭제
            </button>
          )}
        </div>
        {schoolName && (
          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#22c55e',
          }}>
            미리보기: <strong>{schoolName} AI 코딩 교실</strong>
          </div>
        )}
      </Section>

      {/* ── 5. Theme ── */}
      <Section title="5. 화면 테마" subtitle="공공기관 테마는 수업(채팅) 화면에 적용됩니다 — 시작 연출은 다크 유지 (베타)">
        <div style={{ display: 'flex', gap: '8px' }}>
          {([
            { id: 'dark' as const, label: '🌌 다크 (기본)', desc: '딥스페이스' },
            { id: 'gov' as const, label: '🏛 공공기관 라이트', desc: '국정 파랑 · KRDS풍' },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t.id)}
              style={{
                flex: 1,
                background: appTheme === t.id ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${appTheme === t.id ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '12px',
                padding: '14px 12px',
                color: appTheme === t.id ? '#22c55e' : '#94a3b8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              <div>{t.label}</div>
              <div style={{ fontSize: '10px', fontWeight: 400, marginTop: '4px', opacity: 0.7 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </Section>

      {/* ── Current Status ── */}
      <Section title="현재 상태" subtitle="">
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '12px',
          lineHeight: 2,
          color: '#94a3b8',
        }}>
          <StatusRow label="선택된 게임" value={selectedGameData ? `${selectedGameData.icon} ${selectedGameData.title}` : '—'} active={!!selectedGameId} />
          <StatusRow label="부팅 연출" value={skipSim ? '생략' : '기본 (약 7초)'} active={skipSim} />
          <StatusRow label="수강생 이름" value={studentName || '—'} active={!!studentName} />
          <StatusRow label="학교명" value={schoolName || '—'} active={!!schoolName} />
          <StatusRow label="화면 테마" value={appTheme === 'gov' ? '🏛 공공기관 라이트' : '🌌 다크'} active={appTheme === 'gov'} />
        </div>
      </Section>

      {/* ── Clear All ── */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button
          onClick={handleClearAll}
          style={{
            background: 'none',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '10px',
            padding: '10px 24px',
            color: '#ef4444',
            fontSize: '11px',
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          🗑 모든 설정 초기화
        </button>
      </div>

      <div style={{
        marginTop: '32px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        fontSize: '10px',
        color: '#475569',
        textAlign: 'center',
        lineHeight: 1.6,
      }}>
        설정은 이 브라우저(이 기기)에만 저장됩니다.<br />
        수강생 기기에서 /instructor?pin=발급받은PIN 으로 접근해 설정하세요.
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Section({ title, subtitle, children }: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{
        fontSize: '13px',
        fontWeight: 700,
        color: '#e2e8f0',
        marginBottom: '4px',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {title}
      </div>
      {subtitle && (
        <div style={{
          fontSize: '11px',
          color: '#64748b',
          marginBottom: '12px',
        }}>
          {subtitle}
        </div>
      )}
      {children}
    </div>
  );
}

function StatusRow({ label, value, active }: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span>{label}</span>
      <span style={{
        color: active ? '#10b981' : '#475569',
        fontWeight: active ? 600 : 400,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {value}
      </span>
    </div>
  );
}
