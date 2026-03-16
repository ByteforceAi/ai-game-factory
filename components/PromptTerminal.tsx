'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DEMO_GAMES, DemoGame } from '@/lib/demoGames';
import { matchPromptToGame, MatchResult } from '@/lib/promptMatcher';
import { playSelect, playComplete, playWhoosh, playTick } from '@/lib/sounds';
import ParticleBackground from './ParticleBackground';

/* ═══════════════════════════════════════════════
   Data — chips, modifiers, reactions
   ═══════════════════════════════════════════════ */
const CHIPS = [
  { label: '우주 슈팅게임', prompt: '우주에서 적을 쏘는 네온 슈팅게임' },
  { label: '네온 플랫포머', prompt: '점프하고 벽타는 네온 러너 게임' },
  { label: '3D 러너', prompt: '3D 장애물 피하는 템플 러너' },
  { label: '테트리스', prompt: '클래식 테트리스 게임' },
  { label: '이모지 캐치', prompt: '떨어지는 이모지 받기 게임' },
  { label: '도트 RPG', prompt: '일랜시아 감성 도트 RPG 마을 탐험' },
];

interface ModOption { value: string; label: string }

const MODIFIER_SLOTS = [
  {
    id: 'difficulty',
    question: '난이도를 선택해주세요.',
    options: [
      { value: 'easy', label: '이지' },
      { value: 'normal', label: '노멀' },
      { value: 'hard', label: '하드' },
      { value: 'nightmare', label: '나이트메어' },
    ] as ModOption[],
  },
  {
    id: 'style',
    question: '비주얼 스타일은요?',
    options: [
      { value: 'neon', label: '네온' },
      { value: 'retro', label: '레트로' },
      { value: 'minimal', label: '미니멀' },
      { value: 'cyber', label: '사이버펑크' },
    ] as ModOption[],
  },
  {
    id: 'effect',
    question: '특수효과를 추가할까요?',
    options: [
      { value: 'particle', label: '파티클' },
      { value: 'shake', label: '화면흔들림' },
      { value: 'combo', label: '콤보 시스템' },
      { value: 'slowmo', label: '슬로우모션' },
    ] as ModOption[],
    hasSkip: true,
  },
];

const AI_REACTIONS: Record<string, Record<string, string>> = {
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
   Main Component
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

      const chars = Array.from(text); // handles unicode correctly
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
    // Show thinking dots
    const thinkId = nid();
    setItems(prev => [...prev, { id: thinkId, type: 'ai', text: '···', visible: true }]);
    scrollToBottom();

    await wait(pauseBefore);

    // Remove thinking dots, then type
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
    // Step 1: Ask what game
    await wait(500);
    await aiSpeak('어떤 게임을 만들어볼까요?', 0, 60);
    await wait(800);

    const inputId = addWidget('input');
    const chipsId = addWidget('chips');

    // Wait for game selection
    const prompt = await waitForGamePrompt();

    // Fade out input & chips
    fadeOut(inputId);
    fadeOut(chipsId);
    await wait(300);

    // AI reacts to match
    const game = DEMO_GAMES.find(g => g.id === matchRef.current?.gameId);
    const gameName = game?.title || '게임';
    await wait(1200);
    await aiSpeak(`${gameName}, 좋은 선택이에요.`, 800, 60);

    // Steps 2-4: Modifiers
    for (let si = 0; si < MODIFIER_SLOTS.length; si++) {
      const slot = MODIFIER_SLOTS[si];
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

    // Step 5: Generating
    await wait(1500);
    await aiSpeak('완벽해요. 지금 만들어볼게요.', 800, 80);
    await wait(500);

    // Progress bar
    const progId = addWidget('progress');
    playComplete();

    // Animate progress 0 → 100 over 2s
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

  const handleChipClick = useCallback((chip: typeof CHIPS[0]) => {
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
      // Use requestAnimationFrame for smooth animation
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
     Render
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
        maxWidth: '520px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 1.2s ease, transform 1.2s ease',
        display: 'flex',
        flexDirection: 'column',
        height: 'min(88dvh, 740px)',
      }}>

        {/* ═══ Title ═══ */}
        <div style={{ textAlign: 'center', marginBottom: '20px', flexShrink: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '12px',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '7px',
              fontWeight: 600,
              letterSpacing: '0.15em',
              padding: '2px 8px',
              borderRadius: '100px',
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.2)',
              color: '#a5b4fc',
            }}>
              CLOSED BETA
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '8px',
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.15em',
            }}>
              NEURAL ENGINE v4.0
            </span>
          </div>
          <h1 style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 'clamp(18px, 4vw, 26px)',
            fontWeight: 600,
            letterSpacing: '0.12em',
            margin: 0,
            lineHeight: 1.2,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.9)' }}>VIBE CODING</span>
            {' '}
            <span style={{
              color: 'rgba(255,255,255,0.35)',
              fontSize: '0.55em',
              letterSpacing: '0.22em',
            }}>
              WORKSHOP
            </span>
          </h1>
          {/* Gradient underline */}
          <div style={{
            width: '60px',
            height: '1px',
            margin: '12px auto 0',
            background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.4), rgba(139,92,246,0.4), transparent)',
          }} />
        </div>

        {/* ═══ Glass container — no frame, no border ═══ */}
        <div style={{
          background: 'rgba(5,5,16,0.4)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderRadius: '32px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          padding: '40px 32px',
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
              gap: '20px',
              scrollBehavior: 'smooth',
              /* Hide scrollbar for clean look */
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
              gap: '20px',
            }}>
              {items.map((item) => {
                // Fade-out items
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

        {/* ═══ Footer — very quiet ═══ */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          marginTop: '16px',
          flexShrink: 0,
          opacity: 0.3,
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
                padding: '2px 8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '100px',
              }}>
                {i === 0 && <span style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: '#22c55e',
                }} />}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '7px',
                  color: i === 0 ? '#22c55e' : 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.1em',
                }}>{label}</span>
              </div>
            ))}
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '7px',
            color: 'rgba(255,255,255,0.2)',
            letterSpacing: '0.1em',
          }}>
            AI GAME FACTORY — PROTOTYPE v0.4.0
          </span>
        </div>
      </div>

      {/* ═══ Keyframes ═══ */}
      <style>{`
        @keyframes ptFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ptCursorBlink {
          0%, 100% { opacity: 0.8; }
          50%      { opacity: 0; }
        }
        @keyframes ptDotGlow {
          0%, 100% { opacity: 0.2; }
          50%      { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Sub-components — "quiet confidence" style
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
        gap: '10px',
        animation: 'ptFadeIn 0.4s ease both',
      }}>
        <AiDot />
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00E5FF, #8b5cf6)',
              animation: `ptDotGlow 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      animation: 'ptFadeIn 0.4s ease both',
    }}>
      <AiDot />
      <div style={{
        fontFamily: "'Noto Sans KR', sans-serif",
        fontSize: '15px',
        fontWeight: 400,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 1.7,
        maxWidth: '90%',
      }}>
        {text}
        {isTyping && (
          <span style={{
            display: 'inline-block',
            width: '1.5px',
            height: '16px',
            marginLeft: '2px',
            verticalAlign: 'text-bottom',
            background: '#00E5FF',
            animation: 'ptCursorBlink 0.8s ease infinite',
          }} />
        )}
      </div>
    </div>
  );
}

function AiDot() {
  return (
    <div style={{
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, rgba(0,229,255,0.6), rgba(139,92,246,0.5))',
      flexShrink: 0,
      marginTop: '2px',
    }} />
  );
}

function UserMessage({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      animation: 'ptFadeIn 0.3s ease both',
    }}>
      <div style={{
        background: 'rgba(129,140,248,0.08)',
        borderRadius: '20px',
        padding: '8px 20px',
        fontFamily: "'Noto Sans KR', sans-serif",
        fontSize: '15px',
        fontWeight: 500,
        color: 'rgba(167,139,250,0.9)',
        lineHeight: 1.7,
        maxWidth: '80%',
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
  return (
    <div style={{
      animation: 'ptFadeIn 0.4s ease both',
      marginLeft: '30px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="만들고 싶은 게임을 말해주세요..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          readOnly={readOnly}
          autoFocus
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.03)',
            border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 0,
            outline: 'none',
            color: isTyping ? '#00E5FF' : 'rgba(255,255,255,0.85)',
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: '15px',
            fontWeight: 400,
            lineHeight: '24px',
            padding: '10px 0',
            transition: 'border-bottom-color 0.3s',
            caretColor: '#00E5FF',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderBottomColor = '#00E5FF';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.1)';
          }}
        />
        {value.trim() && !isTyping && (
          <button
            onClick={onSubmit}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#00E5FF',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px 8px',
              opacity: 0.7,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
          >
            ↵
          </button>
        )}
      </div>
    </div>
  );
}

function ChipsWidget({ chips, onSelect }: {
  chips: typeof CHIPS;
  onSelect: (chip: typeof CHIPS[0]) => void;
}) {
  return (
    <div style={{
      marginLeft: '30px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px',
      animation: 'ptFadeIn 0.4s ease both',
    }}>
      {chips.map((chip, i) => (
        <button
          key={chip.label}
          onClick={() => onSelect(chip)}
          style={{
            padding: '14px 20px',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: 'rgba(255,255,255,0.7)',
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: '14px',
            fontWeight: 400,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textAlign: 'left',
            animation: `ptFadeIn 0.4s ease ${i * 0.05}s both`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
          }}
        >
          {chip.label}
        </button>
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
  return (
    <div style={{
      marginLeft: '30px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px',
      animation: 'ptFadeIn 0.4s ease both',
    }}>
      {options.map((opt, i) => (
        <button
          key={opt.value}
          onClick={() => !disabled && onSelect(slotId, opt)}
          style={{
            padding: '14px 20px',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: 'rgba(255,255,255,0.7)',
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: '14px',
            fontWeight: 400,
            cursor: disabled ? 'default' : 'pointer',
            transition: 'all 0.3s ease',
            textAlign: 'left',
            animation: `ptFadeIn 0.4s ease ${i * 0.05}s both`,
            opacity: disabled ? 0.3 : 1,
          }}
          onMouseEnter={(e) => {
            if (disabled) return;
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
          }}
          onMouseLeave={(e) => {
            if (disabled) return;
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
          }}
        >
          {opt.label}
        </button>
      ))}
      {onSkip && !disabled && (
        <button
          onClick={() => onSkip(slotId)}
          style={{
            gridColumn: '1 / -1',
            padding: '10px 20px',
            borderRadius: '16px',
            border: 'none',
            background: 'transparent',
            color: 'rgba(255,255,255,0.3)',
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: '13px',
            fontWeight: 400,
            cursor: 'pointer',
            transition: 'color 0.3s ease',
            textAlign: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
          }}
        >
          건너뛰기
        </button>
      )}
    </div>
  );
}

function ProgressBar({ width }: { width: number }) {
  return (
    <div style={{
      marginLeft: '30px',
      marginTop: '4px',
      animation: 'ptFadeIn 0.4s ease both',
    }}>
      <div style={{
        height: '2px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '1px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${width}%`,
          background: 'linear-gradient(90deg, #00E5FF, #8b5cf6)',
          borderRadius: '1px',
          transition: 'width 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }} />
      </div>
    </div>
  );
}

/* ═══ Utility ═══ */
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
