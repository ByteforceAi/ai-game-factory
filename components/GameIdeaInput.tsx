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
    <div className="glass-card hud-bracket p-6 md:p-8 animate-[slideUp_0.6s_ease]">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[13px] font-orbitron text-cyber-cyan tracking-[2px]">
          GAME.IDEA.INPUT
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-cyber-cyan/30 to-transparent" />
      </div>

      <p className="text-sm text-cyber-text/60 mb-5 leading-relaxed">
        원하는 게임을 설명해주세요. AI가 즉시 플레이 가능한 게임을 생성합니다.
      </p>

      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="예: 우주선이 운석을 피하는 게임 만들어줘"
        rows={3}
        className="w-full p-4 bg-black/40 border border-cyber-cyan/15 rounded-[10px] text-cyber-text text-[15px] font-body leading-relaxed resize-vertical transition-all focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_20px_rgba(0,229,255,0.2)] placeholder:text-cyber-text/25"
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
        className="w-full mt-4 py-3.5 btn-neon text-[15px]"
      >
        ⚡ 게임 생성하기
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-[13px]">
          {error}
        </div>
      )}

      <div className="mt-6">
        <span className="text-[11px] font-mono text-cyber-cyan/40 tracking-wider">
          // EXAMPLE IDEAS
        </span>
        <div className="flex flex-wrap gap-2 mt-2.5">
          {EXAMPLE_IDEAS.map((ex, i) => (
            <button
              key={i}
              onClick={() => setIdea(ex)}
              className="px-3.5 py-2 bg-cyber-cyan/5 border border-cyber-cyan/12 rounded-md text-cyber-text/60 text-xs font-body cursor-pointer transition-all hover:bg-cyber-cyan/12 hover:text-cyber-cyan hover:border-cyber-cyan/30"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
