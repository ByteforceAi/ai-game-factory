'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DEMO_GAMES, DemoGame } from '@/lib/demoGames';
import { matchPromptToGame, MatchResult } from '@/lib/promptMatcher';
import { playSelect, playComplete, playWhoosh, playTick } from '@/lib/sounds';
import ParticleBackground from './ParticleBackground';

/* ═══════════════════════════════════════════════
   Data — chips, modifiers, reactions
   ═══════════════════════════════════════════════ */
interface ChipItem {
  label: string;
  prompt: string;
  category?: undefined;
}
interface ChipCategory {
  category: string;
  label?: undefined;
  prompt?: undefined;
}
type ChipEntry = ChipItem | ChipCategory;

const CHIPS: ChipEntry[] = [
  { category: '🎮 게임' },
  { label: '🚀 우주 슈팅게임', prompt: '우주에서 적을 쏘는 네온 슈팅게임' },
  { label: '🏃 네온 플랫포머', prompt: '점프하고 벽타는 네온 러너 게임' },
  { label: '🎮 3D 러너', prompt: '3D 장애물 피하는 템플 러너' },
  { label: '🧱 테트리스', prompt: '클래식 테트리스 게임' },
  { label: '😄 이모지 캐치', prompt: '떨어지는 이모지 받기 게임' },
  { label: '⚔️ 도트 RPG', prompt: '픽셀 도트 RPG 마을 탐험과 턴제 전투' },
  { label: '🐱 고양이 점프', prompt: '귀여운 고양이 점프 게임' },
  { label: '🎈 풍선 팝', prompt: '풍선 터뜨리기 타이머 게임' },
  { label: '⭐ 별 모으기', prompt: '밤하늘 별 모으기 게임' },
  { category: '🔬 시뮬레이션' },
  { label: '🌙 달의 공전', prompt: '달의 공전 궤도 시뮬레이션' },
];

interface ModOption { value: string; label: string }

interface ModSlot {
  id: string;
  question: string;
  options: ModOption[];
  hasSkip?: boolean;
}

/* ── Game modifiers ── */
const GAME_MODIFIER_SLOTS: ModSlot[] = [
  {
    id: 'difficulty',
    question: '난이도를 선택해주세요.',
    options: [
      { value: 'easy', label: '😊 이지' },
      { value: 'normal', label: '⚡ 노멀' },
      { value: 'hard', label: '🔥 하드' },
      { value: 'nightmare', label: '💀 나이트메어' },
    ],
  },
  {
    id: 'style',
    question: '비주얼 스타일은요?',
    options: [
      { value: 'neon', label: '💜 네온' },
      { value: 'retro', label: '🕹️ 레트로' },
      { value: 'minimal', label: '⬜ 미니멀' },
      { value: 'cyber', label: '🌃 사이버펑크' },
    ],
  },
  {
    id: 'effect',
    question: '특수효과를 추가할까요?',
    options: [
      { value: 'particle', label: '✨ 파티클' },
      { value: 'shake', label: '📳 화면흔들림' },
      { value: 'combo', label: '🎯 콤보 시스템' },
      { value: 'slowmo', label: '🕐 슬로우모션' },
    ],
    hasSkip: true,
  },
];

/* ── Simulation modifiers ── */
const SIM_MODIFIER_SLOTS: ModSlot[] = [
  {
    id: 'simSpeed',
    question: '시뮬레이션 속도는요?',
    options: [
      { value: 'realtime', label: '🕐 실시간' },
      { value: 'fast', label: '⚡ 고속 (×10)' },
      { value: 'ultra', label: '🚀 초고속 (×100)' },
      { value: 'cinematic', label: '🎬 시네마틱' },
    ],
  },
  {
    id: 'detail',
    question: '디테일 수준을 골라주세요.',
    options: [
      { value: 'minimal', label: '🔵 미니멀' },
      { value: 'standard', label: '🌍 표준' },
      { value: 'rich', label: '✨ 고퀄리티' },
      { value: 'scientific', label: '🔬 과학 모드' },
    ],
  },
  {
    id: 'overlay',
    question: '정보 오버레이를 추가할까요?',
    options: [
      { value: 'hud', label: '📊 데이터 HUD' },
      { value: 'labels', label: '🏷️ 라벨 표시' },
      { value: 'trail', label: '🌀 궤적 표시' },
      { value: 'clean', label: '🖼️ 클린 뷰' },
    ],
    hasSkip: true,
  },
];

/* ── Category detection ── */
const SIMULATION_IDS = new Set(['moon-orbit']);

function getModifierSlots(gameId: string): ModSlot[] {
  return SIMULATION_IDS.has(gameId) ? SIM_MODIFIER_SLOTS : GAME_MODIFIER_SLOTS;
}

const AI_REACTIONS: Record<string, Record<string, string>> = {
  // Game reactions
  difficulty: {
    easy: '좋아요, 편하게 즐기는 걸로.',
    normal: '적당한 도전. 좋은 선택이에요.',
    hard: '도전적이네요. 멋져요.',
    nightmare: '진심이군요. 존경합니다.',
  },
  style: {
    neon: '사이버 시티 분위기로 갈게요.',
    retro: '90년대 감성, 알겠어요.',
    minimal: '깔끔하게. 좋은 취향이에요.',
    cyber: '미래 도시 느낌으로 만들어볼게요.',
  },
  effect: {
    particle: '화면 가득 파티클을 뿌릴게요.',
    shake: '타격감 있는 흔들림, 넣을게요.',
    combo: '연속 히트의 쾌감을 드릴게요.',
    slowmo: '시간이 느려지는 순간을 만들게요.',
    skip: '깔끔하게 기본으로 갈게요.',
  },
  // Simulation reactions
  simSpeed: {
    realtime: '실제 시간 흐름 그대로 보여드릴게요.',
    fast: '빠르게 감아서 변화를 한눈에.',
    ultra: '시간을 압축해서 보여드릴게요.',
    cinematic: '영화 같은 연출로 가볼게요.',
  },
  detail: {
    minimal: '깔끔하게 핵심만 보여드릴게요.',
    standard: '적당한 디테일, 좋은 선택이에요.',
    rich: '풍부한 비주얼, 눈이 즐거울 거예요.',
    scientific: '과학 데이터 중심으로 세팅할게요.',
  },
  overlay: {
    hud: '실시간 데이터를 오버레이 할게요.',
    labels: '주요 요소에 이름표를 달아줄게요.',
    trail: '궤적을 따라가는 라인을 그릴게요.',
    clean: '화면을 깨끗하게. 몰입 모드로.',
    skip: '기본 세팅 그대로 갈게요.',
  },
};

/* ═══════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════ */
interface ChatItem {
  id: string;
  type: 'ai' | 'user' | 'input' | 'chips' | 'options' | 'progress';
  text?: string;
  options?: ModOption[];
  slotId?: string;
  hasSkip?: boolean;
  visible: boolean;
}

interface PromptTerminalProps {
  onComplete: (game: DemoGame) => void;
}

/* ═══════════════════════════════════════════════
   Main Component — GitHub Education bright theme
   ═══════════════════════════════════════════════ */
export default function PromptTerminal({ onComplete }: PromptTerminalProps) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [typingText, setTypingText] = useState('');
  const [typingId, setTypingId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputTyping, setInputTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [frozen, setFrozen] = useState<Set<string>>(new Set());
  const [progressWidth, setProgressWidth] = useState(0);

  const matchRef = useRef<MatchResult | null>(null);
  const promptRef = useRef('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null!);  // eslint-disable-line
  const idCounter = useRef(0);
  const typingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const nid = () => `i-${++idCounter.current}`;

  /* ── Scroll ── */
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
      });
    });
  }, []);

  /* ── Type AI text character by character ── */
  const typeAiText = useCallback((text: string, speed = 60): Promise<string> => {
    return new Promise((resolve) => {
      const id = nid();
      setItems(prev => [...prev, { id, type: 'ai', text: '', visible: true }]);
      setTypingId(id);
      setTypingText('');
      scrollToBottom();

      const chars = Array.from(text);
      let i = 0;
      const iv = setInterval(() => {
        if (i < chars.length) {
          setTypingText(text.slice(0, i + 1));
          i++;
          scrollToBottom();
        } else {
          clearInterval(iv);
          setTypingId(null);
          setTypingText('');
          setItems(prev => prev.map(item =>
            item.id === id ? { ...item, text } : item
          ));
          scrollToBottom();
          resolve(id);
        }
      }, speed);
    });
  }, [scrollToBottom]);

  /* ── Show typing indicator then type ── */
  const aiSpeak = useCallback(async (text: string, pauseBefore = 800, speed = 60): Promise<string> => {
    const thinkId = nid();
    setItems(prev => [...prev, { id: thinkId, type: 'ai', text: '···', visible: true }]);
    scrollToBottom();

    await wait(pauseBefore);

    setItems(prev => prev.filter(item => item.id !== thinkId));
    const id = await typeAiText(text, speed);
    return id;
  }, [typeAiText, scrollToBottom]);

  /* ── Add widget (input, chips, options, progress) ── */
  const addWidget = useCallback((type: ChatItem['type'], extra?: Partial<ChatItem>): string => {
    const id = nid();
    setItems(prev => [...prev, { id, type, visible: true, ...extra }]);
    scrollToBottom();
    return id;
  }, [scrollToBottom]);

  /* ── Add user message ── */
  const addUser = useCallback((text: string) => {
    playSelect();
    const id = nid();
    setItems(prev => [...prev, { id, type: 'user', text, visible: true }]);
    scrollToBottom();
    return id;
  }, [scrollToBottom]);

  /* ── Fade out a widget ── */
  const fadeOut = useCallback((id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, visible: false } : item
    ));
  }, []);

  /* ── Freeze options (mark as selected) ── */
  const freeze = useCallback((id: string) => {
    setFrozen(prev => new Set(prev).add(id));
  }, []);

  /* ═══════ Step Flow ═══════ */
  const runFlow = useCallback(async () => {
    await wait(500);
    await aiSpeak('무엇을 바이브 코딩해볼까요?', 0, 60);
    await wait(800);

    const inputId = addWidget('input');
    const chipsId = addWidget('chips');

    const prompt = await waitForGamePrompt();

    fadeOut(inputId);
    fadeOut(chipsId);
    await wait(300);

    const game = DEMO_GAMES.find(g => g.id === matchRef.current?.gameId);
    const gameName = game?.title || '프로젝트';
    const gameId = matchRef.current?.gameId || '';
    const isSim = SIMULATION_IDS.has(gameId);
    await wait(1200);
    await aiSpeak(
      isSim ? `${gameName} 시뮬레이션, 흥미로운 선택이에요.` : `${gameName}, 좋은 선택이에요.`,
      800, 60
    );

    const slots = getModifierSlots(gameId);
    for (let si = 0; si < slots.length; si++) {
      const slot = slots[si];
      await wait(1000);
      await aiSpeak(slot.question, 800, 60);
      await wait(600);

      const optId = addWidget('options', {
        options: slot.options,
        slotId: slot.id,
        hasSkip: slot.hasSkip,
      });

      const choice = await waitForOption(slot.id);
      freeze(optId);
      await wait(300);
      fadeOut(optId);
      await wait(300);

      const reaction = AI_REACTIONS[slot.id]?.[choice];
      if (reaction) {
        await wait(1000);
        await aiSpeak(reaction, 800, 60);
      }
    }

    await wait(1500);
    await aiSpeak('완벽해요. 지금 만들어볼게요.', 800, 80);
    await wait(500);

    const progId = addWidget('progress');
    playComplete();

    await animateProgress();

    await wait(300);
    playWhoosh();
    if (game) onComplete(game);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Promise-based waiters ── */
  const gamePromptResolver = useRef<((prompt: string) => void) | null>(null);
  const optionResolver = useRef<((value: string) => void) | null>(null);

  const waitForGamePrompt = (): Promise<string> => {
    return new Promise(resolve => { gamePromptResolver.current = resolve; });
  };
  const waitForOption = (slotId: string): Promise<string> => {
    return new Promise(resolve => { optionResolver.current = resolve; });
  };

  /* ── Handlers ── */
  const handlePromptSubmit = useCallback((prompt: string) => {
    if (!prompt.trim()) return;
    const result = matchPromptToGame(prompt);
    matchRef.current = result;
    promptRef.current = prompt.trim();
    addUser(prompt.trim());
    setInputValue('');
    if (gamePromptResolver.current) {
      gamePromptResolver.current(prompt.trim());
      gamePromptResolver.current = null;
    }
  }, [addUser]);

  const handleOptionSelect = useCallback((slotId: string, opt: ModOption) => {
    playTick();
    if (navigator.vibrate) navigator.vibrate(10);
    addUser(opt.label);
    if (optionResolver.current) {
      optionResolver.current(opt.value);
      optionResolver.current = null;
    }
  }, [addUser]);

  const handleSkip = useCallback((slotId: string) => {
    playTick();
    addUser('건너뛰기');
    if (optionResolver.current) {
      optionResolver.current('skip');
      optionResolver.current = null;
    }
  }, [addUser]);

  const handleChipClick = useCallback((chip: ChipItem) => {
    if (inputTyping) return;
    setInputTyping(true);
    setInputValue('');

    typingTimers.current.forEach(t => clearTimeout(t));
    typingTimers.current = [];

    const chars = chip.prompt.split('');
    chars.forEach((_, i) => {
      const timer = setTimeout(() => {
        setInputValue(chip.prompt.slice(0, i + 1));
        if (i % 3 === 0) playTick();
      }, i * 30);
      typingTimers.current.push(timer);
    });

    const submitTimer = setTimeout(() => {
      setInputTyping(false);
      handlePromptSubmit(chip.prompt);
    }, chars.length * 30 + 300);
    typingTimers.current.push(submitTimer);
  }, [handlePromptSubmit, inputTyping]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handlePromptSubmit(inputValue);
    }
  }, [inputValue, handlePromptSubmit]);

  /* ── Progress animation ── */
  const animateProgress = (): Promise<void> => {
    return new Promise(resolve => {
      setProgressWidth(0);
      requestAnimationFrame(() => {
        setProgressWidth(100);
      });
      setTimeout(resolve, 2200);
    });
  };

  /* ── Mount ── */
  useEffect(() => {
    setMounted(true);
    runFlow();
    return () => {
      typingTimers.current.forEach(t => clearTimeout(t));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ═══════════════════════════════════════════════
     Render — GitHub Education bright theme
     ═══════════════════════════════════════════════ */
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
        maxWidth: '560px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 1.2s ease, transform 1.2s ease',
        display: 'flex',
        flexDirection: 'column',
        height: 'min(88dvh, 740px)',
      }}>

        {/* ═══ Title — Glass pill badges ═══ */}
        <div style={{ textAlign: 'center', marginBottom: '20px', flexShrink: 0 }}>
          {/* Top badges row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '14px',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              padding: '5px 14px',
              borderRadius: '100px',
              background: 'rgba(99,102,241,0.2)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#a5b4fc',
              boxShadow: '0 2px 8px rgba(99,102,241,0.15)',
            }}>
              CLOSED BETA
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.06em',
              padding: '5px 14px',
              borderRadius: '100px',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
            }}>
              NEURAL ENGINE v4.0
            </span>
          </div>
          {/* Title in glass bar */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: '10px',
            padding: '10px 28px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <h1 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(18px, 4vw, 26px)',
              fontWeight: 800,
              letterSpacing: '-0.01em',
              margin: 0,
              lineHeight: 1.2,
              color: '#f0f0f5',
              textShadow: '0 0 30px rgba(99,102,241,0.2)',
            }}>
              VIBE CODING
            </h1>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(10px, 2vw, 13px)',
              fontWeight: 600,
              letterSpacing: '0.25em',
              color: 'rgba(99,102,241,0.7)',
            }}>
              WORKSHOP
            </span>
          </div>
        </div>

        {/* ═══ Glass container — white card ═══ */}
        <div style={{
          background: 'rgba(255,255,255,0.78)',
          backdropFilter: 'blur(40px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.2)',
          borderRadius: '28px',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          padding: '36px 28px',
          overflow: 'hidden',
        }}>
          {/* Scrollable chat area */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              scrollBehavior: 'smooth',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style>{`
              .pt-scroll::-webkit-scrollbar { display: none; }
            `}</style>
            <div className="pt-scroll" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}>
              {items.map((item) => {
                if (!item.visible && (item.type === 'input' || item.type === 'chips' || item.type === 'options')) {
                  return (
                    <div key={item.id} style={{
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      height: 0,
                      overflow: 'hidden',
                      marginTop: 0,
                      marginBottom: 0,
                      padding: 0,
                    }} />
                  );
                }

                switch (item.type) {
                  case 'ai':
                    return (
                      <AiMessage
                        key={item.id}
                        text={item.id === typingId ? typingText : (item.text || '')}
                        isTyping={item.id === typingId}
                        isThinking={item.text === '···'}
                      />
                    );
                  case 'user':
                    return <UserMessage key={item.id} text={item.text || ''} />;
                  case 'input':
                    return (
                      <InputWidget
                        key={item.id}
                        value={inputValue}
                        onChange={(v) => !inputTyping && setInputValue(v)}
                        onSubmit={() => handlePromptSubmit(inputValue)}
                        onKeyDown={handleKeyDown}
                        readOnly={inputTyping}
                        isTyping={inputTyping}
                        inputRef={inputRef}
                      />
                    );
                  case 'chips':
                    return (
                      <ChipsWidget
                        key={item.id}
                        chips={CHIPS}
                        onSelect={handleChipClick}
                      />
                    );
                  case 'options':
                    return (
                      <OptionsWidget
                        key={item.id}
                        options={item.options || []}
                        slotId={item.slotId || ''}
                        onSelect={handleOptionSelect}
                        onSkip={item.hasSkip ? handleSkip : undefined}
                        disabled={frozen.has(item.id)}
                      />
                    );
                  case 'progress':
                    return <ProgressBar key={item.id} width={progressWidth} />;
                  default:
                    return null;
                }
              })}
            </div>
          </div>
        </div>

        {/* ═══ Footer — glass pills on space ═══ */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          marginTop: '16px',
          flexShrink: 0,
          opacity: 0.4,
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            {['ONLINE', 'PHASER.JS', 'THREE.JS', 'WEBGL 2.0'].map((label, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '100px',
              }}>
                {i === 0 && <span style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 6px rgba(34,197,94,0.5)',
                }} />}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '8px',
                  fontWeight: 500,
                  color: i === 0 ? '#22c55e' : 'rgba(255,255,255,0.45)',
                  letterSpacing: '0.08em',
                }}>{label}</span>
              </div>
            ))}
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '8px',
            color: 'rgba(255,255,255,0.2)',
            letterSpacing: '0.08em',
          }}>
            VIBE CODING WORKSHOP — v0.5.0
          </span>
        </div>
      </div>

      {/* ═══ Keyframes — Apple-grade ═══ */}
      <style>{`
        @keyframes ptFadeIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ptShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes ptCursorPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(99,102,241,0.6); }
          50%      { opacity: 0.2; box-shadow: 0 0 2px rgba(99,102,241,0.1); }
        }
        @keyframes ptBreathGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.15); }
        }
        @keyframes ptSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ptChipReveal {
          from { opacity: 0; transform: translateY(6px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ptInputFocus {
          0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
          50%  { box-shadow: 0 0 0 4px rgba(99,102,241,0.12); }
          100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
        }
        @keyframes ptAvatarFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Sub-components — GitHub Education bright style
   ═══════════════════════════════════════════════ */

function AiMessage({ text, isTyping, isThinking }: {
  text: string;
  isTyping: boolean;
  isThinking: boolean;
}) {
  if (isThinking) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'ptSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}>
        <AiAvatar isThinking />
        {/* Skeleton shimmer — Apple-style content placeholder */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{
            width: '140px',
            height: '10px',
            borderRadius: '5px',
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e8edf4 37%, #f1f5f9 63%)',
            backgroundSize: '200% 100%',
            animation: 'ptShimmer 1.8s ease infinite',
          }} />
          <div style={{
            width: '90px',
            height: '10px',
            borderRadius: '5px',
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e8edf4 37%, #f1f5f9 63%)',
            backgroundSize: '200% 100%',
            animation: 'ptShimmer 1.8s ease 0.15s infinite',
          }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      animation: 'ptSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
    }}>
      <AiAvatar />
      <div style={{
        background: 'linear-gradient(135deg, rgba(248,250,252,0.95), rgba(241,245,249,0.9))',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '2px 20px 20px 20px',
        padding: '14px 20px',
        border: '1px solid rgba(0,0,0,0.03)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.02)',
        fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
        fontSize: '15px',
        fontWeight: 400,
        color: '#1e293b',
        lineHeight: 1.75,
        maxWidth: '85%',
        letterSpacing: '-0.01em',
      }}>
        {text}
        {isTyping && (
          <span style={{
            display: 'inline-block',
            width: '2.5px',
            height: '17px',
            marginLeft: '1px',
            verticalAlign: 'text-bottom',
            borderRadius: '2px',
            background: 'linear-gradient(180deg, #6366f1, #8b5cf6)',
            animation: 'ptCursorPulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }} />
        )}
      </div>
    </div>
  );
}

function AiAvatar({ isThinking }: { isThinking?: boolean } = {}) {
  return (
    <div style={{
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)',
      flexShrink: 0,
      marginTop: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 12px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
      animation: isThinking ? 'ptAvatarFloat 2s ease-in-out infinite' : undefined,
    }}>
      <span style={{
        fontSize: '14px',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
      }}>✦</span>
    </div>
  );
}

function UserMessage({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      animation: 'ptSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #a78bfa 100%)',
        borderRadius: '20px 4px 20px 20px',
        padding: '12px 20px',
        fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
        fontSize: '15px',
        fontWeight: 500,
        color: '#ffffff',
        lineHeight: 1.75,
        maxWidth: '80%',
        letterSpacing: '-0.01em',
        boxShadow: '0 2px 12px rgba(99,102,241,0.25), 0 1px 2px rgba(99,102,241,0.15)',
        textShadow: '0 1px 2px rgba(0,0,0,0.06)',
      }}>
        {text}
      </div>
    </div>
  );
}

function InputWidget({ value, onChange, onSubmit, onKeyDown, readOnly, isTyping, inputRef }: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  readOnly: boolean;
  isTyping: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{
      animation: 'ptSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
      marginLeft: '42px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: focused ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.92)',
        borderRadius: '18px',
        border: `1.5px solid ${focused ? 'rgba(99,102,241,0.4)' : 'rgba(0,0,0,0.06)'}`,
        padding: '4px 6px 4px 18px',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: focused
          ? '0 0 0 4px rgba(99,102,241,0.08), 0 4px 16px rgba(0,0,0,0.06)'
          : '0 1px 4px rgba(0,0,0,0.03)',
      }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="상상하는 걸 자유롭게 적어주세요..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          readOnly={readOnly}
          autoFocus
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: isTyping ? '#6366f1' : '#1e293b',
            fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
            fontSize: '15px',
            fontWeight: 400,
            lineHeight: '26px',
            padding: '12px 0',
            caretColor: '#6366f1',
            letterSpacing: '-0.01em',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <button
          onClick={onSubmit}
          style={{
            background: value.trim() && !isTyping
              ? 'linear-gradient(135deg, #6366f1, #818cf8)'
              : 'rgba(0,0,0,0.04)',
            border: 'none',
            color: value.trim() && !isTyping ? '#fff' : '#cbd5e1',
            fontSize: '16px',
            cursor: value.trim() && !isTyping ? 'pointer' : 'default',
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            flexShrink: 0,
            boxShadow: value.trim() && !isTyping
              ? '0 2px 8px rgba(99,102,241,0.3)'
              : 'none',
          }}
          onMouseEnter={(e) => {
            if (value.trim() && !isTyping) {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = value.trim() && !isTyping
              ? '0 2px 8px rgba(99,102,241,0.3)' : 'none';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5L7 12.5L13 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ opacity: value.trim() ? 0 : 1, transition: 'opacity 0.2s' }} />
            <path d="M2 7L14 7M14 7L9 2M14 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              style={{ opacity: value.trim() ? 1 : 0, transition: 'opacity 0.2s' }} />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ChipsWidget({ chips, onSelect }: {
  chips: ChipEntry[];
  onSelect: (chip: ChipItem) => void;
}) {
  // Build sections from flat array with category markers
  const sections: { category: string; items: ChipItem[] }[] = [];
  let current: typeof sections[0] | null = null;

  for (const entry of chips) {
    if (entry.category) {
      current = { category: entry.category, items: [] };
      sections.push(current);
    } else {
      if (!current) {
        current = { category: '', items: [] };
        sections.push(current);
      }
      current.items.push(entry as ChipItem);
    }
  }

  let globalIdx = 0;
  return (
    <div style={{
      marginLeft: '42px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      animation: 'ptSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
    }}>
      {/* Label */}
      <span style={{
        fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
        fontSize: '12px',
        fontWeight: 500,
        color: '#94a3b8',
        letterSpacing: '0.02em',
      }}>
        또는 영감을 골라보세요
      </span>

      {sections.map((section, si) => (
        <div key={si}>
          {section.category && (
            <div style={{
              fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
              fontSize: '10px',
              fontWeight: 600,
              color: '#b0b8c8',
              letterSpacing: '0.08em',
              padding: si > 0 ? '6px 0 5px' : '0 0 5px',
            }}>
              {section.category}
            </div>
          )}
          {/* Horizontal scroll strip */}
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingBottom: '4px',
            marginRight: '-28px',
            paddingRight: '28px',
            WebkitOverflowScrolling: 'touch',
          }}>
            <style>{`.chips-scroll::-webkit-scrollbar { display: none; }`}</style>
            {section.items.map((chip) => {
              const idx = globalIdx++;
              return (
                <button
                  key={chip.label}
                  className="chips-scroll"
                  onClick={() => onSelect(chip)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '100px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    color: '#475569',
                    fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    animation: `ptChipReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.04}s both`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
                    e.currentTarget.style.color = '#4f46e5';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.85)';
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)';
                    e.currentTarget.style.color = '#475569';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function OptionsWidget({ options, slotId, onSelect, onSkip, disabled }: {
  options: ModOption[];
  slotId: string;
  onSelect: (slotId: string, opt: ModOption) => void;
  onSkip?: (slotId: string) => void;
  disabled: boolean;
}) {
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const [selectedIdx, setSelectedIdx] = useState(-1);

  const handleSelect = (opt: ModOption, idx: number) => {
    if (disabled) return;
    setSelectedIdx(idx);
    // Small delay for visual feedback
    setTimeout(() => onSelect(slotId, opt), 150);
  };

  // DJ Mixer — Apple-grade horizontal selector
  return (
    <div style={{
      marginLeft: '42px',
      animation: 'ptSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
    }}>
      {/* Mixer panel */}
      <div style={{
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '18px',
        padding: '6px',
        border: '1px solid rgba(0,0,0,0.04)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.02), 0 4px 16px rgba(0,0,0,0.02)',
      }}>
        {/* Channel strip — Apple segmented control */}
        <div style={{
          display: 'flex',
          gap: '0',
          borderRadius: '14px',
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.03)',
          position: 'relative',
          padding: '2px',
        }}>
          {/* Slider track highlight — smooth glass pill */}
          {(selectedIdx >= 0 || hoveredIdx >= 0) && (
            <div style={{
              position: 'absolute',
              left: `calc(${((selectedIdx >= 0 ? selectedIdx : hoveredIdx) / options.length) * 100}% + 2px)`,
              width: `calc(${100 / options.length}% - 4px)`,
              top: '2px', bottom: '2px',
              background: selectedIdx >= 0
                ? '#fff'
                : 'rgba(255,255,255,0.5)',
              borderRadius: '12px',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              zIndex: 0,
              boxShadow: selectedIdx >= 0
                ? '0 1px 3px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)'
                : 'none',
            }} />
          )}

          {options.map((opt, i) => {
            const isSelected = selectedIdx === i;
            const isHovered = hoveredIdx === i;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt, i)}
                onMouseEnter={() => !disabled && setHoveredIdx(i)}
                onMouseLeave={() => !disabled && setHoveredIdx(-1)}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  border: 'none',
                  background: 'transparent',
                  color: isSelected ? '#1e293b' : isHovered ? '#475569' : '#94a3b8',
                  fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
                  fontSize: '13px',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: disabled ? 'default' : 'pointer',
                  transition: 'color 0.25s ease',
                  position: 'relative',
                  zIndex: 1,
                  opacity: disabled ? 0.4 : 1,
                  letterSpacing: '-0.01em',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Skip option */}
        {onSkip && !disabled && (
          <button
            onClick={() => onSkip(slotId)}
            style={{
              width: '100%',
              marginTop: '4px',
              padding: '8px',
              border: 'none',
              background: 'transparent',
              color: '#b0b8c8',
              fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
              fontSize: '12px',
              fontWeight: 400,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              textAlign: 'center',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#64748b'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#b0b8c8'; }}
          >
            건너뛰기
          </button>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ width }: { width: number }) {
  return (
    <div style={{
      marginLeft: '42px',
      marginTop: '4px',
      animation: 'ptSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
    }}>
      <div style={{
        height: '3px',
        background: 'rgba(0,0,0,0.04)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${width}%`,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
          borderRadius: '2px',
          transition: 'width 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          boxShadow: '0 0 8px rgba(99,102,241,0.3)',
        }} />
      </div>
    </div>
  );
}

/* ═══ Utility ═══ */
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
