'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/',
    label: '홈',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/?view=create',
    label: '만들기',
    matchPath: '/',
    matchQuery: 'create',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    href: '/gallery',
    label: '갤러리',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
];

export default function ActivityBar() {
  const pathname = usePathname();

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.href === '/gallery') return pathname === '/gallery';
    if (item.href === '/?view=create') return false; // handled by page state
    return pathname === '/' && item.href === '/';
  };

  return (
    <>
      {/* Desktop: left sidebar */}
      <aside className="hidden md:flex flex-col items-center w-12 bg-ctp-crust border-r border-ctp-surface0 py-2 gap-1 shrink-0">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`w-10 h-10 flex items-center justify-center rounded transition-colors relative group ${
              isActive(item)
                ? 'text-ctp-text bg-ctp-surface0'
                : 'text-ctp-overlay0 hover:text-ctp-subtext0 hover:bg-ctp-surface0/50'
            }`}
          >
            {isActive(item) && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-ctp-blue rounded-r" />
            )}
            {item.icon}
            {/* Tooltip */}
            <span className="absolute left-full ml-2 px-2 py-1 bg-ctp-surface0 text-ctp-text text-xs font-mono rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </span>
          </Link>
        ))}
      </aside>

      {/* Mobile: top horizontal bar */}
      <nav className="md:hidden flex items-center justify-around bg-ctp-crust border-b border-ctp-surface0 h-11 shrink-0">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              isActive(item)
                ? 'text-ctp-blue bg-ctp-surface0'
                : 'text-ctp-overlay0 hover:text-ctp-subtext0'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
