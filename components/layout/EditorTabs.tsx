'use client';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface EditorTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function EditorTabs({ tabs, activeTab, onTabChange }: EditorTabsProps) {
  return (
    <div className="flex items-center bg-ctp-mantle border-b border-ctp-surface0 h-9 shrink-0 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-1.5 px-4 h-full text-xs font-mono whitespace-nowrap transition-colors border-r border-ctp-surface0 ${
            activeTab === tab.id
              ? 'bg-ctp-base text-ctp-text border-t-2 border-t-ctp-blue'
              : 'bg-ctp-mantle text-ctp-overlay0 hover:text-ctp-subtext0 hover:bg-ctp-surface0/30 border-t-2 border-t-transparent'
          }`}
        >
          {tab.icon && <span className="text-sm">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
      {/* Fill remaining space */}
      <div className="flex-1 bg-ctp-mantle" />
    </div>
  );
}
