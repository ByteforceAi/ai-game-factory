'use client';

import { useState, useEffect, useRef } from 'react';
import { SCENARIOS, CATEGORIES, type Scenario } from '@/lib/scenarios';
import { playTick, playSelect } from '@/lib/sounds';

interface WelcomeProps {
  userName: string;
  onStartChat: (initialPrompt?: string, typingPrompt?: string) => void;
}

export default function Welcome({ userName, onStartChat }: WelcomeProps) {
  const [active, setActive] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cardsVisible, setCardsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleCategoryClick = (catId: string) => {
    if (selectedCategory === catId) return;
    playTick();
    setCardsVisible(false);
    setSelectedCategory(catId);
    // Stagger delay before showing cards
    setTimeout(() => setCardsVisible(true), 80);
  };

  const handleCardClick = (scenario: Scenario) => {
    playSelect();
    setFadeOut(true);
    // Transition to chat with typing prompt (student must type it)
    setTimeout(() => onStartChat(undefined, scenario.prompt), 400);
  };

  const handleDirectInput = () => {
    setFadeOut(true);
    setTimeout(() => onStartChat(), 400);
  };

  const filteredScenarios = selectedCategory
    ? SCENARIOS.filter((s) => s.category === selectedCategory)
    : [];

  return (
    <div
      className={`fixed inset-0 z-[999] flex flex-col items-center transition-all duration-500 ease-out ${
        active && !fadeOut
          ? 'opacity-100 scale-100 pointer-events-auto'
          : fadeOut
          ? 'opacity-0 scale-[1.02] pointer-events-none'
          : 'opacity-0 scale-[0.98] pointer-events-none'
      }`}
      style={{ background: 'var(--bg-deep)', overflow: 'auto' }}
    >
      {/* Ambient aurora */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute left-1/2 animate-[ambientBreath_6s_ease-in-out_infinite]"
          style={{
            bottom: '-20%',
            transform: 'translateX(-50%)',
            width: 800,
            height: 500,
            background: 'radial-gradient(ellipse, rgba(34,197,94,0.04) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="w-full max-w-[900px] px-6 pt-16 pb-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          {/* Status dot */}
          <div
            className="w-2 h-2 rounded-full mx-auto mb-4 animate-[pulseText_2s_infinite_alternate]"
            style={{
              background: '#22c55e',
              boxShadow: '0 0 10px rgba(34,197,94,0.5)',
            }}
          />
          <h1
            className="text-[2rem] font-light tracking-tight mb-3"
            style={{ fontFamily: "'Space Grotesk', 'Noto Sans KR', sans-serif" }}
          >
            반가워요,{' '}
            <strong
              className="font-semibold"
              style={{
                background: 'linear-gradient(to right, #22c55e, #00f3ff)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {userName}
            </strong>
            님
          </h1>
          <p
            className="text-[0.95rem] font-light"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            오늘은 어떤 걸 만들어볼까요?
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-3 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="pressable px-5 py-2.5 rounded-full text-[0.9rem] cursor-pointer"
              style={{
                background:
                  selectedCategory === cat.id
                    ? 'rgba(0,243,255,0.08)'
                    : 'rgba(255,255,255,0.03)',
                border: `1px solid ${
                  selectedCategory === cat.id
                    ? 'rgba(0,243,255,0.3)'
                    : 'rgba(255,255,255,0.08)'
                }`,
                color:
                  selectedCategory === cat.id
                    ? '#fff'
                    : 'rgba(255,255,255,0.5)',
                fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
                backdropFilter: 'blur(10px)',
                boxShadow:
                  selectedCategory === cat.id
                    ? '0 0 20px rgba(0,243,255,0.1)'
                    : 'none',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Card Grid — appears on category click with stagger */}
        {selectedCategory && (
          <div className="grid grid-cols-3 max-[720px]:grid-cols-2 gap-2.5 mb-8">
            {filteredScenarios.map((scenario, idx) => (
              <ModuleCard
                key={scenario.id}
                scenario={scenario}
                visible={cardsVisible}
                delay={idx * 50}
                onClick={() => handleCardClick(scenario)}
              />
            ))}
          </div>
        )}

        {/* No category selected — prompt to choose */}
        {!selectedCategory && (
          <div
            className="text-center py-16 animate-[fadeInUp_0.6s_ease_forwards]"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            <div className="text-[2rem] mb-3 animate-bounce">↑</div>
            <div className="text-[0.9rem] font-light">
              위에서 먼저 카테고리를 골라주세요
            </div>
          </div>
        )}

        {/* Bottom: direct input */}
        <div className="text-center mt-4">
          <div className="flex items-center justify-center mb-4" style={{ color: 'rgba(255,255,255,0.15)' }}>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="px-4 text-[0.75rem] tracking-[2px] uppercase font-mono">
              or type your own
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>
          <button
            onClick={handleDirectInput}
            className="pressable px-6 py-3 rounded-full text-[0.9rem] cursor-pointer hover:border-[rgba(255,255,255,0.3)]"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.55)',
              fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
              backdropFilter: 'blur(10px)',
            }}
          >
            직접 아이디어를 입력하기 →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Module Card with stagger animation + aurora hover ──
function ModuleCard({
  scenario,
  visible,
  delay,
  onClick,
}: {
  scenario: Scenario;
  visible: boolean;
  delay: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="module-card-hover group relative text-left rounded-[12px] cursor-pointer overflow-hidden transition-all duration-400"
      style={{
        background: 'rgba(20,20,25,0.5)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '14px 16px',
        fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `all 0.4s cubic-bezier(0.25,1,0.5,1) ${delay}ms`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-2px)';
        el.style.background = 'rgba(30,30,40,0.7)';
        el.style.borderColor = 'rgba(34,197,94,0.15)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0)';
        el.style.background = 'rgba(20,20,25,0.5)';
        el.style.borderColor = 'rgba(255,255,255,0.06)';
      }}
      // 눌림 피드백 — 터치/마우스 공통 (inline transform이라 :active로는 못 덮음)
      onPointerDown={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'scale(0.97)';
        el.style.borderColor = 'rgba(34,197,94,0.35)';
      }}
      onPointerUp={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-2px)';
      }}
      onPointerCancel={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0)';
      }}
    >
      <div
        className="text-[0.85rem] font-medium tracking-tight transition-colors duration-300 group-hover:text-[#22c55e]"
        style={{ color: '#fff' }}
      >
        {scenario.title}
      </div>
    </button>
  );
}
