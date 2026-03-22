'use client';

interface Chip {
  icon: string;
  label: string;
  prompt: string;
}

interface SuggestionChipsProps {
  chips: readonly Chip[];
  onSelect: (prompt: string) => void;
  className?: string;
  size?: 'normal' | 'small';
}

export default function SuggestionChips({
  chips,
  onSelect,
  className = '',
  size = 'normal',
}: SuggestionChipsProps) {
  const isSmall = size === 'small';

  return (
    <div
      className={`flex flex-wrap gap-2 justify-center max-w-[520px] mx-auto ${className}`}
    >
      {chips.map((chip) => (
        <button
          key={chip.prompt}
          onClick={() => onSelect(chip.prompt)}
          className="flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:text-[var(--text-primary)] hover:border-[#666] hover:bg-[var(--bg-tertiary)]"
          style={{
            padding: isSmall ? '6px 14px' : '8px 16px',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
            fontSize: isSmall ? '12px' : '13px',
          }}
        >
          <span className="text-sm">{chip.icon}</span>
          {chip.label}
        </button>
      ))}
    </div>
  );
}
