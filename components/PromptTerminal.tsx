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
  { label: '🚀 우주 슈팅게임', prompt: '우주에서 적을 쏘는 네온 슈팅게임' },
  { label: '🏃 네온 플랫포머', prompt: '점프하고 벽타는 네온 러너 게임' },
  { label: '🎮 3D 러너', prompt: '3D 장애물 피하는 템플 러너' },
  { label: '🧱 테트리스', prompt: '클래식 테트리스 게임' },
  { label: '😄 이모지 캐치', prompt: '떨어지는 이모지 받기 게임' },
  { label: '⚔️ 도트 RPG', prompt: '일랜시아 감성 도트 RPG 마을 탐험' },
];

interface ModOption { value: string; label: string }

const MODIFIER_SLOTS = [
  {
    id: 'difficulty',
    question: '난이도를 선택해주세요.',
    options: [
      { value: 'easy', label: '😊 이지' },
      { value: 'normal', label: '⚡ 노멀' },
      { value: 'hard', label: '🔥 하드' },
      { value: 'nightmare', label: '💀 나이트메어' },
    ] as ModOption[],
  },
  {
    id: 'style',
    question: '비주얼 스타일은요?',
    options: [
      { value: 'neon', label: '💜 네온' },
      { value: 'retro', label: '🕹️ 레트로' },
      { value: 'minimal', label: '⬜ 미니멀' },
      { value: 'cyber', label: '🌃 사이버펑크' },
    ] as ModOption[],
  },
  {
    id: 'effect',
    question: '특수효과를 추가할까요?',
    options: [
      { value: 'particle', label: '✨ 파티클' },
      { value: 'shake', label: '📳 화면흔들림' },
      { value: 'combo', label: '🎯 콤보 시스템' },
      { value: 'slowmo', label: '🕐 슬로우모션' },
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
    await aiSpeak('어떤 게임을 만들어볼까요?', 0, 60);
    await wait(800);

    const inputId = addWidget('input');
    const chipsId = addWidget('chips');

    const prompt = await waitForGamePrompt();

    fadeOut(inputId);
    fadeOut(chipsId);
    await wait(300);

    const game = DEMO_GAMES.find(g => g.id === matchRef.current?.gameId);
    const gameName = game?.title || '게임';
    await wait(1200);
    await aiSpeak(`${gameName}, 좋은 선택이에요.`, 800, 60);

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
              fontFamily: "'Inter', sans-serif",
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              padding: '3px 10px',
              borderRadius: '100px',
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(99,102,241,0.15)',
              color: '#6366f1',
            }}>
              CLOSED BETA
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: '#94a3b8',
              letterSpacing: '0.08em',
            }}>
              NEURAL ENGINE v4.0
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(18px, 4vw, 26px)',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            margin: 0,
            lineHeight: 1.2,
          }}>
            <span style={{ color: '#1e293b' }}>VIBE CODING</span>
            {' '}
            <span style={{
              color: '#6366f1',
              fontSize: '0.6em',
              letterSpacing: '0.2em',
              fontWeight: 600,
            }}>
              WORKSHOP
            </span>
          </h1>
          {/* Gradient underline */}
          <div style={{
            width: '50px',
            height: '2px',
            margin: '10px auto 0',
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            borderRadius: '1px',
          }} />
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

        {/* ═══ Footer ═══ */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          marginTop: '16px',
          flexShrink: 0,
          opacity: 0.5,
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
                background: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(0,0,0,0.04)',
                borderRadius: '100px',
              }}>
                {i === 0 && <span style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: '#10b981',
                }} />}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '8px',
                  fontWeight: 500,
                  color: i === 0 ? '#10b981' : '#64748b',
                  letterSpacing: '0.08em',
                }}>{label}</span>
              </div>
            ))}
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '8px',
            color: '#94a3b8',
            letterSpacing: '0.08em',
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
          0%, 100% { opacity: 0.3; }
          50%      { opacity: 1; }
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
        gap: '10px',
        animation: 'ptFadeIn 0.4s ease both',
      }}>
        <AiAvatar />
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: '#6366f1',
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
      <AiAvatar />
      <div style={{
        background: '#f8fafc',
        borderRadius: '0 18px 18px 18px',
        padding: '12px 18px',
        border: '1px solid rgba(0,0,0,0.04)',
        fontFamily: "'Noto Sans KR', sans-serif",
        fontSize: '15px',
        fontWeight: 400,
        color: '#1e293b',
        lineHeight: 1.7,
        maxWidth: '85%',
      }}>
        {text}
        {isTyping && (
          <span style={{
            display: 'inline-block',
            width: '2px',
            height: '16px',
            marginLeft: '2px',
            verticalAlign: 'text-bottom',
            background: '#6366f1',
            animation: 'ptCursorBlink 0.8s ease infinite',
          }} />
        )}
      </div>
    </div>
  );
}

function AiAvatar() {
  return (
    <div style={{
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      flexShrink: 0,
      marginTop: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
    }}>
      <span style={{ fontSize: '13px' }}>✨</span>
    </div>
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
        background: 'linear-gradient(135deg, #6366f1, #818cf8)',
        borderRadius: '18px 0 18px 18px',
        padding: '10px 18px',
        fontFamily: "'Noto Sans KR', sans-serif",
        fontSize: '15px',
        fontWeight: 500,
        color: '#ffffff',
        lineHeight: 1.7,
        maxWidth: '80%',
        boxShadow: '0 2px 8px rgba(99,102,241,0.2)',
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
      marginLeft: '38px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#fff',
        borderRadius: '16px',
        border: '1.5px solid #e2e8f0',
        padding: '4px 4px 4px 16px',
        transition: 'border-color 0.3s, box-shadow 0.3s',
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
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: isTyping ? '#6366f1' : '#1e293b',
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: '24px',
            padding: '10px 0',
            caretColor: '#6366f1',
          }}
          onFocus={(e) => {
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.style.borderColor = '#6366f1';
              parent.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
            }
          }}
          onBlur={(e) => {
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.style.borderColor = '#e2e8f0';
              parent.style.boxShadow = 'none';
            }
          }}
        />
        {value.trim() && !isTyping && (
          <button
            onClick={onSubmit}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              border: 'none',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px 14px',
              borderRadius: '12px',
              transition: 'transform 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
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
      marginLeft: '38px',
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
            padding: '14px 16px',
            borderRadius: '14px',
            border: '1.5px solid #e2e8f0',
            background: '#fff',
            color: '#334155',
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            textAlign: 'left',
            animation: `ptFadeIn 0.4s ease ${i * 0.05}s both`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f5f3ff';
            e.currentTarget.style.borderColor = '#6366f1';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.12)';
            e.currentTarget.style.color = '#4f46e5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
            e.currentTarget.style.color = '#334155';
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
      marginLeft: '38px',
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
            padding: '14px 16px',
            borderRadius: '14px',
            border: '1.5px solid #e2e8f0',
            background: '#fff',
            color: '#334155',
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            cursor: disabled ? 'default' : 'pointer',
            transition: 'all 0.25s ease',
            textAlign: 'left',
            animation: `ptFadeIn 0.4s ease ${i * 0.05}s both`,
            opacity: disabled ? 0.4 : 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
          onMouseEnter={(e) => {
            if (disabled) return;
            e.currentTarget.style.background = '#f5f3ff';
            e.currentTarget.style.borderColor = '#6366f1';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.12)';
            e.currentTarget.style.color = '#4f46e5';
          }}
          onMouseLeave={(e) => {
            if (disabled) return;
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
            e.currentTarget.style.color = '#334155';
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
            borderRadius: '14px',
            border: 'none',
            background: 'transparent',
            color: '#94a3b8',
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: '13px',
            fontWeight: 400,
            cursor: 'pointer',
            transition: 'color 0.3s ease',
            textAlign: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#64748b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
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
      marginLeft: '38px',
      marginTop: '4px',
      animation: 'ptFadeIn 0.4s ease both',
    }}>
      <div style={{
        height: '4px',
        background: '#f1f5f9',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${width}%`,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          borderRadius: '2px',
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
