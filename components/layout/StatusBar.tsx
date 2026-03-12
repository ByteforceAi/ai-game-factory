'use client';

export default function StatusBar() {
  return (
    <footer className="flex items-center justify-between px-3 h-[22px] bg-ctp-crust border-t border-ctp-surface0 text-[10px] font-mono shrink-0 select-none">
      <div className="flex items-center gap-3">
        <span className="text-ctp-subtext0">AI Game Factory</span>
        <span className="text-ctp-overlay0">v1.0</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-ctp-green animate-pulse-dot" />
          <span className="text-ctp-overlay0">Connected</span>
        </div>
        <span className="text-ctp-overlay0">Claude Sonnet</span>
      </div>
    </footer>
  );
}
