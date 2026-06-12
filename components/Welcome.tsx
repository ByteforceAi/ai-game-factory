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
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 50);
    try {
      setSchoolName(
        localStorage.getItem('school-name') || process.env.NEXT_PUBLIC_SCHOOL_NAME || ''
      );
    } catch {}
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
              background: 'var(--accent-primary)',
              boxShadow: '0 0 10px var(--accent-primary-glow)',
            }}
          />
          {schoolName && (
            <div
              className="font-mono text-[10.5px] tracking-[2px] mb-3"
              style={{ color: 'var(--accent-primary)' }}
            >
              {schoolName} · AI 코딩 교실
            </div>
          )}
          <h1
            className="text-[2rem] font-light tracking-tight mb-3"
            style={{ fontFamily: "'Space Grotesk', 'Noto Sans KR', sans-serif" }}
          >
            반가워요,{' '}
            <strong
              className="font-semibold"
              style={{
                background: 'linear-gradient(to right, var(--gradient-hero-from), var(--gradient-hero-to))',
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
            style={{ color: 'var(--text-secondary)' }}
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
              aria-pressed={selectedCategory === cat.id}
              style={{
                // 선택 = 솔리드 채움 — gov 라이트에서도 한눈에 구분 (글로우는 라이트에서 소실)
                background:
                  selectedCategory === cat.id
                    ? 'var(--accent-primary)'
                    : 'var(--bg-tertiary)',
                border: `1px solid ${
                  selectedCategory === cat.id ? 'transparent' : 'var(--border)'
                }`,
                color:
                  selectedCategory === cat.id
                    ? 'var(--on-accent)'
                    : 'var(--text-secondary)',
                fontWeight: selectedCategory === cat.id ? 600 : 400,
                fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
                backdropFilter: 'blur(10px)',
                boxShadow:
                  selectedCategory === cat.id
                    ? '0 0 20px var(--accent-primary-glow)'
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
            style={{ color: 'var(--text-muted)' }}
          >
            <div className="text-[2rem] mb-3 animate-bounce">↑</div>
            <div className="text-[0.9rem] font-light">
              위에서 먼저 카테고리를 골라주세요
            </div>
          </div>
        )}

        {/* Bottom: direct input */}
        <div className="text-center mt-4">
          <div className="flex items-center justify-center mb-4" style={{ color: 'var(--text-muted)' }}>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="px-4 text-[0.75rem] tracking-[2px] uppercase font-mono">
              or type your own
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>
          <button
            onClick={handleDirectInput}
            className="pressable px-6 py-3 rounded-full text-[0.9rem] cursor-pointer hover:border-[var(--accent-primary-dim)]"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)',
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
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        padding: '16px',
        fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
        // 입장 연출은 animation, 인터랙션 피드백은 transition — delay가 호버/눌림까지
        // 지연시키던 버그 분리 (9번째 카드는 호버 반응이 400ms+ 늦었음)
        animation: visible
          ? `fadeInUp 0.4s cubic-bezier(0.25,1,0.5,1) ${delay}ms both`
          : 'none',
        opacity: visible ? undefined : 0,
        transition:
          'transform 0.15s var(--ease-out), background-color 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-2px)';
        el.style.background = 'var(--bg-surface)';
        el.style.borderColor = 'var(--accent-primary-dim)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0)';
        el.style.background = 'var(--bg-tertiary)';
        el.style.borderColor = 'var(--border)';
      }}
      // 눌림 피드백 — 터치/마우스 공통 (inline transform이라 :active로는 못 덮음)
      onPointerDown={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'scale(0.97)';
        el.style.borderColor = 'var(--accent-primary)';
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
      <div className="flex items-start gap-3">
        <span className="text-[1.15rem] leading-none mt-0.5" aria-hidden>
          {scenario.icon}
        </span>
        <div className="min-w-0">
          <div
            className="text-[0.9rem] font-semibold tracking-tight transition-colors duration-300 group-hover:text-[var(--accent-primary)]"
            style={{ color: 'var(--text-primary)' }}
          >
            {scenario.title}
          </div>
          <div
            className="text-[0.78rem] mt-1 leading-snug"
            style={{ color: 'var(--text-secondary)' }}
          >
            {scenario.description}
          </div>
        </div>
      </div>
    </button>
  );
}
