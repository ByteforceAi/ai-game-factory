'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';

interface PlayClientProps {
  gameHtml: string;
  gameTitle: string;
}

export default function PlayClient({ gameHtml, gameTitle }: PlayClientProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(gameHtml);
        doc.close();
      }
    }
  }, [gameHtml]);

  const restartGame = () => {
    if (iframeRef.current?.contentDocument) {
      const doc = iframeRef.current.contentDocument;
      doc.open();
      doc.write(gameHtml);
      doc.close();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <header className="relative z-10 pt-8 pb-4 text-center">
        <Link href="/">
          <h1 className="font-orbitron text-xl md:text-2xl font-extrabold tracking-[6px] bg-gradient-to-r from-cyber-cyan via-cyber-text to-cyber-cyan bg-clip-text text-transparent">
            AI GAME FACTORY
          </h1>
        </Link>
        <p className="font-mono text-[11px] text-cyber-cyan/50 tracking-[2px] mt-1">
          {gameTitle}
        </p>
      </header>

      <main className="relative z-10 max-w-[700px] mx-auto px-4 pb-16">
        <div className="glass-card overflow-hidden hud-bracket">
          <div className="flex items-center justify-between px-5 py-3 border-b border-cyber-cyan/10 bg-black/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyber-green shadow-[0_0_6px_rgba(0,230,118,0.5)]" />
              <span className="font-orbitron text-[11px] text-cyber-cyan tracking-[2px]">
                SHARED.GAME
              </span>
            </div>
          </div>
          <div className="p-4 flex justify-center bg-black/20">
            <iframe
              ref={iframeRef}
              title="shared-game"
              sandbox="allow-scripts"
              className="w-full max-w-[620px] h-[440px] border border-cyber-cyan/10 rounded-lg bg-black"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4 justify-center">
          <Link
            href="/"
            className="px-5 py-3 bg-cyber-cyan/8 border border-cyber-cyan/20 rounded-lg text-cyber-cyan text-[13px] font-orbitron tracking-[2px] transition-all hover:bg-cyber-cyan/15 hover:shadow-[0_0_20px_rgba(0,229,255,0.2)]"
          >
            ← 나도 만들기
          </Link>
          <button
            onClick={restartGame}
            className="px-5 py-3 btn-neon text-[13px]"
          >
            ↻ 다시 시작
          </button>
        </div>
      </main>

      <footer className="relative z-10 text-center pb-8">
        <div className="w-48 h-px mx-auto mb-4 bg-gradient-to-r from-transparent via-cyber-cyan/20 to-transparent" />
        <span className="font-mono text-[10px] text-cyber-text/20 tracking-[3px]">
          POWERED BY BYTEFORCE × CLAUDE AI
        </span>
      </footer>
    </div>
  );
}
