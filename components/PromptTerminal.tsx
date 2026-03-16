'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DEMO_GAMES, DemoGame } from '@/lib/demoGames';
import { matchPromptToGame, MatchResult } from '@/lib/promptMatcher';
import { playSelect, playPing, playComplete, playWhoosh, playTick } from '@/lib/sounds';

/* ──────────────────────────────────────────────
   Chip suggestions — quick-select presets
   ────────────────────────────────────────────── */
const CHIPS = [
  { label: '우주 슈팅게임', prompt: '우주에서 적을 쏘는 네온 슈팅게임', icon: '🚀' },
  { label: '네온 플랫포머', prompt: '점프하고 벽타는 네온 러너 게임', icon: '🏃' },
  { label: '3D 러너', prompt: '3D 장애물 피하는 템플 러너', icon: '🏛️' },
  { label: '테트리스', prompt: '클래식 테트리스 게임', icon: '🧩' },
  { label: '이모지 캐치', prompt: '떨어지는 이모지 받기 게임', icon: '🎯' },
  { label: '도트 RPG', prompt: '일랜시아 감성 도트 RPG 마을 탐험', icon: '⚔️' },
];

interface PromptTerminalProps {
  onComplete: (game: DemoGame) => void;
}

/* ──────────────────────────────────────────────
   Modifier options
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
      { value: 'easy', label: '이지', color: '#22c55e' },
      { value: 'normal', label: '노멀', color: '#3b82f6' },
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
      { value: 'neon', label: '네온', color: '#06b6d4' },
      { value: 'retro', label: '레트로', color: '#eab308' },
      { value: 'minimal', label: '미니멀', color: '#6b7280' },
      { value: 'cyber', label: '사이버펑크', color: '#a855f7' },
    ],
  },
  {
    id: 'effect',
    label: '특수효과',
    icon: '✨',
    question: '마지막! 어떤 특수효과를 넣을까요?',
    options: [
      { value: 'particle', label: '파티클', color: '#8b5cf6' },
      { value: 'shake', label: '화면흔들림', color: '#f97316' },
      { value: 'combo', label: '콤보 시스템', color: '#ef4444' },
      { value: 'slowmo', label: '슬로우모션', color: '#06b6d4' },
    ],
  },
];

/** AI reaction messages */
const AI_REACTIONS: Record<string, Record<string, string>> = {
  difficulty: {
    easy: '편하게 즐기는 스타일이군요! 가볍게 시작해봐요 🌱',
    normal: '균형 잡힌 선택! 적당한 도전감이 최고죠 👍',
    hard: '오 도전적이네요! 각오 단단히 하세요 🔥',
    nightmare: '진짜요?! 나이트메어... 존경합니다 💀',
  },
  style: {
    neon: '네온 감성 좋죠! 사이버 시티 느낌으로 갑니다 ✨',
    retro: '레트로 감성! 90년대 오락실 느낌 나게 해볼게요 🕹️',
    minimal: '깔끔함의 미학! 군더더기 없이 갑니다 🤍',
    cyber: '사이버펑크! 미래 도시 분위기 제대로 넣을게요 🌃',
  },
  effect: {
    particle: '파티클 뿌려줄게요! 화면이 화려해질 거예요 💫',
    shake: '화면 흔들림! 타격감이 확 올라갈 거예요 💥',
    combo: '콤보 시스템! 연속 히트 쾌감을 느껴보세요 🎯',
    slowmo: '슬로우모션! 매트릭스처럼 시간이 느려져요 ⏳',
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
  widget?: 'options' | 'chips' | 'input' | 'analysis';
  options?: ModOption[];
  slotId?: string;
  analysisSteps?: { label: string; value: string }[];
  matchResult?: MatchResult;
  accentColor?: string;
}

type Step = 0 | 1 | 2 | 3 | 4;

/* ──────────────────────────────────────────────
   Light theme color tokens
   ────────────────────────────────────────────── */
const T = {
  bg: 'linear-gradient(135deg, #e0f7fa 0%, #e8f5e9 40%, #f3e5f5 100%)',
  card: 'rgba(255,255,255,0.85)',
  cardBorder: 'rgba(0,0,0,0.08)',
  cardShadow: '0 8px 32px rgba(0,0,0,0.08)',
  aiBubbleBg: '#f0fdf4',
  aiBubbleBorder: '#bbf7d0',
  userBubbleBg: '#eff6ff',
  userBubbleBorder: '#bfdbfe',
  textPrimary: '#1a1a1a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  chipBg: '#ffffff',
  chipBorder: '#e2e8f0',
  chipHoverBorder: '#818cf8',
  chipHoverBg: '#f5f3ff',
  chipSelectedBg: '#818cf8',
  inputBg: '#ffffff',
  inputBorder: '#e2e8f0',
  accent: '#6366f1',
  accentLight: '#818cf8',
  accentGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  badgeBg: '#ddd6fe',
  badgeText: '#5b21b6',
  aiIconBg: '#22c55e',
  headerBar: 'rgba(255,255,255,0.6)',
  headerBorder: 'rgba(0,0,0,0.06)',
  footerBadgeBg: '#f1f5f9',
  footerBadgeBorder: '#e2e8f0',
  footerBadgeText: '#64748b',
};

/* ──────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────── */
export default function PromptTerminal({ onComplete }: PromptTerminalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<Step>(0);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
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

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

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

  /* ── Handle game prompt submit ── */
  const handlePromptSubmit = useCallback(async (prompt: string) => {
    if (!prompt.trim() || step !== 0) return;

    const result = matchPromptToGame(prompt);
    setMatchResult(result);
    setUserPrompt(prompt.trim());
    setAccentColor('#6366f1');

    addUserMessage(prompt.trim());
    setInputValue('');
    setStep(1);

    const game = DEMO_GAMES.find(g => g.id === result.gameId);
    const gameName = game?.title || '게임';

    await addAiMessage(
      `"${prompt.trim().slice(0, 30)}${prompt.trim().length > 30 ? '...' : ''}" → ${gameName}(으)로 매칭했어요! (신뢰도 ${result.confidence}%)`,
      undefined, 700,
    );

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

    addUserMessage(opt.label);

    const reaction = AI_REACTIONS[slotId]?.[opt.value];
    if (reaction) {
      await addAiMessage(reaction, undefined, 500);
    }

    const currentSlotIndex = MODIFIER_SLOTS.findIndex(s => s.id === slotId);
    const nextSlotIndex = currentSlotIndex + 1;

    if (nextSlotIndex < MODIFIER_SLOTS.length) {
      const nextSlot = MODIFIER_SLOTS[nextSlotIndex];
      setStep((nextSlotIndex + 1) as Step);
      await addAiMessage(
        `${nextSlot.icon} ${nextSlot.question}`,
        { widget: 'options', options: nextSlot.options, slotId: nextSlot.id },
        500,
      );
    } else {
      setStep(4);
      playComplete();

      await addAiMessage('완벽해요! 모든 설정이 끝났어요 🎉', undefined, 600);

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
        startAnalysis();
      }
    }
  }, [modifierSelections, matchResult, userPrompt, accentColor, addUserMessage, addAiMessage]);

  /* ── Analysis animation ── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [matchResult, userPrompt, onComplete]);

  /* ── Chip typewriter ── */
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
      handlePromptSubmit(chip.prompt);
    }, chars.length * 35 + 400);
    typingTimerRef.current.push(submitTimer);
  }, [handlePromptSubmit, isTyping, step]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handlePromptSubmit(inputValue);
    }
  }, [inputValue, handlePromptSubmit]);

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
      background: T.bg,
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
    }}>

      {/* ═══ Soft floating orbs (replaces ParticleBackground) ═══ */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[
          { size: 300, x: '10%', y: '20%', color: 'rgba(167,139,250,0.15)', dur: '20s', delay: '0s' },
          { size: 250, x: '70%', y: '10%', color: 'rgba(96,165,250,0.12)', dur: '25s', delay: '-5s' },
          { size: 350, x: '50%', y: '70%', color: 'rgba(52,211,153,0.10)', dur: '22s', delay: '-10s' },
          { size: 200, x: '85%', y: '60%', color: 'rgba(244,114,182,0.10)', dur: '18s', delay: '-8s' },
          { size: 280, x: '25%', y: '80%', color: 'rgba(99,102,241,0.08)', dur: '28s', delay: '-3s' },
        ].map((orb, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            borderRadius: '50%',
            background: orb.color,
            filter: 'blur(80px)',
            animation: `orbFloat ${orb.dur} ease-in-out ${orb.delay} infinite`,
            willChange: 'transform',
          }} />
        ))}
      </div>

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
              background: T.badgeBg,
              border: 'none',
              color: T.badgeText,
            }}>
              CLOSED BETA
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '8px',
              color: T.textMuted,
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
            <span style={{
              background: T.accentGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>VIBE CODING</span>
            {' '}
            <span style={{ color: T.textSecondary, fontSize: '0.55em', letterSpacing: '0.18em' }}>
              WORKSHOP
            </span>
          </h1>
          <div style={{
            width: '80px',
            height: '2px',
            margin: '10px auto 0',
            background: 'linear-gradient(90deg, transparent, #818cf8, transparent)',
            borderRadius: '1px',
          }} />
        </div>

        {/* ═══════════════ Chat Card ═══════════════ */}
        <div style={{
          padding: 0,
          overflow: 'hidden',
          background: T.card,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: `1px solid ${T.cardBorder}`,
          boxShadow: T.cardShadow,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}>
          {/* Header Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: T.headerBar,
            borderBottom: `1px solid ${T.headerBorder}`,
            flexShrink: 0,
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: T.textMuted,
              flex: 1,
              textAlign: 'center',
              letterSpacing: '0.05em',
            }}>
              vibe-coding-ai — workshop
            </span>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 6px rgba(34,197,94,0.4)',
            }} />
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
                {msg.role === 'ai' ? (
                  <AiBubble text={msg.text} />
                ) : msg.role === 'user' ? (
                  <UserBubble text={msg.text} />
                ) : null}

                {/* Widget: text input */}
                {msg.widget === 'input' && step === 0 && (
                  <div style={{
                    marginTop: '10px',
                    animation: 'chatFadeIn 0.3s ease both',
                  }}>
                    <div style={{
                      position: 'relative',
                      background: T.inputBg,
                      borderRadius: '16px',
                      padding: '12px 14px',
                      border: `1.5px solid ${T.inputBorder}`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'border-color 0.2s',
                    }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color: T.accent, fontWeight: 700, fontSize: '14px' }}>{'>'}</span>
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
                            color: isTyping ? T.accent : T.textPrimary,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '13px',
                            lineHeight: '20px',
                            padding: 0,
                            caretColor: T.accent,
                          }}
                        />
                        {isTyping && (
                          <span style={{
                            display: 'inline-block',
                            width: '2px',
                            height: '16px',
                            background: T.accent,
                            animation: 'blink 0.4s infinite',
                            borderRadius: '1px',
                            flexShrink: 0,
                          }} />
                        )}
                        {inputValue.trim() && !isTyping && (
                          <button
                            onClick={() => handlePromptSubmit(inputValue)}
                            style={{
                              background: T.accentGradient,
                              border: 'none',
                              borderRadius: '10px',
                              padding: '8px 14px',
                              color: '#fff',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              letterSpacing: '0.08em',
                              whiteSpace: 'nowrap',
                              minHeight: '34px',
                              boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                              transition: 'transform 0.15s, box-shadow 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.03)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.3)';
                            }}
                          >
                            ENTER ↵
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Widget: chip suggestions */}
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
                        style={{
                          padding: '8px 14px',
                          borderRadius: '12px',
                          border: `1.5px solid ${T.chipBorder}`,
                          background: T.chipBg,
                          color: T.textSecondary,
                          fontFamily: "'Noto Sans KR', sans-serif",
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          animation: `chatFadeIn 0.4s ease ${i * 0.06}s both`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = T.chipHoverBorder;
                          e.currentTarget.style.background = T.chipHoverBg;
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 3px 8px rgba(99,102,241,0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = T.chipBorder;
                          e.currentTarget.style.background = T.chipBg;
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                        }}
                      >
                        <span>{chip.icon}</span>
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Widget: modifier options */}
                {msg.widget === 'options' && msg.options && msg.slotId && (
                  <OptionButtons
                    options={msg.options}
                    slotId={msg.slotId}
                    selected={modifierSelections[msg.slotId]}
                    onSelect={handleOptionSelect}
                    disabled={!!modifierSelections[msg.slotId]}
                  />
                )}

                {/* Widget: analysis HUD */}
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
              { label: 'ONLINE', hasDot: true },
              { label: 'PHASER.JS', hasDot: false },
              { label: 'THREE.JS', hasDot: false },
              { label: 'WEBGL 2.0', hasDot: false },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 9px',
                background: T.footerBadgeBg,
                border: `1px solid ${T.footerBadgeBorder}`,
                borderRadius: '100px',
              }}>
                {item.hasDot && <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 4px rgba(34,197,94,0.4)',
                }} />}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '7px',
                  color: item.hasDot ? '#22c55e' : T.footerBadgeText,
                  letterSpacing: '0.1em',
                }}>{item.label}</span>
              </div>
            ))}
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '7px',
            color: '#cbd5e1',
            letterSpacing: '0.1em',
          }}>
            AI GAME FACTORY — PROTOTYPE v0.4.0
          </span>
        </div>
      </div>

      {/* ═══ CSS Animations ═══ */}
      <style>{`
        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(30px, -20px) scale(1.05); }
          66%      { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulseGreen {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50% { box-shadow: 0 0 0 4px rgba(34,197,94,0); }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Sub-components — Light theme
   ══════════════════════════════════════════════ */

function AiBubble({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-start',
      animation: 'chatFadeIn 0.3s ease both',
    }}>
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '10px',
        background: T.aiIconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '9px',
        fontWeight: 800,
        color: '#fff',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(34,197,94,0.25)',
        letterSpacing: '0.02em',
      }}>
        AI
      </div>
      <div style={{
        background: T.aiBubbleBg,
        border: `1px solid ${T.aiBubbleBorder}`,
        borderRadius: '4px 20px 20px 20px',
        padding: '10px 14px',
        fontSize: '13px',
        color: T.textPrimary,
        fontFamily: "'Noto Sans KR', 'JetBrains Mono', sans-serif",
        lineHeight: 1.6,
        maxWidth: '85%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {text}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      animation: 'chatFadeIn 0.3s ease both',
    }}>
      <div style={{
        background: T.userBubbleBg,
        border: `1px solid ${T.userBubbleBorder}`,
        borderRadius: '20px 4px 20px 20px',
        padding: '10px 14px',
        fontSize: '13px',
        color: T.textPrimary,
        fontFamily: "'Noto Sans KR', 'JetBrains Mono', sans-serif",
        lineHeight: 1.6,
        maxWidth: '80%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-start',
      animation: 'chatFadeIn 0.2s ease both',
    }}>
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '10px',
        background: T.aiIconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '9px',
        fontWeight: 800,
        color: '#fff',
        flexShrink: 0,
      }}>
        AI
      </div>
      <div style={{
        background: T.aiBubbleBg,
        border: `1px solid ${T.aiBubbleBorder}`,
        borderRadius: '4px 20px 20px 20px',
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
              background: '#86efac',
              animation: `dotBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

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
      marginLeft: '36px',
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
              border: `1.5px solid ${isSelected ? opt.color : T.chipBorder}`,
              background: isSelected ? opt.color : T.chipBg,
              color: isSelected ? '#fff' : isOther ? T.textMuted : T.textSecondary,
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: '12px',
              fontWeight: isSelected ? 600 : 500,
              cursor: disabled ? 'default' : 'pointer',
              transition: 'all 0.2s ease-out',
              transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              opacity: isOther ? 0.4 : 1,
              animation: `chatFadeIn 0.3s ease ${i * 0.06}s both`,
              minHeight: '36px',
              boxShadow: isSelected ? `0 3px 10px ${opt.color}40` : '0 1px 2px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={(e) => {
              if (!disabled && !isSelected) {
                e.currentTarget.style.borderColor = opt.color + '80';
                e.currentTarget.style.background = opt.color + '10';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled && !isSelected) {
                e.currentTarget.style.borderColor = T.chipBorder;
                e.currentTarget.style.background = T.chipBg;
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

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
      marginLeft: '36px',
      animation: 'chatFadeIn 0.4s ease both',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: `1px solid ${T.cardBorder}`,
        padding: '14px 16px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          paddingBottom: '10px',
          borderBottom: `1px solid ${T.chipBorder}`,
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: T.accent,
            letterSpacing: '0.15em',
            fontWeight: 600,
          }}>
            AI ANALYSIS — {matchResult.confidence}% MATCH
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: analysisDone ? '#22c55e' : T.textMuted,
            fontWeight: 600,
          }}>
            {analysisDone ? '✓ COMPLETE' : `${progress}%`}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '3px',
          background: '#f1f5f9',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '14px',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: analysisDone
              ? 'linear-gradient(90deg, #22c55e, #4ade80)'
              : T.accentGradient,
            borderRadius: '2px',
            transition: 'width 0.4s ease, background 0.3s',
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
                opacity: isActive ? 1 : 0.3,
                transform: isActive ? 'translateX(0)' : 'translateX(-8px)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isActive ? (
                  isCurrent ? (
                    <div style={{
                      width: '14px', height: '14px',
                      border: `2px solid ${T.accent}`,
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      flexShrink: 0,
                    }} />
                  ) : (
                    <div style={{
                      width: '14px', height: '14px',
                      borderRadius: '50%',
                      background: analysisDone ? '#dcfce7' : '#ede9fe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '8px', color: analysisDone ? '#22c55e' : T.accent,
                      flexShrink: 0,
                      fontWeight: 700,
                    }}>✓</div>
                  )
                ) : (
                  <div style={{
                    width: '14px', height: '14px',
                    borderRadius: '50%',
                    border: `1.5px solid ${T.chipBorder}`,
                    flexShrink: 0,
                  }} />
                )}
                <span style={{
                  fontSize: '11px',
                  color: isActive ? T.textPrimary : T.textMuted,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: isActive ? 500 : 400,
                }}>
                  {s.label}
                </span>
              </div>
              <span style={{
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace",
                color: isActive ? T.accent : T.textMuted,
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.3s 0.2s',
                textAlign: 'right',
                maxWidth: '50%',
                fontWeight: 500,
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
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: '#22c55e',
              letterSpacing: '0.15em',
              fontWeight: 600,
            }}>
              CODE GENERATION STARTING...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

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
