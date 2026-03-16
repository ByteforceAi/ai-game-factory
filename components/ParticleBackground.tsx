'use client';

import { useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════
   ParticleBackground — CSS animated gradient
   GitHub Education bright style (replaces Three.js)
   ═══════════════════════════════════════════════ */
export default function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mouse parallax for subtle blob movement
    const container = containerRef.current;
    if (!container) return;

    let mouseX = 0;
    let mouseY = 0;
    let rafId = 0;

    const handleMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 20;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 20;
    };

    const animate = () => {
      const blobs = container.querySelectorAll<HTMLDivElement>('.gradient-blob');
      blobs.forEach((blob, i) => {
        const factor = (i + 1) * 0.3;
        blob.style.transform = `translate(${mouseX * factor}px, ${mouseY * factor}px)`;
      });
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMove);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 25%, #ede9fe 50%, #fce7f3 75%, #dbeafe 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 16s ease infinite',
      }}
    >
      {/* Floating soft blobs for depth */}
      <div
        className="gradient-blob"
        style={{
          position: 'absolute',
          top: '10%',
          left: '15%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          animation: 'floatBlob 20s ease-in-out infinite',
          transition: 'transform 0.3s ease-out',
        }}
      />
      <div
        className="gradient-blob"
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)',
          animation: 'floatBlob 25s ease-in-out infinite reverse',
          transition: 'transform 0.3s ease-out',
        }}
      />
      <div
        className="gradient-blob"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
          animation: 'floatBlob 18s ease-in-out 3s infinite',
          transition: 'transform 0.3s ease-out',
        }}
      />

      {/* Subtle noise overlay for texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />
    </div>
  );
}
