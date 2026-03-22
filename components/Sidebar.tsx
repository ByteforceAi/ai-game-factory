'use client';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  chatTitle: string;
}

export default function Sidebar({
  collapsed,
  onToggle,
  onNewChat,
  chatTitle,
}: SidebarProps) {
  return (
    <div
      className="h-full flex flex-col transition-all duration-300 ease-out"
      style={{
        width: collapsed ? 0 : 260,
        minWidth: collapsed ? 0 : 260,
        background: 'var(--bg-sidebar)',
        borderRight: collapsed ? 'none' : '1px solid var(--border)',
        overflow: collapsed ? 'hidden' : undefined,
      }}
    >
      {/* Top */}
      <div className="p-3 flex items-center justify-between">
        <button
          onClick={onToggle}
          title="사이드바 접기"
          className="w-8 h-8 rounded-claude-sm flex items-center justify-center text-lg text-[var(--text-secondary)] hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-primary)] transition-all duration-200 cursor-pointer"
          style={{ border: 'none', background: 'transparent' }}
        >
          ☰
        </button>
        <button
          onClick={onNewChat}
          title="새 대화"
          className="w-8 h-8 rounded-claude-sm flex items-center justify-center text-lg text-[var(--text-secondary)] hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-primary)] transition-all duration-200 cursor-pointer"
          style={{ border: 'none', background: 'transparent' }}
        >
          ✎
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        <div
          className="text-[11px] font-medium px-2 pt-3 pb-1.5"
          style={{ color: 'var(--text-muted)' }}
        >
          오늘
        </div>
        <div
          className="px-3 py-2 rounded-claude-sm text-sm truncate"
          style={{
            background: 'var(--bg-sidebar-active)',
            color: 'var(--text-primary)',
          }}
        >
          {chatTitle || '새 대화'}
        </div>
      </div>
    </div>
  );
}
