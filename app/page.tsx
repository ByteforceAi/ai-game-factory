'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Onboarding from '@/components/Onboarding';
import Welcome from '@/components/Welcome';
import Sidebar from '@/components/Sidebar';
import InputArea, { type InputAreaHandle } from '@/components/InputArea';
import UserMessage from '@/components/UserMessage';
import AIMessage from '@/components/AIMessage';
import ArtifactPanel from '@/components/ArtifactPanel';
import {
  findResponse,
  findScenario,
  createLogEntry,
  SCENARIOS,
  type LogEntry,
  type ScenarioResponse,
} from '@/lib/scenarios';
import { getGameHtml } from '@/lib/gameLoader';
import { matchChatCommand, getVibeConfig } from '@/lib/vibeCommands';
import { getGameExtensionsScript } from '@/lib/gameExtensions';
import { VISUAL_THEMES, applyVisualTheme } from '@/lib/visualThemes';
import { initAudio, playPing, playComplete, playWhoosh, isMuted, setMuted } from '@/lib/sounds';
import { scorePrompt, type PromptScore } from '@/lib/promptScoring';
import { timeline } from '@/lib/timelineRecorder';
import PromptLevel from '@/components/PromptLevel';
import CodeDiff from '@/components/CodeDiff';
import LiveDashboard from '@/components/LiveDashboard';
import TimelineReplay from '@/components/TimelineReplay';

// ═══════════════════════════════════════════
// CLAUDE SIMULATOR — Main Page
// 3 Phase Flow: Onboarding → Welcome → Chat
// + Code Diff, Prompt Level, Live Dashboard,
//   Code X-Ray, Timeline Replay
// ═══════════════════════════════════════════

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  response?: ScenarioResponse;
  promptScore?: PromptScore;
  codeDiff?: { oldCode: string; newCode: string; label: string };
}

export default function Home() {
  // ── Phase state ──
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [userName, setUserName] = useState('');

  // ── Chat state ──
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [chatTitle, setChatTitle] = useState('새 대화');

  // ── Sidebar state ──
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Collapse sidebar on mobile
  useEffect(() => {
    if (window.innerWidth < 900) setSidebarCollapsed(true);
  }, []);

  // Session restore — 새로고침해도 부팅/로그인 반복 없이 이어가기
  // sessionStorage라서 탭을 닫으면 초기화됨 (공용 태블릿에서 다음 학생에게 안 넘어감)
  // 교사 패널(/instructor)이 지정한 student-name(localStorage)은 프리셋으로 승계
  useEffect(() => {
    const saved = sessionStorage.getItem('vibe-student-name');
    const preset = localStorage.getItem('student-name');
    const name = saved || preset;
    if (name) {
      setUserName(name);
      setPhase(1);
      if (!saved) {
        try { sessionStorage.setItem('vibe-student-name', name); } catch {}
      }
    }
  }, []);

  // ── Artifact state ──
  const [artifactOpen, setArtifactOpen] = useState(false);
  const [artifactTitle, setArtifactTitle] = useState('');
  const [artifactCode, setArtifactCode] = useState('');
  const [artifactPreview, setArtifactPreview] = useState('');
  const [artifactGameHtml, setArtifactGameHtml] = useState('');

  // ── Active game (for vibe commands) ──
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // ── Innovative features ──
  const [showDashboard, setShowDashboard] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  // ── 효과음 음소거 (UI 사운드 한정, localStorage 유지) ──
  const [soundMuted, setSoundMuted] = useState(false);
  useEffect(() => { setSoundMuted(isMuted()); }, []);
  const toggleMute = useCallback(() => {
    setSoundMuted((m) => {
      setMuted(!m);
      return !m;
    });
  }, []);

  // ── 화면 테마 (다크 ↔ 공공기관 라이트) — 상단바에서 즉시 전환 ──
  const [appTheme, setAppTheme] = useState<'dark' | 'gov'>('dark');
  useEffect(() => {
    setAppTheme(document.documentElement.getAttribute('data-theme') === 'gov' ? 'gov' : 'dark');
  }, []);
  const toggleTheme = useCallback(() => {
    setAppTheme((prev) => {
      const next = prev === 'gov' ? 'dark' : 'gov';
      try {
        if (next === 'gov') {
          localStorage.setItem('app-theme', 'gov');
          document.documentElement.setAttribute('data-theme', 'gov');
        } else {
          localStorage.removeItem('app-theme');
          document.documentElement.removeAttribute('data-theme');
        }
      } catch {}
      return next;
    });
  }, []);

  // ── Input ref (for typing animation) ──
  const inputAreaRef = useRef<InputAreaHandle>(null);

  // ── Log system ──
  const messageLogRef = useRef<LogEntry[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [logCount, setLogCount] = useState(0);

  // Expose log functions + init audio + listen for game over
  useEffect(() => {
    // 수업 기록 추출용 콘솔 헬퍼 — 반환값만 쓰고 콘솔 출력은 dev에서만
    (window as any).getLog = () => {
      if (process.env.NODE_ENV !== 'production') console.table(messageLogRef.current);
      return messageLogRef.current;
    };
    (window as any).exportLog = () => {
      const data = JSON.stringify(messageLogRef.current, null, 2);
      if (process.env.NODE_ENV !== 'production') console.log(data);
      return data;
    };

    // Init audio on first interaction — 키보드로만 입장하는 학생도 커버 (Enter 입장)
    const handleFirstInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    // Listen for game over postMessage from iframe (with dedup)
    let gameOverHandled = false;
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'gameOver' && !gameOverHandled) {
        gameOverHandled = true;
        const score = e.data.score || 0;
        playComplete();
        const gameOverMsg: ChatMessage = {
          id: Date.now().toString(),
          type: 'ai',
          text: '',
          response: {
            text: `🏆 **게임 끝!** 점수: **${score}점**\n\n잘했어요! 한 판 더 도전할까요, 아니면 게임을 좀 바꿔볼까요?`,
            suggestions: [
              { icon: '🔄', label: '다시 시작해줘', prompt: '다시 시작해줘' },
              { icon: '🎮', label: '다른 게임 보여줘', prompt: '다른 게임 보여줘' },
            ],
          },
        };
        setMessages((prev) => [...prev, gameOverMsg]);
        setIsStreaming(false);
        // Reset after 3s so next game over can be detected
        setTimeout(() => { gameOverHandled = false; }, 3000);
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('message', handleMessage);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addLog = useCallback(
    (type: LogEntry['type'], content: string) => {
      messageLogRef.current.push(createLogEntry(userName, type, content));
      setLogCount(messageLogRef.current.length);
    },
    [userName]
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  // ══════════════════════
  // PHASE 0 → 1: Name submitted
  // ══════════════════════
  const handleNameSubmit = useCallback((name: string) => {
    setUserName(name);
    setPhase(1);
    try { sessionStorage.setItem('vibe-student-name', name); } catch {}
    timeline.reset();
    timeline.record({ type: 'system', label: `학생 "${name}" 입장` });
  }, []);

  // ══════════════════════
  // PHASE 1 → 2: Start chat
  // ══════════════════════
  const pendingPromptRef = useRef<string | null>(null);
  const doSendRef = useRef<((text: string) => void) | null>(null);

  const handleStartChat = useCallback(
    (initialPrompt?: string, typingPrompt?: string) => {
      setPhase(2);
      addLog('system', `학생 "${userName}" 입장`);
      // typingPrompt = card click (show typing prompt for student)
      // initialPrompt = direct text (auto-send legacy, not used now)
      if (typingPrompt) {
        pendingPromptRef.current = typingPrompt;
      } else if (initialPrompt) {
        pendingPromptRef.current = initialPrompt;
      }
    },
    [userName, addLog]
  );

  // 교사 강제 게임(instructor-override): 이름 확정 후 1회만 자동 시작.
  // 1회 제한이라 학생이 '다른 게임 보여줘'로 빠져나올 수 있음 — 재강제는 새로고침.
  const overrideAppliedRef = useRef(false);
  useEffect(() => {
    if (phase !== 1 || !userName || overrideAppliedRef.current) return;
    const override = localStorage.getItem('instructor-override');
    if (!override) return;
    const scenario = SCENARIOS.find((s) => s.gameId === override && s.prompt);
    if (!scenario) return;
    overrideAppliedRef.current = true;
    const t = setTimeout(() => handleStartChat(undefined, scenario.prompt), 800);
    return () => clearTimeout(t);
  }, [phase, userName, handleStartChat]);

  // After phase transition, show AI guide message with the prompt to type
  useEffect(() => {
    if (phase === 2 && pendingPromptRef.current) {
      const prompt = pendingPromptRef.current;
      pendingPromptRef.current = null;

      // Show AI guide message — terminal style prompt instruction
      setTimeout(() => {
        const guideMsg: ChatMessage = {
          id: Date.now().toString(),
          type: 'ai',
          text: '',
          response: {
            text: `${userName}님, 아래 문장을 **직접 입력**해보세요! ⌨️\n\nAI에게 말하듯이 쓰면 코드가 만들어져요.`,
            typingPrompt: prompt, // Special field for terminal-style prompt display
          },
        };
        setMessages([guideMsg]);
        setShowHints(true);
      }, 600);
    }
  }, [phase, userName]);

  // ══════════════════════
  // SEND MESSAGE
  // ══════════════════════
  const doSendMessage = useCallback(
    (text: string) => {
      if (isStreaming) return;

      // Prevent double-sends — setIsStreaming(true) 이전에 가드해야
      // 연타 시 입력창이 영구 잠기는 데드락이 없다
      const sendTime = Date.now();
      if ((window as any).__lastSendTime && sendTime - (window as any).__lastSendTime < 500) return;
      (window as any).__lastSendTime = sendTime;

      setIsStreaming(true);
      setShowHints(false);
      inputAreaRef.current?.clear();

      // Update chat title with first message
      if (messages.length === 0) {
        setChatTitle(text.length > 20 ? text.slice(0, 20) + '...' : text);
      }

      // ── "다시 시작" handler ──
      const lower = text.toLowerCase();
      if (lower.includes('다시') && (lower.includes('시작') || lower.includes('도전') || lower.includes('하기'))) {
        if (activeGameId) {
          const iframe = document.querySelector<HTMLIFrameElement>('iframe');
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'resetGameOver' }, '*');
            // Reload the game by resetting srcdoc
            const srcdoc = iframe.srcdoc;
            iframe.srcdoc = '';
            setTimeout(() => { iframe.srcdoc = srcdoc; }, 100);
          }
          const restartMsg: ScenarioResponse = {
            text: '🔄 게임을 다시 시작했어요! 이번엔 더 높은 점수를 노려보세요! 💪',
            suggestions: buildGameSuggestions(activeGameId),
          };
          const userMsg: ChatMessage = { id: Date.now().toString(), type: 'user', text };
          const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), type: 'ai', text: restartMsg.text, response: restartMsg };
          setMessages((prev) => [...prev, userMsg, aiMsg]);
          addLog('user', text);
          addLog('ai', '[RESTART]');
          setTimeout(() => { scrollToBottom(); setIsStreaming(false); }, 100);
          return;
        }
      }

      // ── "다른 게임" handler — go back to welcome ──
      // '다른 단 보여줘'(구구단 vibe) 등 오발 방지: 명시적 문구 + '만들' 제외
      if (
        (lower.includes('다른 게임') ||
          lower.includes('딴 게임') ||
          lower.includes('게임 목록') ||
          lower.includes('처음으로') ||
          lower.includes('메인으로')) &&
        !lower.includes('만들')
      ) {
        // CRITICAL: Kill iframe audio/game BEFORE switching
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
          try {
            iframe.contentWindow?.postMessage({ type: 'STOP_ALL' }, '*');
            iframe.srcdoc = ''; // wipe the iframe
            iframe.remove();
          } catch {}
        });

        setPhase(1);
        setMessages([]);
        setShowHints(true);
        setChatTitle('새 대화');
        setArtifactOpen(false);
        setArtifactGameHtml('');
        setArtifactCode('');
        setArtifactPreview('');
        setActiveGameId(null);
        addLog('user', text);
        addLog('system', '웰컴 화면으로 이동');
        return;
      }

      // ── Check if this is a vibe command for active game ──
      if (activeGameId) {
        const vibeMatch = matchChatCommand(
          activeGameId === 'gugudan-3d' ? 'gugudan' : activeGameId,
          text
        );
        if (vibeMatch) {
          // Send postMessage to iframe
          const iframe = document.querySelector<HTMLIFrameElement>(
            '.artifact-panel-open iframe, [class*="artifact"] iframe'
          );
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(
              { type: vibeMatch.messageType, value: vibeMatch.value },
              '*'
            );
          }

          // Create AI response — NO artifact (keep game running!)
          // Code diff shown inline in chat instead
          const oldSnippet = `// 기존 코드\nlet value = defaultValue;`;
          const vibeResponse: ScenarioResponse = {
            text: vibeMatch.response + '\n\n게임에 바로 적용됐어요! 다른 수정도 해볼까요?',
            suggestions: buildGameSuggestions(activeGameId),
          };

          const pScore = scorePrompt(text);
          const userMsg: ChatMessage = {
            id: Date.now().toString(),
            type: 'user',
            text,
            promptScore: pScore,
          };
          const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            text: vibeResponse.text,
            response: vibeResponse,
            codeDiff: {
              oldCode: oldSnippet,
              newCode: vibeMatch.codeSnippet,
              label: vibeMatch.response.slice(0, 20),
            },
          };

          setMessages((prev) => [...prev, userMsg, aiMsg]);
          addLog('user', text);
          addLog('ai', `[VIBE] ${vibeMatch.response}`);
          timeline.record({ type: 'user', label: text.slice(0, 40), score: pScore.score });
          timeline.record({ type: 'vibe', label: vibeMatch.response.slice(0, 40), gameId: activeGameId });
          setTimeout(() => { scrollToBottom(); setIsStreaming(false); }, 100);
          return;
        }
      }

      // ── Check for visual theme request (works even without activeGameId) ──
      {
        const lower = text.toLowerCase();
        // '네온 플랫포머 게임 만들어줘' 같은 생성 요청을 가로채지 않도록 의도 가드
        const wantsTheme =
          ['테마', '효과', '배경', '분위기', '스타일'].some((k) => lower.includes(k)) &&
          !lower.includes('만들');
        const themeKeywords: [string[], string][] = wantsTheme
          ? [
              [['네온', 'neon'], 'mood-neon-nights'],
              [['사이버펑크', 'cyber'], 'theme-cyberpunk'],
              [['베이퍼', 'vapor'], 'theme-vaporwave'],
              [['레트로', 'retro'], 'fx-crt'],
              [['눈', 'snow'], 'ov-snow'],
              [['비', 'rain', '비가'], 'ov-rain'],
              [['스캔', 'scanline', 'crt'], 'fx-scanlines'],
              [['매트릭스', 'matrix'], 'theme-matrix'],
            ]
          : [];
        for (const [keywords, themeId] of themeKeywords) {
          if (keywords.some((k) => lower.includes(k))) {
            const theme = VISUAL_THEMES.find((t) => t.id === themeId);
            if (theme) {
              // Apply theme to iframe
              const iframe = document.querySelector<HTMLIFrameElement>('.artifact-panel-open iframe') || document.querySelector<HTMLIFrameElement>('iframe');
              if (iframe) {
                try {
                  if (iframe.contentDocument) {
                    const old = iframe.contentDocument.querySelectorAll('style[data-theme]');
                    old.forEach((s) => s.remove());
                    const style = iframe.contentDocument.createElement('style');
                    style.setAttribute('data-theme', theme.id);
                    style.textContent = theme.css;
                    iframe.contentDocument.head.appendChild(style);
                  }
                } catch {
                  if (iframe.srcdoc) {
                    iframe.srcdoc = applyVisualTheme(iframe.srcdoc, theme);
                  }
                }

                // Weather overlays — canvas-based particles that show OVER the game
                if (iframe.contentWindow) {
                  if (themeId === 'ov-rain') {
                    iframe.contentWindow.postMessage({ type: 'WEATHER_START', weatherType: 'rain' }, '*');
                  } else if (themeId === 'ov-snow') {
                    iframe.contentWindow.postMessage({ type: 'WEATHER_START', weatherType: 'snow' }, '*');
                  }
                }
              }
              playPing();

              const themeResponse: ScenarioResponse = {
                text: `🎨 **${theme.label}** 테마를 적용했어요!\n\n${theme.description || '게임의 비주얼이 바뀌었어요.'} 다른 테마도 해볼까요?`,
                suggestions: [
                  { icon: '🌈', label: '사이버펑크', prompt: '사이버펑크 테마 적용해줘' },
                  { icon: '🌙', label: '레트로', prompt: '레트로 테마 적용해줘' },
                  { icon: '🌧️', label: '비 효과', prompt: '비 효과 적용해줘' },
                  { icon: '❄️', label: '눈 효과', prompt: '눈 효과 적용해줘' },
                ],
              };
              const pScore = scorePrompt(text);
              const userMsg: ChatMessage = { id: Date.now().toString(), type: 'user', text, promptScore: pScore };
              const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), type: 'ai', text: themeResponse.text, response: themeResponse };
              setMessages((prev) => [...prev, userMsg, aiMsg]);
              addLog('user', text);
              addLog('ai', `[THEME] ${theme.label}`);
              timeline.record({ type: 'user', label: text.slice(0, 40), score: pScore.score });
              timeline.record({ type: 'theme', label: theme.label });
              setTimeout(() => { scrollToBottom(); setIsStreaming(false); }, 100);
              return;
            }
          }
        }
      }

      // ── Normal scenario response ──
      // findScenario로 일원화 — 키워드 매칭("테트리스해줘")도 게임 부착/제안칩이 열린다
      const response = findResponse(text, userName);
      const matchedScenario = findScenario(text);
      if (matchedScenario?.gameId) {
        const gameHtml = getGameHtml(matchedScenario.gameId);
        if (gameHtml) {
          // Inject touch extensions
          const extensions = getGameExtensionsScript();
          response.gameHtml = gameHtml.replace(
            '</body>',
            `<script>${extensions}<\/script></body>`
          );
        }
        // Set active game for vibe commands
        setActiveGameId(matchedScenario.gameId);
        // Add game-specific suggestions
        response.suggestions = buildGameSuggestions(matchedScenario.gameId);
      }

      // Score the prompt
      const pScore = scorePrompt(text);

      // Add user + AI messages
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        text,
        promptScore: pScore,
      };
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: response.text,
        response,
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      addLog('user', text);
      addLog('ai', response.text.substring(0, 80) + '...');

      // Timeline recording
      timeline.record({ type: 'user', label: text.slice(0, 40), detail: text, score: pScore.score });
      timeline.record({ type: matchedScenario?.gameId ? 'game-start' : 'ai', label: response.text.slice(0, 40), gameId: matchedScenario?.gameId });

      setTimeout(() => {
        scrollToBottom();
      }, 100);
    },
    [isStreaming, messages.length, userName, addLog, scrollToBottom]
  );

  // Keep ref in sync for handleStartChat's useEffect
  doSendRef.current = doSendMessage;

  // Called when AI message finishes streaming
  const handleStreamComplete = useCallback(() => {
    setIsStreaming(false);
  }, []);

  // ══════════════════════
  // ARTIFACT
  // ══════════════════════
  const handleArtifactOpen = useCallback(
    (title: string, code: string, preview?: string, gameHtmlArg?: string) => {
      setArtifactTitle(title);
      setArtifactCode(code);
      setArtifactPreview(preview || '');
      setArtifactGameHtml(gameHtmlArg || '');
      setArtifactOpen(true);
      playWhoosh(); // 패널 슬라이드와 함께 전환음
    },
    []
  );

  // ══════════════════════
  // NEW CHAT
  // ══════════════════════
  const handleNewChat = useCallback(() => {
    // 전체 세션 초기화 — 게임/아티팩트 상태도 클리어
    setMessages([]);
    setShowHints(true);
    setChatTitle('새 대화');
    setArtifactOpen(false);
    setArtifactGameHtml('');
    setArtifactCode('');
    setArtifactTitle('');
    setArtifactPreview('');
    setActiveGameId(null);
    setIsStreaming(false);
    // Welcome 화면으로 돌아가기
    setPhase(1);
  }, []);

  // ══════════════════════
  // HINT/SUGGESTION CHIP → put text in input (student must press Enter)
  // ══════════════════════
  const handleHintSelect = useCallback(
    (prompt: string) => {
      if (isStreaming) return;
      // Just set the text in input — student types/edits and presses Enter
      inputAreaRef.current?.setHint(prompt);
    },
    [isStreaming]
  );

  // ══════════════════════
  // RENDER
  // ══════════════════════
  return (
    <>
      {/* PHASE 0: Onboarding */}
      {phase === 0 && <Onboarding onSubmit={handleNameSubmit} />}

      {/* PHASE 1: Welcome */}
      {phase === 1 && (
        <Welcome userName={userName} onStartChat={handleStartChat} />
      )}

      {/* PHASE 2: Chat App */}
      <div
        className={`flex w-full h-dvh transition-opacity duration-500 ${
          phase === 2
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Sidebar — 900px 미만에선 본문을 밀지 않는 드로어로 전환 */}
        {!sidebarCollapsed && (
          <div
            className="hidden max-[900px]:block fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}
        <div
          className={
            !sidebarCollapsed
              ? 'max-[900px]:fixed max-[900px]:inset-y-0 max-[900px]:left-0 max-[900px]:z-40 max-[900px]:shadow-2xl'
              : ''
          }
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((c) => !c)}
            onNewChat={handleNewChat}
            chatTitle={chatTitle}
          />
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <div className="h-12 flex items-center justify-between px-3 md:px-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              {sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  aria-label="사이드바 열기"
                  className="w-10 h-10 rounded-claude-sm flex items-center justify-center text-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] active:scale-95 cursor-pointer transition-all duration-200"
                >
                  ☰
                </button>
              )}
              <div className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', 'Noto Sans KR', sans-serif" }}>
                <div className="w-2 h-3 rounded-[1px]" style={{ background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary-glow)' }} />
                바이브코딩 아레나
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Live Dashboard toggle — only when game is active */}
              {activeGameId && (
                <button
                  onClick={() => setShowDashboard(d => !d)}
                  title="실시간 대시보드"
                  aria-label="실시간 대시보드"
                  className={`w-10 h-10 rounded-claude-sm flex items-center justify-center text-[15px] cursor-pointer transition-all duration-200 active:scale-95 ${showDashboard ? 'text-[var(--accent-primary)] bg-[var(--bg-surface)]' : 'text-[var(--text-secondary)] bg-transparent'} hover:bg-[var(--bg-tertiary)]`}
                >
                  📊
                </button>
              )}
              {/* Timeline button */}
              <button
                onClick={() => setShowTimeline(true)}
                title="학습 타임라인"
                aria-label="학습 타임라인"
                className="w-10 h-10 rounded-claude-sm flex items-center justify-center text-[15px] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] active:scale-95 cursor-pointer transition-all duration-200"
              >
                🎬
              </button>
              {/* Theme toggle — 다크 ↔ 공공기관 라이트 즉시 전환 */}
              <button
                onClick={toggleTheme}
                title={appTheme === 'gov' ? '다크 테마로 전환' : '공공기관 라이트 테마로 전환'}
                aria-label={appTheme === 'gov' ? '다크 테마로 전환' : '공공기관 라이트 테마로 전환'}
                className="w-10 h-10 rounded-claude-sm flex items-center justify-center text-[15px] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] active:scale-95 cursor-pointer transition-all duration-200"
              >
                {appTheme === 'gov' ? '🌌' : '🏛'}
              </button>
              {/* Sound mute toggle — 교실 일괄 음소거용 */}
              <button
                onClick={toggleMute}
                title={soundMuted ? '효과음 켜기' : '효과음 끄기'}
                aria-label={soundMuted ? '효과음 켜기' : '효과음 끄기'}
                className={`w-10 h-10 rounded-claude-sm flex items-center justify-center text-[15px] hover:bg-[var(--bg-tertiary)] active:scale-95 cursor-pointer transition-all duration-200 ${soundMuted ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                {soundMuted ? '🔇' : '🔊'}
              </button>
            </div>
          </div>

          {/* Content Area — <900px에선 세로 분할(게임 위, 채팅 아래) */}
          <div className="flex-1 flex max-[900px]:flex-col overflow-hidden relative">
            {/* Chat Panel */}
            <div
              className="flex-1 flex flex-col min-w-0 min-h-0"
              style={{
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                // 정적 앰비언트 헤일로 — 온보딩의 그린 코어와 같은 세계라는 신호 (gov에선 국정 파랑)
                background:
                  'radial-gradient(640px 300px at 50% -100px, var(--ambient-halo), transparent 70%)',
              }}
            >
              {/* Messages */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-[680px] w-full mx-auto px-4 md:px-6 py-5 pb-10 flex flex-col gap-6">
                  {messages.map((msg) =>
                    msg.type === 'user' ? (
                      <div key={msg.id}>
                        <UserMessage text={msg.text} />
                        {msg.promptScore && msg.promptScore.score > 0 && (
                          <div className="flex justify-end mt-0.5 mr-1">
                            <PromptLevel {...msg.promptScore} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div key={msg.id}>
                        <AIMessage
                          response={msg.response!}
                          onArtifactOpen={handleArtifactOpen}
                          onStreamComplete={handleStreamComplete}
                          onSuggestionClick={handleHintSelect}
                        />
                        {msg.codeDiff && (
                          <div className="ml-10">
                            <CodeDiff
                              oldCode={msg.codeDiff.oldCode}
                              newCode={msg.codeDiff.newCode}
                              label={msg.codeDiff.label}
                            />
                          </div>
                        )}
                      </div>
                    )
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area */}
              <InputArea
                ref={inputAreaRef}
                onSend={doSendMessage}
                disabled={isStreaming}
                showHints={showHints}
                onHintSelect={handleHintSelect}
              />
            </div>

            {/* Artifact Panel */}
            <ArtifactPanel
              open={artifactOpen}
              title={artifactTitle}
              code={artifactCode}
              preview={artifactPreview}
              gameHtml={artifactGameHtml}
              onClose={() => setArtifactOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* Live Dashboard — floating overlay */}
      {activeGameId && (
        <LiveDashboard
          gameId={activeGameId}
          open={showDashboard}
          onClose={() => setShowDashboard(false)}
        />
      )}

      {/* Timeline Replay modal */}
      <TimelineReplay
        open={showTimeline}
        onClose={() => setShowTimeline(false)}
      />

      {/* Log indicator — 탭하면 수업 기록 JSON 다운로드 (교사가 순회하며 수거) */}
      {phase === 2 && (
        <button
          onClick={() => {
            const data = JSON.stringify(messageLogRef.current, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `수업기록_${userName || '학생'}_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          title="수업 기록 다운로드 (JSON)"
          aria-label="수업 기록 다운로드"
          className="pressable fixed bottom-3 right-3 flex items-center gap-1.5 z-10 px-2.5 py-1.5 rounded-full cursor-pointer bg-transparent hover:bg-[var(--bg-tertiary)]"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-muted)',
            border: 'none',
          }}
        >
          <div
            className="w-[5px] h-[5px] rounded-full animate-log-pulse"
            style={{ background: 'var(--accent-green)' }}
          />
          <span>수업 기록 {logCount}건 ⤓</span>
        </button>
      )}
    </>
  );
}

// ── Utility ──
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Game-specific rich suggestion prompts
const GAME_SUGGESTIONS: Record<string, { icon: string; label: string; prompt: string }[]> = {
  'neon-shooter': [
    { icon: '🛡️', label: '무적 모드 켜줘', prompt: '무적 모드 켜줘' },
    { icon: '🔥', label: '연사 속도 올려줘', prompt: '속도 올려줘' },
    { icon: '👹', label: '보스 나오게 해줘', prompt: '보스 나오게 해줘' },
    { icon: '🎨', label: '네온 테마 적용해줘', prompt: '네온 테마 적용해줘' },
    { icon: '❄️', label: '눈 효과 적용해줘', prompt: '눈 효과 적용해줘' },
  ],
  'tetris': [
    { icon: '🐢', label: '속도 느리게 해줘', prompt: '속도 느리게 해줘' },
    { icon: '⚡', label: '속도 빠르게 해줘', prompt: '속도 올려줘' },
    { icon: '🎨', label: '사이버펑크 테마 적용해줘', prompt: '사이버펑크 테마 적용해줘' },
    { icon: '🌧️', label: '비 효과 적용해줘', prompt: '비 효과 적용해줘' },
  ],
  'temple-runner': [
    { icon: '💨', label: '속도 올려줘', prompt: '속도 올려줘' },
    { icon: '💰', label: '코인 많이 줘', prompt: '코인 많이 줘' },
    { icon: '🎨', label: '레트로 테마 적용해줘', prompt: '레트로 테마 적용해줘' },
  ],
  'cat-jump': [
    { icon: '🦘', label: '점프력 높여줘', prompt: '점프력 높여줘' },
    { icon: '💨', label: '속도 올려줘', prompt: '속도 올려줘' },
    { icon: '🎨', label: '네온 테마 적용해줘', prompt: '네온 테마 적용해줘' },
  ],
  'neon-platformer': [
    { icon: '🦘', label: '점프력 높여줘', prompt: '점프력 높여줘' },
    { icon: '🛡️', label: '무적 모드 켜줘', prompt: '무적 모드 켜줘' },
    { icon: '🎨', label: '매트릭스 테마 적용해줘', prompt: '매트릭스 테마 적용해줘' },
  ],
  'dot-rpg': [
    { icon: '⚔️', label: '공격력 올려줘', prompt: '공격력 올려줘' },
    { icon: '❤️', label: '체력 올려줘', prompt: '체력 올려줘' },
    { icon: '🎨', label: '레트로 테마 적용해줘', prompt: '레트로 테마 적용해줘' },
  ],
  'balloon-pop': [
    { icon: '⏱️', label: '시간 늘려줘', prompt: '시간 늘려줘' },
    { icon: '🎈', label: '풍선 많이 나오게 해줘', prompt: '풍선 많이 나오게 해줘' },
    { icon: '🎨', label: '네온 테마 적용해줘', prompt: '네온 테마 적용해줘' },
  ],
  'star-catch': [
    { icon: '⭐', label: '별 많이 나오게 해줘', prompt: '별 많이 나오게 해줘' },
    { icon: '💨', label: '속도 느리게 해줘', prompt: '속도 느리게 해줘' },
    { icon: '🎨', label: '사이버펑크 테마 적용해줘', prompt: '사이버펑크 테마 적용해줘' },
  ],
  'farm-garden': [
    { icon: '🌧️', label: '비 오게 해줘', prompt: '비 오게 해줘' },
    { icon: '⏱️', label: '시간 빠르게 해줘', prompt: '시간 빠르게 해줘' },
    { icon: '🌙', label: '밤으로 바꿔줘', prompt: '밤으로 바꿔줘' },
    { icon: '💰', label: '골드 많이 줘', prompt: '골드 많이 줘' },
  ],
  'moon-orbit': [
    { icon: '🔭', label: '카메라 줌인 해줘', prompt: '줌인 해줘' },
    { icon: '⏱️', label: '공전 속도 올려줘', prompt: '속도 올려줘' },
    { icon: '🎨', label: '네온 테마 적용해줘', prompt: '네온 테마 적용해줘' },
  ],
  'gugudan-3d': [
    { icon: '🔢', label: '다른 단 보여줘', prompt: '다른 단 보여줘' },
    { icon: '⏱️', label: '속도 올려줘', prompt: '속도 올려줘' },
    { icon: '🎨', label: '네온 테마 적용해줘', prompt: '네온 테마 적용해줘' },
  ],
  'emoji-catch': [
    { icon: '💨', label: '속도 올려줘', prompt: '속도 올려줘' },
    { icon: '🍔', label: '음식 많이 나오게 해줘', prompt: '음식 많이 나오게 해줘' },
    { icon: '🎨', label: '네온 테마 적용해줘', prompt: '네온 테마 적용해줘' },
  ],
};

function buildGameSuggestions(
  gameId: string
): { icon: string; label: string; prompt: string }[] {
  return GAME_SUGGESTIONS[gameId] || [
    { icon: '⚡', label: '속도 올려줘', prompt: '속도 올려줘' },
    { icon: '🎨', label: '네온 테마 적용해줘', prompt: '네온 테마 적용해줘' },
  ];
}
