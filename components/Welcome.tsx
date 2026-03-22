'use client';

import { useState, useEffect } from 'react';
import SparkleIcon from './SparkleIcon';
import { SCENARIOS, CATEGORIES, type Scenario } from '@/lib/scenarios';

interface WelcomeProps {
  userName: string;
  onStartChat: (initialPrompt?: string) => void;
}

export default function Welcome({ userName, onStartChat }: WelcomeProps) {
  const [active, setActive] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    'game' | 'math' | 'science' | 'simulation'
  >('game');

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleTransition = (prompt?: string) => {
    setFadeOut(true);
    setTimeout(() => onStartChat(prompt), 400);
  };

  const filteredScenarios = SCENARIOS.filter(
    (s) => s.category === selectedCategory
  );

  return (
    <div
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center transition-all duration-500 ease-out ${
        active && !fadeOut
          ? 'opacity-100 scale-100 pointer-events-auto'
          : fadeOut
          ? 'opacity-0 scale-[1.02] pointer-events-none'
          : 'opacity-0 scale-[0.98] pointer-events-none'
      }`}
      style={{ background: 'var(--bg-primary)', overflow: 'auto' }}
    >
      <div className="w-full max-w-[800px] px-6 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          {/* Cursor block logo */}
          <div className="flex items-center justify-center gap-[2px] mb-4">
            <div
              className="w-3 h-[18px] rounded-[1px] animate-[cursorGlow_2s_ease-in-out_infinite]"
              style={{ background: '#22c55e', boxShadow: '0 0 12px rgba(34,197,94,0.3)' }}
            />
          </div>
          <h1 className="text-[26px] font-medium text-[var(--text-primary)] tracking-tight" style={{ fontFamily: "'Space Grotesk', 'Noto Sans KR', sans-serif" }}>
            환영합니다,{' '}
            <span style={{ color: '#22c55e' }}>{userName}</span>님
          </h1>
          <p className="text-[14px] text-[var(--text-secondary)] mt-2">
            체험하고 싶은 항목을 선택하세요
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="px-4 py-2 rounded-claude-lg text-[13px] font-medium cursor-pointer transition-all duration-200"
              style={{
                background:
                  selectedCategory === cat.id
                    ? 'var(--bg-surface)'
                    : 'transparent',
                border:
                  selectedCategory === cat.id
                    ? '1px solid var(--border-light)'
                    : '1px solid transparent',
                color:
                  selectedCategory === cat.id
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {filteredScenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onClick={() => handleTransition(scenario.prompt)}
            />
          ))}
        </div>

        {/* Bottom: Direct input option */}
        <div className="text-center">
          <button
            onClick={() => handleTransition()}
            className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors duration-200"
            style={{ background: 'none', border: 'none', fontFamily: 'var(--font-body)' }}
          >
            또는 직접 질문하기 →
          </button>
        </div>
      </div>
    </div>
  );
}

function ScenarioCard({
  scenario,
  onClick,
}: {
  scenario: Scenario;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left p-4 rounded-claude-md cursor-pointer transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        fontFamily: 'var(--font-body)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = scenario.accentColor + '66';
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 12px ${scenario.accentColor}22`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div
        className="text-xl mb-2"
        style={{ filter: 'drop-shadow(0 0 4px ' + scenario.accentColor + '44)' }}
      >
        {scenario.icon}
      </div>
      <div className="text-[14px] font-medium text-[var(--text-primary)] mb-1">
        {scenario.title}
      </div>
      <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
        {scenario.description}
      </div>
    </button>
  );
}
