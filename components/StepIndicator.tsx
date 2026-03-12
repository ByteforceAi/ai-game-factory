'use client';

const STEP_LABELS = ['아이디어 입력', '코드 생성', '테스트 & 플레이'];

interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8 px-4">
      {STEP_LABELS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center min-w-[100px] md:min-w-[120px]">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-orbitron font-bold transition-all duration-500 ${
                i === currentStep
                  ? 'bg-gradient-to-br from-cyber-cyan to-[#0088aa] border-2 border-cyber-cyan text-cyber-cyan shadow-[0_0_20px_rgba(0,229,255,0.4)]'
                  : i < currentStep
                  ? 'bg-cyber-cyan/20 border border-cyber-cyan/40 text-cyber-cyan'
                  : 'bg-white/5 border border-white/10 text-white/30'
              }`}
            >
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span
              className={`mt-2 text-[11px] font-body transition-all duration-400 ${
                i <= currentStep ? 'text-cyber-cyan' : 'text-white/30'
              } ${i === currentStep ? 'font-bold tracking-wider' : ''}`}
            >
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div
              className={`w-10 md:w-16 h-px mb-5 transition-all duration-500 ${
                i < currentStep
                  ? 'bg-gradient-to-r from-cyber-cyan to-cyber-cyan/30 shadow-[0_0_6px_rgba(0,229,255,0.3)]'
                  : 'bg-white/10'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
