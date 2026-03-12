'use client';

const EXAMPLE_IDEAS = [
  '우주선이 운석을 피하는 게임 만들어줘',
  '뱀이 사과를 먹으며 커지는 게임',
  '공이 벽돌을 깨는 브레이크아웃 게임',
  '좌우로 움직이며 떨어지는 아이템을 받는 게임',
];

interface GameIdeaInputProps {
  idea: string;
  setIdea: (idea: string) => void;
  onGenerate: () => void;
  generating: boolean;
  error: string;
}

export default function GameIdeaInput({
  idea,
  setIdea,
  onGenerate,
  generating,
  error,
}: GameIdeaInputProps) {
  return (
    <div className="liquid-glass p-6 md:p-8 animate-slide-up">
      <div className="relative z-10">
        <h2 className="text-lg font-semibold text-glass-text mb-1 tracking-tight">
          게임 아이디어
        </h2>
        <p className="text-[13px] text-glass-text-secondary mb-5">
          원하는 게임을 설명해주세요. AI가 즉시 플레이 가능한 게임을 생성합니다.
        </p>

        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="예: 우주선이 운석을 피하는 게임 만들어줘"
          rows={3}
          className="w-full p-4 bg-black/[0.03] border border-black/[0.06] rounded-[14px] text-glass-text text-[15px] leading-relaxed resize-none transition-all focus:outline-none focus:border-glass-accent/40 focus:bg-white/80 focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-glass-text-muted"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onGenerate();
            }
          }}
        />

        <button
          onClick={onGenerate}
          disabled={!idea.trim() || generating}
          className="w-full mt-4 py-3.5 btn-glass text-[15px]"
        >
          ⚡ 게임 생성하기
        </button>

        {error && (
          <div className="mt-4 p-4 bg-glass-red/10 border border-glass-red/20 rounded-[14px] text-glass-red text-[13px]">
            {error}
          </div>
        )}

        <div className="mt-6">
          <span className="text-[12px] text-glass-text-muted font-medium tracking-wide">
            예시 아이디어
          </span>
          <div className="flex flex-wrap gap-2 mt-2.5">
            {EXAMPLE_IDEAS.map((ex, i) => (
              <button
                key={i}
                onClick={() => setIdea(ex)}
                className="liquid-glass-pill px-4 py-2 text-[13px] text-glass-text-secondary hover:text-glass-text cursor-pointer"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
