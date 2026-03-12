'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 pb-2">
      <nav className="max-w-[900px] mx-auto">
        <div className="liquid-glass-sm px-5 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-glass-accent to-glass-indigo flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-glass-accent/15">
              G
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-glass-text group-hover:text-glass-accent transition-colors">
              AI Game Factory
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-[10px] text-[13px] font-medium transition-all ${
                pathname === '/'
                  ? 'bg-glass-accent/10 text-glass-accent'
                  : 'text-glass-text-secondary hover:text-glass-text hover:bg-black/[0.03]'
              }`}
            >
              홈
            </Link>
            <Link
              href="/gallery"
              className={`px-4 py-2 rounded-[10px] text-[13px] font-medium transition-all ${
                pathname === '/gallery'
                  ? 'bg-glass-accent/10 text-glass-accent'
                  : 'text-glass-text-secondary hover:text-glass-text hover:bg-black/[0.03]'
              }`}
            >
              갤러리
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
