'use client';

import { useState } from 'react';

interface ClarifyOption {
  label: string;
  value: string;
}

interface ClarifyQuestion {
  question: string;
  options: ClarifyOption[];
}

interface ClarifyResponse {
  summary: string;
  questions: ClarifyQuestion[];
}

interface GameIdeaWizardProps {
  onGenerate: (enrichedPrompt: string) => void;
  onBack: () => void;
}

type Step = 'input' | 'loading' | 'questions' | 'summary';

export default function GameIdeaWizard({ onGenerate, onBack }: GameIdeaWizardProps) {
  const [step, setStep] = useState<Step>('input');
  const [idea, setIdea] = useState('');
  const [clarifyData, setClarifyData] = useState<ClarifyResponse | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedLabels, setSelectedLabels] = useState<Record<number, string>>({});
  const [error, setError] = useState('');

  const askClarify = async () => {
    if (!idea.trim()) return;
    setStep('loading');
    setError('');

    try {
      const res = await fetch('/api/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'API 오류');
      }

      const data: ClarifyResponse = await res.json();
      setClarifyData(data);
      setStep('questions');
    } catch (err) {
      setError(err instanceof Error ? err.message : '질문 생성에 실패했습니다.');
      setStep('input');
    }
  };

  const selectOption = (qIndex: number, value: string, label: string) => {
    setAnswers(prev => ({ ...prev, [qIndex]: value }));
    setSelectedLabels(prev => ({ ...prev, [qIndex]: label }));
  };

  const allAnswered = clarifyData
    ? Object.keys(answers).length === clarifyData.questions.length
    : false;

  const goToSummary = () => {
    if (allAnswered) setStep('summary');
  };

  const buildEnrichedPrompt = (): string => {
    const parts = [idea.trim()];
    if (clarifyData) {
      clarifyData.questions.forEach((q, i) => {
        if (answers[i]) {
          parts.push(answers[i]);
        }
      });
    }
    return parts.join('. ') + '.';
  };

  const handleGenerate = () => {
    onGenerate(buildEnrichedPrompt());
  };

  return (
    <div className="max-w-[640px] mx-auto animate-fade-in">
      <button
        onClick={onBack}
        className="mb-5 text-[13px] text-glass-text-secondary hover:text-glass-text transition-colors"
      >
        ← 돌아가기
      </button>

      {/* Step 1: Idea Input */}
      {step === 'input' && (
        <div className="liquid-glass p-6 md:p-8 animate-slide-up">
          <div className="relative z-10">
            {/* Chat-like bubble */}
            <div className="flex gap-3 mb-6">
              <div className="w-9 h-9 rounded-full bg-glass-accent/15 flex items-center justify-center shrink-0">
                <span className="text-glass-accent text-sm">AI</span>
              </div>
              <div className="liquid-glass-sm px-4 py-3 flex-1">
                <p className="text-[14px] text-glass-text leading-relaxed">
                  어떤 게임을 만들고 싶으세요? 간단히 설명해주세요!
                  <br />
                  <span className="text-glass-text-secondary text-[12px]">
                    예: &ldquo;좀비를 피해 도망치는 서바이벌 게임&rdquo;
                  </span>
                </p>
              </div>
            </div>

            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="예: 좀비를 피해 도망치는 서바이벌 게임"
              rows={3}
              className="w-full p-4 bg-black/[0.03] border border-black/[0.06] rounded-[14px] text-glass-text text-[15px] leading-relaxed resize-none transition-all focus:outline-none focus:border-glass-accent/40 focus:bg-white/80 focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-glass-text-muted"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  askClarify();
                }
              }}
            />

            <button
              onClick={askClarify}
              disabled={!idea.trim()}
              className="w-full mt-4 py-3.5 btn-glass text-[15px]"
            >
              💬 AI와 대화하며 게임 디자인하기
            </button>

            {error && (
              <div className="mt-4 p-4 bg-glass-red/10 border border-glass-red/20 rounded-[14px] text-glass-red text-[13px]">
                {error}
              </div>
            )}

            {/* Quick examples */}
            <div className="mt-6">
              <span className="text-[12px] text-glass-text-muted font-medium">빠른 시작</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  '좀비 서바이벌 탑다운 슈터',
                  '물리 기반 퍼즐 게임',
                  '리듬에 맞춰 노트를 치는 게임',
                  '로그라이크 던전 탐험',
                ].map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setIdea(ex)}
                    className="liquid-glass-pill px-3 py-1.5 text-[12px] text-glass-text-secondary hover:text-glass-text cursor-pointer"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {step === 'loading' && (
        <div className="liquid-glass p-8 text-center animate-slide-up">
          <div className="relative z-10">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-glass-accent/10 flex items-center justify-center animate-pulse">
              <span className="text-glass-accent text-xl">🤔</span>
            </div>
            <p className="text-[15px] font-medium text-glass-text">AI가 게임 디자인을 분석하고 있어요...</p>
            <p className="text-[13px] text-glass-text-secondary mt-1">맞춤형 질문을 준비 중입니다</p>
          </div>
        </div>
      )}

      {/* Step 2: Questions */}
      {step === 'questions' && clarifyData && (
        <div className="space-y-4 animate-slide-up">
          {/* AI summary bubble */}
          <div className="liquid-glass p-5">
            <div className="relative z-10 flex gap-3">
              <div className="w-9 h-9 rounded-full bg-glass-accent/15 flex items-center justify-center shrink-0">
                <span className="text-glass-accent text-sm">AI</span>
              </div>
              <div>
                <p className="text-[14px] text-glass-text leading-relaxed">
                  {clarifyData.summary}
                </p>
                <p className="text-[12px] text-glass-text-secondary mt-1">
                  몇 가지만 더 알려주시면 더 멋진 게임을 만들 수 있어요!
                </p>
              </div>
            </div>
          </div>

          {/* Questions */}
          {clarifyData.questions.map((q, qIdx) => (
            <div key={qIdx} className="liquid-glass p-5 animate-slide-up" style={{ animationDelay: `${qIdx * 150}ms` }}>
              <div className="relative z-10">
                <p className="text-[14px] font-medium text-glass-text mb-3">
                  {q.question}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => selectOption(qIdx, opt.value, opt.label)}
                      className={`p-3 rounded-[12px] text-[13px] text-left transition-all border ${
                        answers[qIdx] === opt.value
                          ? 'bg-glass-accent/10 border-glass-accent/40 text-glass-accent font-medium shadow-sm'
                          : 'bg-black/[0.02] border-black/[0.06] text-glass-text-secondary hover:bg-black/[0.04] hover:border-black/[0.1]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Continue button */}
          <button
            onClick={goToSummary}
            disabled={!allAnswered}
            className={`w-full py-3.5 rounded-[14px] text-[15px] font-medium transition-all ${
              allAnswered
                ? 'btn-glass'
                : 'bg-black/[0.03] text-glass-text-muted cursor-not-allowed'
            }`}
          >
            {allAnswered ? '✨ 게임 설계서 확인하기' : `${Object.keys(answers).length}/${clarifyData.questions.length} 선택 완료`}
          </button>
        </div>
      )}

      {/* Step 3: Summary & Generate */}
      {step === 'summary' && clarifyData && (
        <div className="space-y-4 animate-slide-up">
          <div className="liquid-glass p-6">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">📋</span>
                <h3 className="text-[16px] font-semibold text-glass-text">게임 설계서</h3>
              </div>

              <div className="space-y-3">
                <div className="bg-black/[0.03] rounded-[10px] p-3">
                  <p className="text-[11px] text-glass-text-muted font-medium mb-1">아이디어</p>
                  <p className="text-[14px] text-glass-text">{idea}</p>
                </div>

                {clarifyData.questions.map((q, qIdx) => (
                  <div key={qIdx} className="bg-black/[0.03] rounded-[10px] p-3">
                    <p className="text-[11px] text-glass-text-muted font-medium mb-1">{q.question}</p>
                    <p className="text-[14px] text-glass-accent font-medium">
                      {selectedLabels[qIdx] || answers[qIdx]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('questions')}
              className="flex-1 py-3.5 btn-glass-secondary text-[14px]"
            >
              ← 다시 선택
            </button>
            <button
              onClick={handleGenerate}
              className="flex-[2] py-3.5 btn-glass text-[15px]"
            >
              🚀 이 게임 만들기!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
