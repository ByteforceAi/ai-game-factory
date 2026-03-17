'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  getVibeConfig,
  matchChatCommand,
  SliderCommand,
  ChatPattern,
} from '@/lib/vibeCommands';

interface VibeControlPanelProps {
  gameId: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'ai' | 'system';
  text: string;
  codeSnippet?: string;
  suggestions?: ChatPattern[];
}

/** Group chat patterns into categories for the "pick a topic" flow */
function categorizePatterns(patterns: ChatPattern[]): { label: string; icon: string; patterns: ChatPattern[] }[] {
  const cats: { label: string; icon: string; keywords: string[]; patterns: ChatPattern[] }[] = [
    { label: '날씨 / 환경', icon: '🌤️', keywords: ['비', '맑', '밤', '아침', '저녁', '날씨', 'rain', 'clear', 'night', 'morning', 'evening', '어두', '달빛', '노을', '석양', '햇빛', 'sunny'], patterns: [] },
    { label: '속도 / 난이도', icon: '⚡', keywords: ['빨리', '느리', 'fast', 'slow', '속도', '터보', '성장', '급성장', '천천히', '여유', '힐링', '쉽', 'easy'], patterns: [] },
    { label: '아이템 / 스탯', icon: '💎', keywords: ['골드', 'gold', '돈', '무적', '목숨', '라이프', '999', '물', 'water', '레벨', 'level', '강해', '최강', 'god', 'HP', '공격'], patterns: [] },
    { label: '특수 효과', icon: '✨', keywords: ['보스', '풍선', '별', '콤보', '시간', '퀴즈', '큐브', '전부', '완성', '올클', '코인', '자석', '높이', '점프', '달', '무중력'], patterns: [] },
  ];

  for (const p of patterns) {
    let placed = false;
    for (const cat of cats) {
      if (p.patterns.some(kw => cat.keywords.some(ck => kw.includes(ck) || ck.includes(kw)))) {
        cat.patterns.push(p);
        placed = true;
        break;
      }
    }
    if (!placed && cats[3]) cats[3].patterns.push(p); // fallback to "특수 효과"
  }

  return cats.filter(c => c.patterns.length > 0);
}

export default function VibeControlPanel({ gameId, iframeRef, onClose }: VibeControlPanelProps) {
  const config = getVibeConfig(gameId);
  const categories = categorizePatterns(config.chatPatterns);
  const [tab, setTab] = useState<'sliders' | 'chat'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiTyping, setAiTyping] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [currentCode, setCurrentCode] = useState('');
  const [typingText, setTypingText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Show welcome message on mount
  useEffect(() => {
    setMessages([{
      role: 'ai',
      text: '안녕! 이 게임을 어떻게 바꿔볼까요? 카테고리를 골라보세요 👇',
    }]);
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiTyping]);

  const sendToGame = useCallback((messageType: string, value: unknown) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { type: messageType, value },
        '*'
      );
    } catch {}
  }, [iframeRef]);

  const handleSliderChange = (cmd: SliderCommand, value: number | string | boolean) => {
    sendToGame(cmd.messageType, value);
  };

  // ─── Category selection → AI suggests options ───
  const handleCategoryPick = (cat: { label: string; icon: string; patterns: ChatPattern[] }) => {
    setMessages(prev => [
      ...prev,
      { role: 'user', text: `${cat.icon} ${cat.label}` },
    ]);

    // AI responds with suggestions after a brief pause
    setTimeout(() => {
      const suggestions = cat.patterns.slice(0, 4);
      const labels = suggestions.map(s => `"${s.patterns[0]}"`).join(', ');
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text: `${cat.icon} ${cat.label} 관련으로 이런 걸 해볼 수 있어요!`,
          suggestions,
        },
      ]);
    }, 400);
  };

  // ─── Execute a chat pattern (from suggestion or free text) ───
  const executeChatPattern = useCallback((pattern: ChatPattern, userText?: string) => {
    if (aiTyping) return;

    setMessages(prev => [
      ...prev,
      { role: 'user', text: userText || pattern.patterns[0] },
    ]);

    setAiTyping(true);
    setShowCode(true);
    setCurrentCode('');

    const code = pattern.codeSnippet;
    let charIdx = 0;
    const typeInterval = setInterval(() => {
      charIdx += 2 + Math.floor(Math.random() * 3);
      if (charIdx >= code.length) {
        charIdx = code.length;
        clearInterval(typeInterval);

        setTypingText('컴파일 중...');
        setTimeout(() => {
          sendToGame(pattern.messageType, pattern.value);

          setAiTyping(false);
          setShowCode(false);
          setTypingText('');
          setCurrentCode('');
          setMessages(prev => [
            ...prev,
            { role: 'ai', text: pattern.response, codeSnippet: pattern.codeSnippet },
          ]);
        }, 600);
      }
      setCurrentCode(code.slice(0, charIdx));
    }, 35);
  }, [aiTyping, sendToGame]);

  // ─── Free text submit ───
  const handleChatSubmit = () => {
    const text = chatInput.trim();
    if (!text || aiTyping) return;
    setChatInput('');

    const match = matchChatCommand(gameId, text);
    if (match) {
      executeChatPattern(match, text);
    } else {
      setMessages(prev => [
        ...prev,
        { role: 'user', text },
        { role: 'ai', text: '🤔 음... 이건 아직 모르겠어요! 아래 추천을 눌러보세요.' },
      ]);
    }
  };

  // Check if we're in the initial state (only welcome message)
  const isInitialState = messages.length <= 1 && !aiTyping;

  return (
    <div
      onTouchMove={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom: 52,
        left: 0,
        right: 0,
        zIndex: 30,
        maxHeight: '55vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(5,5,16,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(99,102,241,0.2)',
        borderRadius: '16px 16px 0 0',
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes codePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .vibe-scroll::-webkit-scrollbar { width: 3px; }
        .vibe-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
        .vibe-scroll::-webkit-scrollbar-track { background: transparent; }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 16px; height: 16px; border-radius: 50%;
          background: #6366f1; cursor: pointer; border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px 6px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '8px',
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            LIVE VIBE CODING
          </span>
          <h3 style={{
            color: '#e0e7ff',
            fontSize: '13px',
            fontWeight: 600,
            margin: '1px 0 0',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            🎛️ 실시간 코드 수정
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            cursor: 'pointer',
            padding: '4px 10px',
            borderRadius: '6px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Tab Switcher */}
      <div style={{
        display: 'flex',
        gap: '2px',
        padding: '6px 14px',
        flexShrink: 0,
      }}>
        <button
          onClick={() => setTab('chat')}
          style={{
            flex: 1, padding: '7px 0', borderRadius: '8px', border: 'none',
            fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 600, cursor: 'pointer',
            background: tab === 'chat' ? 'rgba(16,185,129,0.2)' : 'transparent',
            color: tab === 'chat' ? '#6ee7b7' : 'rgba(255,255,255,0.4)',
            transition: 'all 0.2s',
          }}
        >
          💬 AI 코딩
        </button>
        <button
          onClick={() => setTab('sliders')}
          style={{
            flex: 1, padding: '7px 0', borderRadius: '8px', border: 'none',
            fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 600, cursor: 'pointer',
            background: tab === 'sliders' ? 'rgba(99,102,241,0.2)' : 'transparent',
            color: tab === 'sliders' ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
            transition: 'all 0.2s',
          }}
        >
          🎛️ 파라미터
        </button>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="vibe-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          padding: '8px 14px 12px',
          touchAction: 'pan-y',
        }}
      >
        {/* ─── SLIDERS TAB ─── */}
        {tab === 'sliders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {config.sliders.map(cmd => (
              <SliderControl key={cmd.id} cmd={cmd} onChange={handleSliderChange} />
            ))}
          </div>
        )}

        {/* ─── CHAT TAB ─── */}
        {tab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Message list */}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'fadeInUp 0.3s ease-out',
                }}
              >
                <div style={{
                  maxWidth: '90%',
                  padding: '8px 12px',
                  borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: msg.role === 'user'
                    ? 'rgba(99,102,241,0.2)'
                    : 'rgba(16,185,129,0.12)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.2)'}`,
                  color: msg.role === 'user' ? '#c7d2fe' : '#a7f3d0',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  lineHeight: 1.5,
                }}>
                  {msg.text}
                  {msg.codeSnippet && (
                    <pre style={{
                      margin: '6px 0 0', padding: '6px 8px',
                      background: 'rgba(0,0,0,0.3)', borderRadius: '6px',
                      fontSize: '9px', color: '#94a3b8', whiteSpace: 'pre-wrap',
                      lineHeight: 1.4, overflow: 'hidden', maxHeight: '60px',
                    }}>
                      {msg.codeSnippet}
                    </pre>
                  )}
                </div>
                {/* Suggestion chips under AI message */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '6px',
                    marginTop: '6px', maxWidth: '90%',
                  }}>
                    {msg.suggestions.map((sug, j) => (
                      <button
                        key={j}
                        onClick={() => executeChatPattern(sug)}
                        disabled={aiTyping}
                        style={{
                          padding: '6px 12px', borderRadius: '20px',
                          border: '1px solid rgba(16,185,129,0.3)',
                          background: 'rgba(16,185,129,0.08)',
                          color: '#6ee7b7',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '11px', cursor: aiTyping ? 'default' : 'pointer',
                          transition: 'all 0.2s', whiteSpace: 'nowrap',
                          opacity: aiTyping ? 0.4 : 1,
                        }}
                      >
                        {sug.patterns[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* AI typing indicator */}
            {aiTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'fadeInUp 0.2s ease-out' }}>
                <div style={{
                  maxWidth: '90%', padding: '8px 12px',
                  borderRadius: '12px 12px 12px 4px',
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: showCode ? '6px' : 0 }}>
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: '#10b981', animation: 'codePulse 1s infinite',
                    }} />
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px', color: '#6ee7b7', letterSpacing: '0.05em',
                    }}>
                      {showCode ? 'AI 코딩 중...' : typingText}
                    </span>
                  </div>
                  {showCode && currentCode && (
                    <pre style={{
                      margin: 0, padding: '6px 8px', background: 'rgba(0,0,0,0.4)',
                      borderRadius: '6px', fontSize: '10px', color: '#50fa7b',
                      fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap', lineHeight: 1.4,
                    }}>
                      {currentCode}
                      <span style={{
                        display: 'inline-block', width: '6px', height: '12px',
                        background: '#50fa7b', animation: 'codePulse 0.5s infinite',
                        verticalAlign: 'middle', marginLeft: '1px',
                      }} />
                    </pre>
                  )}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Category picker — shown in initial state of chat tab */}
      {tab === 'chat' && isInitialState && categories.length > 0 && (
        <div style={{
          padding: '4px 14px 8px',
          display: 'flex', flexWrap: 'wrap', gap: '6px',
          flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          {categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => handleCategoryPick(cat)}
              style={{
                padding: '7px 14px', borderRadius: '20px',
                border: '1px solid rgba(99,102,241,0.25)',
                background: 'rgba(99,102,241,0.08)',
                color: '#c7d2fe',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      {tab === 'chat' && (
        <div style={{
          padding: '8px 14px 10px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: '6px', flexShrink: 0,
        }}>
          <input
            ref={inputRef}
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleChatSubmit()}
            placeholder="직접 입력해도 돼요..."
            disabled={aiTyping}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', padding: '10px 14px',
              color: '#e0e7ff', fontSize: '13px',
              fontFamily: "'JetBrains Mono', monospace",
              outline: 'none', transition: 'border-color 0.3s',
            }}
          />
          <button
            onClick={handleChatSubmit}
            disabled={!chatInput.trim() || aiTyping}
            style={{
              background: chatInput.trim() && !aiTyping
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'rgba(255,255,255,0.05)',
              border: 'none', borderRadius: '10px', padding: '10px 16px',
              color: '#fff', fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px', fontWeight: 600,
              cursor: chatInput.trim() && !aiTyping ? 'pointer' : 'default',
              opacity: chatInput.trim() && !aiTyping ? 1 : 0.4,
              transition: 'all 0.2s',
            }}
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Slider Control Sub-component ───
function SliderControl({ cmd, onChange }: { cmd: SliderCommand; onChange: (cmd: SliderCommand, value: number | string | boolean) => void }) {
  const [value, setValue] = useState<number>(cmd.defaultValue ?? cmd.min ?? 0);
  const [toggled, setToggled] = useState(false);
  const [selected, setSelected] = useState(cmd.options?.[0]?.value ?? '');

  if (cmd.type === 'toggle') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
        background: toggled ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${toggled ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '10px', transition: 'all 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{cmd.icon}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#e0e7ff', fontWeight: 500 }}>
            {cmd.label}
          </span>
        </div>
        <button
          onClick={() => { const next = !toggled; setToggled(next); onChange(cmd, next); }}
          style={{
            width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            background: toggled ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.1)',
            position: 'relative', transition: 'background 0.2s',
          }}
        >
          <div style={{
            width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
            position: 'absolute', top: '3px', left: toggled ? '23px' : '3px',
            transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }} />
        </button>
      </div>
    );
  }

  if (cmd.type === 'select' && cmd.options) {
    return (
      <div style={{
        padding: '8px 12px', background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '16px' }}>{cmd.icon}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#e0e7ff', fontWeight: 500 }}>
            {cmd.label}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {cmd.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setSelected(opt.value); onChange(cmd, opt.value); }}
              style={{
                padding: '5px 10px', borderRadius: '8px',
                border: `1px solid ${selected === opt.value ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
                background: selected === opt.value ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                color: selected === opt.value ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
                fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '8px 12px', background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{cmd.icon}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#e0e7ff', fontWeight: 500 }}>
            {cmd.label}
          </span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#a5b4fc', fontWeight: 600, minWidth: '50px', textAlign: 'right' }}>
          {value}{cmd.unit || ''}
        </span>
      </div>
      <input
        type="range"
        min={cmd.min}
        max={cmd.max}
        step={cmd.step}
        value={value}
        onChange={e => { const v = parseFloat(e.target.value); setValue(v); onChange(cmd, v); }}
        style={{
          width: '100%', height: '4px', appearance: 'none', WebkitAppearance: 'none',
          background: `linear-gradient(to right, #6366f1 ${((value - (cmd.min || 0)) / ((cmd.max || 1) - (cmd.min || 0))) * 100}%, rgba(255,255,255,0.1) 0%)`,
          borderRadius: '2px', outline: 'none', cursor: 'pointer',
        }}
      />
    </div>
  );
}
