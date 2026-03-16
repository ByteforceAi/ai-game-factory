'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DEMO_GAMES, DemoGame } from '@/lib/demoGames';
import { matchPromptToGame, MatchResult } from '@/lib/promptMatcher';
import { playSelect, playPing, playComplete, playWhoosh, playTick } from '@/lib/sounds';
import ParticleBackground from './ParticleBackground';

/* ──────────────────────────────────────────────
   Chip suggestions — quick-select presets
   ────────────────────────────────────────────── */
const CHIPS = [
  { label: '우주 슈팅게임', prompt: '우주에서 적을 쏘는 네온 슈팅게임', color: '#00FFFF' },
  { label: '네온 플랫포머', prompt: '점프하고 벽타는 네온 러너 게임', color: '#FF00FF' },
  { label: '3D 러너', prompt: '3D 장애물 피하는 템플 러너', color: '#00CCFF' },
  { label: '테트리스', prompt: '클래식 테트리스 게임', color: '#B400FF' },
  { label: '이모지 캐치', prompt: '떨어지는 이모지 받기 게임', color: '#FF6B6B' },
  { label: '도트 RPG', prompt: '일랜시아 감성 도트 RPG 마을 탐험', color: '#FFD700' },
];

interface PromptTerminalProps {
  onComplete: (game: DemoGame) => void;
}

/* ──────────────────────────────────────────────
   Modifier options — reused from before
   ────────────────────────────────────────────── */
interface ModOption { value: string; label: string; color: string }
interface ModifierSlot {
  id: string;
  label: string;
  icon: string;
  question: string;
  options: ModOption[];
}

const MODIFIER_SLOTS: ModifierSlot[] = [
  {
    id: 'difficulty',
    label: '난이도',
    icon: '⚡',
    question: '난이도를 골라주세요! 얼마나 빡센 걸 원하나요?',
    options: [
      { value: 'easy', label: '이지', color: '#4ade80' },
      { value: 'normal', label: '노멀', color: '#60a5fa' },
      { value: 'hard', label: '하드', color: '#f97316' },
      { value: 'nightmare', label: '나이트메어', color: '#ef4444' },
    ],
  },
  {
    id: 'style',
    label: '비주얼',
    icon: '🎨',
    question: '비주얼 스타일을 선택해주세요!',
    options: [
      { value: 'neon', label: '네온', color: '#00FFFF' },
      { value: 'retro', label: '레트로', color: '#FFD700' },
      { value: 'minimal', label: '미니멀', color: '#94a3b8' },
      { value: 'cyber', label: '사이버펑크', color: '#FF00FF' },
    ],
  },
  {
    id: 'effect',
    label: '특수효과',
    icon: '✨',
    question: '마지막! 어떤 특수효과를 넣을까요?',
    options: [
      { value: 'particle', label: '파티클', color: '#a78bfa' },
      { value: 'shake', label: '화면흔들림', color: '#fb923c' },
      { value: 'combo', label: '콤보 시스템', color: '#f43f5e' },
      { value: 'slowmo', label: '슬로우모션', color: '#22d3ee' },
    ],
  },
];

/** AI reaction messages for each modifier choice */
const AI_REACTIONS: Record<string, Record<string, string>> = {
  difficulty: {
    easy: '편하게 즐기는 스타일이군요! 😊 가볍게 시작해봐요',
    normal: '균형 잡힌 선택! 👍 적당한 도전감이 최고죠',
    hard: '오 도전적이네요! 🔥 각오 단단히 하세요',
    nightmare: '진짜요?! 😱 나이트메어... 존경합니다',
  },
  style: {
    neon: '네온 감성 좋죠! ✨ 사이버 시티 느낌으로 갑니다',
    retro: '레트로 감성! 🕹️ 90년대 오락실 느낌 나게 해볼게요',
    minimal: '깔끔함의 미학! 🤍 군더더기 없이 갑니다',
    cyber: '사이버펑크! 💜 미래 도시 분위기 제대로 넣을게요',
  },
  effect: {
    particle: '파티클 뿌려줄게요! 💫 화면이 화려해질 거예요',
    shake: '화면 흔들림! 💥 타격감이 확 올라갈 거예요',
    combo: '콤보 시스템! 🎯 연속 히트 쾌감을 느껴보세요',
    slowmo: '슬로우모션! ⏳ 매트릭스처럼 시간이 느려져요',
  },
};

/* ──────────────────────────────────────────────
   Chat message types
   ────────────────────────────────────────────── */
type ChatRole = 'ai' | 'user' | 'system';
interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** 'options' = show clickable option buttons, 'chips' = show game chips, 'input' = text input */
  widget?: 'options' | 'chips' | 'input' | 'analysis';
  options?: ModOption[];
  slotId?: string;
  analysisSteps?: { label: string; value: string }[];
  matchResult?: MatchResult;
  accentColor?: string;
}

/** Step flow: 0=game prompt, 1=difficulty, 2=style, 3=effect, 4=generating */
type Step = 0 | 1 | 2 | 3 | 4;

/* ──────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────── */
export default function PromptTerminal({ onComplete }: PromptTerminalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<Step>(0);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);       // chip typewriter
  const [aiTyping, setAiTyping] = useState(false);        // AI typing indicator
  const [mounted, setMounted] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [accentColor, setAccentColor] = useState('#6366f1');
  const [userPrompt, setUserPrompt] = useState('');
  const [modifierSelections, setModifierSelections] = useState<Record<string, string>>({});
  const [analysisStep, setAnalysisStep] = useState(-1);
  const [analysisDone, setAnalysisDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const msgCounter = useRef(0);

  const nextId = () => `msg-${++msgCounter.current}`;

  /* ── Auto-scroll to bottom ── */
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  /* ── Add AI message with typing delay ── */
  const addAiMessage = useCallback((
    text: string,
    extra?: Partial<ChatMessage>,
    delay = 600,
  ): Promise<void> => {
    return new Promise((resolve) => {
      setAiTyping(true);
      scrollToBottom();
      setTimeout(() => {
        setAiTyping(false);
        setMessages(prev => [...prev, { id: nextId(), role: 'ai', text, ...extra }]);
        scrollToBottom();
        resolve();
      }, delay);
    });
  }, [scrollToBottom]);

  /* ── Add user message (instant) ── */
  const addUserMessage = useCallback((text: string) => {
    playSelect();
    setMessages(prev => [...prev, { id: nextId(), role: 'user', text }]);
    scrollToBottom();
  }, [scrollToBottom]);

  /* ── Mount: kick off step 0 ── */
  useEffect(() => {
    setMounted(true);
    const t = setTimeout(async () => {
      await addAiMessage('안녕하세요! 어떤 게임을 만들어볼까요? 🎮', {
        widget: 'input',
      }, 800);
      // Show chips after the input message
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: nextId(),
          role: 'ai',
          text: '아래에서 골라도 좋고, 직접 입력해도 돼요!',
          widget: 'chips',
        }]);
        scrollToBottom();
      }, 400);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Handle game prompt submit (step 0 → 1) ── */
  const handlePromptSubmit = useCallback(async (prompt: string, chipColor?: string) => {
    if (!prompt.trim() || step !== 0) return;

    const result = matchPromptToGame(prompt);
    setMatchResult(result);
    setUserPrompt(prompt.trim());
    setAccentColor(chipColor || '#6366f1');

    addUserMessage(prompt.trim());
    setInputValue('');
    setStep(1);

    // AI reacts with the matched game info
    const game = DEMO_GAMES.find(g => g.id === result.gameId);
    const gameName = game?.title || '게임';

    await addAiMessage(
      `"${prompt.trim().slice(0, 30)}${prompt.trim().length > 30 ? '...' : ''}" → ${gameName}(으)로 매칭했어요! (신뢰도 ${result.confidence}%)`,
      undefined,
      700,
    );

    // Ask difficulty
    const slot = MODIFIER_SLOTS[0];
    await addAiMessage(
      `${slot.icon} ${slot.question}`,
      { widget: 'options', options: slot.options, slotId: slot.id },
      500,
    );
  }, [step, addUserMessage, addAiMessage]);

  /* ── Handle modifier option select ── */
  const handleOptionSelect = useCallback(async (slotId: string, opt: ModOption) => {
    playTick();
    if (navigator.vibrate) navigator.vibrate(15);

    const newSelections = { ...modifierSelections, [slotId]: opt.value };
    setModifierSelections(newSelections);

    // User bubble
    addUserMessage(opt.label);

    // AI reaction
    const reaction = AI_REACTIONS[slotId]?.[opt.value];
    if (reaction) {
      await addAiMessage(reaction, undefined, 500);
    }

    // Determine next step
    const currentSlotIndex = MODIFIER_SLOTS.findIndex(s => s.id === slotId);
    const nextSlotIndex = currentSlotIndex + 1;

    if (nextSlotIndex < MODIFIER_SLOTS.length) {
      // More modifiers to ask
      const nextSlot = MODIFIER_SLOTS[nextSlotIndex];
      setStep((nextSlotIndex + 1) as Step);
      await addAiMessage(
        `${nextSlot.icon} ${nextSlot.question}`,
        { widget: 'options', options: nextSlot.options, slotId: nextSlot.id },
        500,
      );
    } else {
      // All modifiers done → step 4 (analyzing)
      setStep(4);
      playComplete();

      await addAiMessage('완벽해요! 모든 설정이 끝났어요 🎉', undefined, 600);

      // Build analysis steps and start generation
      if (matchResult) {
        const steps = buildAnalysisSteps(matchResult, userPrompt);
        await addAiMessage(
          '바이브 코딩을 시작할게요... 잠시만요!',
          {
            widget: 'analysis',
            analysisSteps: steps,
            matchResult: matchResult,
            accentColor: accentColor,
          },
          500,
        );
        // Trigger analysis animation
        startAnalysis();
      }
    }
  }, [modifierSelections, matchResult, userPrompt, accentColor, addUserMessage, addAiMessage]);

  /* ── Analysis animation (step 4) ── */
  const startAnalysis = useCallback(() => {
    if (!matchResult) return;
    const steps = buildAnalysisSteps(matchResult, userPrompt);
    setAnalysisStep(-1);
    setAnalysisDone(false);

    let current = -1;
    const startTimer = setTimeout(() => {
      current = 0;
      setAnalysisStep(0);
      playPing();
    }, 500);

    const iv = setInterval(() => {
      current++;
      if (current >= steps.length) {
        clearInterval(iv);
        setAnalysisDone(true);
        playComplete();
        setTimeout(() => {
          playWhoosh();
          const game = DEMO_GAMES.find(g => g.id === matchResult.gameId);
          if (game) onComplete(game);
        }, 1200);
      } else {
        setAnalysisStep(current);
        playPing();
      }
    }, 550);

    return () => {
      clearTimeout(startTimer);
      clearInterval(iv);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchResult, userPrompt, onComplete]);

  /* ── Chip typewriter click ── */
  const handleChipClick = useCallback((chip: typeof CHIPS[0]) => {
    if (isTyping || step !== 0) return;
    setIsTyping(true);
    setInputValue('');

    typingTimerRef.current.forEach(t => clearTimeout(t));
    typingTimerRef.current = [];

    const chars = chip.prompt.split('');
    chars.forEach((_, i) => {
      const timer = setTimeout(() => {
        setInputValue(chip.prompt.slice(0, i + 1));
        if (i % 2 === 0) playTick();
      }, i * 35);
      typingTimerRef.current.push(timer);
    });

    const submitTimer = setTimeout(() => {
      setIsTyping(false);
      handlePromptSubmit(chip.prompt, chip.color);
    }, chars.length * 35 + 400);
    typingTimerRef.current.push(submitTimer);
  }, [handlePromptSubmit, isTyping, step]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handlePromptSubmit(inputValue);
    }
  }, [inputValue, handlePromptSubmit]);

  /* ── Build analysis steps for display ── */
  const getAnalysisData = useCallback(() => {
    if (!matchResult) return { steps: [], progress: 0 };
    const steps = buildAnalysisSteps(matchResult, userPrompt);
    const progress = steps.length > 0
      ? Math.min(100, Math.round(((analysisStep + 1) / steps.length) * 100))
      : 0;
    return { steps, progress };
  }, [matchResult, userPrompt, analysisStep]);

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <ParticleBackground />

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '520px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        height: 'min(85dvh, 700px)',
      }}>

        {/* ═══════════════ Title ═══════════════ */}
        <div style={{ textAlign: 'center', marginBottom: '16px', flexShrink: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '10px',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '7px',
              fontWeight: 600,
              letterSpacing: '0.15em',
              padding: '2px 8px',
              borderRadius: '100px',
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.25)',
              color: '#a5b4fc',
            }}>
              CLOSED BETA
            </span>
            <span className="mono-xs" style={{
              fontSize: '8px',
              color: 'var(--ai-cyan)',
              letterSpacing: '0.15em',
            }}>
              NEURAL ENGINE v4.0
            </span>
          </div>
          <h1 style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 'clamp(20px, 4.5vw, 28px)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            margin: 0,
            lineHeight: 1.2,
          }}>
            <span className="text-glow-indigo">VIBE CODING</span>
            {' '}
            <span style={{ color: 'var(--text-body)', fontSize: '0.55em', letterSpacing: '0.18em' }}>
              SIMULATOR
            </span>
          </h1>
          <div className="shimmer-line" style={{ width: '80px', margin: '10px auto 0' }} />
        </div>

        {/* ═══════════════ Chat Card ═══════════════ */}
        <div className="card-cinematic" style={{
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 16px 64px rgba(99,102,241,0.1), 0 0 100px rgba(0,0,0,0.5)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}>
          {/* Terminal Header Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid var(--border-dim)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            </div>
            <span className="mono-xs" style={{ fontSize: '9px', color: 'var(--text-muted)', flex: 1, textAlign: 'center' }}>
              vibe-coding-ai — chat
            </span>
            <span className="status-dot-green" />
          </div>

          {/* ═══ Chat Messages Area ═══ */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              scrollBehavior: 'smooth',
            }}
          >
            {messages.map((msg) => (
              <div key={msg.id}>
                {/* ── Message Bubble ── */}
                {msg.role === 'ai' ? (
                  <AiBubble text={msg.text} />
                ) : msg.role === 'user' ? (
                  <UserBubble text={msg.text} />
                ) : null}

                {/* ── Widget: text input ── */}
                {msg.widget === 'input' && step === 0 && (
                  <div style={{
                    marginTop: '10px',
                    animation: 'chatFadeIn 0.3s ease both',
                  }}>
                    <div style={{
                      position: 'relative',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      border: '1px solid var(--border-dim)',
                    }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--ai-indigo)', fontWeight: 700, fontSize: '14px' }}>{'>'}</span>
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputValue}
                          onChange={(e) => !isTyping && setInputValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="만들고 싶은 게임을 설명하세요..."
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          readOnly={isTyping}
                          style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: isTyping ? 'var(--ai-cyan)' : 'var(--text-bright)',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '13px',
                            lineHeight: '20px',
                            padding: 0,
                            caretColor: isTyping ? 'transparent' : 'var(--ai-indigo)',
                          }}
                        />
                        {isTyping && (
                          <span style={{
                            display: 'inline-block',
                            width: '2px',
                            height: '16px',
                            background: 'var(--ai-cyan)',
                            animation: 'blink 0.4s infinite',
                            borderRadius: '1px',
                            boxShadow: '0 0 6px rgba(6,182,212,0.6)',
                            flexShrink: 0,
                          }} />
                        )}
                        {inputValue.trim() && !isTyping && (
                          <button
                            onClick={() => handlePromptSubmit(inputValue)}
                            style={{
                              background: 'linear-gradient(135deg, var(--ai-indigo), var(--ai-violet))',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 14px',
                              color: '#fff',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              letterSpacing: '0.08em',
                              whiteSpace: 'nowrap',
                              minHeight: '34px',
                            }}
                          >
                            ENTER ↵
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Widget: chip suggestions ── */}
                {msg.widget === 'chips' && step === 0 && (
                  <div style={{
                    marginTop: '8px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    animation: 'chatFadeIn 0.5s ease both',
                  }}>
                    {CHIPS.map((chip, i) => (
                      <button
                        key={chip.label}
                        onClick={() => handleChipClick(chip)}
                        className="chip-select chip-touch"
                        style={{
                          animation: `chatFadeIn 0.4s ease ${i * 0.06}s both`,
                          ['--chip-color' as string]: chip.color,
                        }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Widget: modifier options ── */}
                {msg.widget === 'options' && msg.options && msg.slotId && (
                  <OptionButtons
                    options={msg.options}
                    slotId={msg.slotId}
                    selected={modifierSelections[msg.slotId]}
                    onSelect={handleOptionSelect}
                    disabled={!!modifierSelections[msg.slotId]}
                  />
                )}

                {/* ── Widget: analysis HUD ── */}
                {msg.widget === 'analysis' && matchResult && (
                  <AnalysisHud
                    matchResult={matchResult}
                    accentColor={accentColor}
                    analysisStep={analysisStep}
                    analysisDone={analysisDone}
                    getAnalysisData={getAnalysisData}
                  />
                )}
              </div>
            ))}

            {/* ── AI Typing Indicator ── */}
            {aiTyping && <TypingIndicator />}
          </div>
        </div>

        {/* ═══════════════ Footer ═══════════════ */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          marginTop: '16px',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            {[
              { label: 'ONLINE', dot: 'status-dot-green', color: 'var(--ai-emerald)' },
              { label: 'PHASER.JS', dot: '', color: 'var(--text-dim)' },
              { label: 'THREE.JS', dot: '', color: 'var(--text-dim)' },
              { label: 'WEBGL 2.0', dot: '', color: 'var(--text-dim)' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 9px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-dim)',
                borderRadius: '100px',
              }}>
                {item.dot && <span className={item.dot} />}
                <span className="mono-xs" style={{ fontSize: '7px', color: item.color }}>{item.label}</span>
              </div>
            ))}
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '7px',
            color: 'rgba(255,255,255,0.1)',
            letterSpacing: '0.1em',
          }}>
            AI GAME FACTORY — PROTOTYPE v0.4.0 — NOT FOR DISTRIBUTION
          </span>
        </div>
      </div>

      {/* ═══ Injected CSS for chat animations ═══ */}
      <style>{`
        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════ */

/** AI chat bubble — left aligned */
function AiBubble({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-start',
      animation: 'chatFadeIn 0.3s ease both',
    }}>
      <div style={{
        width: '26px',
        height: '26px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, var(--ai-indigo), var(--ai-violet))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
        boxShadow: '0 0 12px rgba(99,102,241,0.25)',
      }}>
        AI
      </div>
      <div style={{
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: '0 16px 16px 16px',
        padding: '10px 14px',
        fontSize: '13px',
        color: 'var(--text-body)',
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: 1.6,
        maxWidth: '85%',
      }}>
        {text}
      </div>
    </div>
  );
}

/** User chat bubble — right aligned */
function UserBubble({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      animation: 'chatFadeIn 0.3s ease both',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '16px 0 16px 16px',
        padding: '10px 14px',
        fontSize: '13px',
        color: 'var(--text-bright)',
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: 1.6,
        maxWidth: '80%',
      }}>
        {text}
      </div>
    </div>
  );
}

/** Typing indicator dots */
function TypingIndicator() {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-start',
      animation: 'chatFadeIn 0.2s ease both',
    }}>
      <div style={{
        width: '26px',
        height: '26px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, var(--ai-indigo), var(--ai-violet))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
      }}>
        AI
      </div>
      <div style={{
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.12)',
        borderRadius: '0 16px 16px 16px',
        padding: '12px 18px',
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--ai-indigo)',
              opacity: 0.6,
              animation: `dotBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Option buttons for modifier selection */
function OptionButtons({
  options,
  slotId,
  selected,
  onSelect,
  disabled,
}: {
  options: ModOption[];
  slotId: string;
  selected?: string;
  onSelect: (slotId: string, opt: ModOption) => void;
  disabled: boolean;
}) {
  return (
    <div style={{
      marginTop: '10px',
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      marginLeft: '34px', // aligned under AI bubble text
      animation: 'chatFadeIn 0.4s ease both',
    }}>
      {options.map((opt, i) => {
        const isSelected = selected === opt.value;
        const isOther = selected && !isSelected;
        return (
          <button
            key={opt.value}
            onClick={() => !disabled && onSelect(slotId, opt)}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: `1px solid ${isSelected ? opt.color + '80' : 'var(--border-dim)'}`,
              background: isSelected ? opt.color + '20' : 'rgba(255,255,255,0.03)',
              color: isSelected ? opt.color : isOther ? 'var(--text-dim)' : 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              fontWeight: isSelected ? 600 : 400,
              cursor: disabled ? 'default' : 'pointer',
              transition: 'all 0.2s ease-out',
              transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              opacity: isOther ? 0.4 : 1,
              animation: `chatFadeIn 0.3s ease ${i * 0.06}s both`,
              minHeight: '36px',
              boxShadow: isSelected ? `0 0 12px ${opt.color}20` : 'none',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Analysis HUD — shows real-time code generation progress */
function AnalysisHud({
  matchResult,
  accentColor,
  analysisStep,
  analysisDone,
  getAnalysisData,
}: {
  matchResult: MatchResult;
  accentColor: string;
  analysisStep: number;
  analysisDone: boolean;
  getAnalysisData: () => { steps: { label: string; value: string }[]; progress: number };
}) {
  const { steps, progress } = getAnalysisData();

  return (
    <div style={{
      marginTop: '10px',
      marginLeft: '34px',
      animation: 'chatFadeIn 0.4s ease both',
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.25)',
        borderRadius: '12px',
        border: '1px solid var(--border-dim)',
        padding: '14px 16px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          paddingBottom: '10px',
          borderBottom: '1px solid var(--border-dim)',
        }}>
          <span className="mono-xs" style={{ fontSize: '9px', color: 'var(--ai-cyan)', letterSpacing: '0.15em' }}>
            AI ANALYSIS — {matchResult.confidence}% MATCH
          </span>
          <span className="mono-xs" style={{
            fontSize: '9px',
            color: analysisDone ? 'var(--ai-emerald)' : 'var(--text-muted)',
          }}>
            {analysisDone ? 'COMPLETE' : `${progress}%`}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '2px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '1px',
          overflow: 'hidden',
          marginBottom: '14px',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: analysisDone
              ? 'linear-gradient(90deg, var(--ai-emerald), #4ade80)'
              : `linear-gradient(90deg, var(--ai-indigo), ${accentColor})`,
            borderRadius: '1px',
            transition: 'width 0.4s ease, background 0.3s',
            boxShadow: analysisDone
              ? '0 0 8px rgba(16,185,129,0.4)'
              : `0 0 8px ${accentColor}30`,
          }} />
        </div>

        {/* Step rows */}
        {steps.map((s, i) => {
          const isActive = i <= analysisStep;
          const isCurrent = i === analysisStep && !analysisDone;
          return (
            <div
              key={s.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '5px 0',
                opacity: isActive ? 1 : 0.2,
                transform: isActive ? 'translateX(0)' : 'translateX(-8px)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isActive ? (
                  isCurrent ? (
                    <div style={{
                      width: '12px', height: '12px',
                      border: `2px solid ${accentColor}`,
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      flexShrink: 0,
                    }} />
                  ) : (
                    <div style={{
                      width: '12px', height: '12px',
                      borderRadius: '50%',
                      background: `${accentColor}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '7px', color: accentColor, flexShrink: 0,
                    }}>✓</div>
                  )
                ) : (
                  <div style={{
                    width: '12px', height: '12px',
                    borderRadius: '50%',
                    border: '1px solid var(--border-dim)',
                    flexShrink: 0,
                  }} />
                )}
                <span style={{
                  fontSize: '10px',
                  color: isActive ? 'var(--text-body)' : 'var(--text-muted)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {s.label}
                </span>
              </div>
              <span style={{
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace",
                color: isActive ? accentColor : 'var(--text-muted)',
                textShadow: isActive ? `0 0 8px ${accentColor}30` : 'none',
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.3s 0.2s',
                textAlign: 'right',
                maxWidth: '50%',
              }}>
                {s.value}
              </span>
            </div>
          );
        })}

        {/* Launch message */}
        {analysisDone && (
          <div style={{
            textAlign: 'center',
            marginTop: '12px',
            animation: 'chatFadeIn 0.4s ease both',
          }}>
            <span className="mono-xs" style={{
              fontSize: '10px',
              color: 'var(--ai-emerald)',
              letterSpacing: '0.15em',
            }}>
              CODE GENERATION STARTING...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Build analysis steps dynamically from match result ── */
function buildAnalysisSteps(result: MatchResult, userPrompt: string): { label: string; value: string }[] {
  const game = DEMO_GAMES.find(g => g.id === result.gameId);
  const loc = game ? game.html.split('\n').length : 500;
  return [
    { label: '프롬프트 분석', value: `"${userPrompt.slice(0, 20)}${userPrompt.length > 20 ? '...' : ''}"` },
    { label: '장르 감지', value: result.genre },
    { label: '엔진 선택', value: result.engine },
    { label: '아트 스타일', value: result.artStyle },
    { label: '게임 시스템', value: result.systems },
    { label: '렌더링', value: 'WebGL 2.0 + Canvas Fallback' },
    { label: '예상 코드량', value: `~${loc} Lines of Code` },
  ];
}
