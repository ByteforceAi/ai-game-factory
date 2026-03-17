'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/* ═══════════════════════════════════════════════
   LaunchPortal — Full-screen cinematic overlay
   with Canvas particle vortex + launch sequence.
   ═══════════════════════════════════════════════ */

interface SummaryChoice {
  slotLabel: string;
  choiceLabel: string;
}

interface LaunchPortalProps {
  gameName: string;
  gameIcon: string;
  choices: SummaryChoice[];
  onLaunch: () => void;
}

/* ── Particle structure ── */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
  hue: number;
  type: 'vortex' | 'ring' | 'spark';
}

export default function LaunchPortal({ gameName, gameIcon, choices, onLaunch }: LaunchPortalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: 0, y: 0 });
  const [phase, setPhase] = useState<'enter' | 'ready' | 'charging' | 'launch' | 'warp'>('enter');
  const [chargeLevel, setChargeLevel] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const chargeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number>(0);
  const launchCalled = useRef(false);
  const timeRef = useRef(0);

  /* ── Spawn particles ── */
  const spawnParticle = useCallback((cx: number, cy: number, type: Particle['type'] = 'vortex') => {
    const angle = Math.random() * Math.PI * 2;
    const dist = type === 'ring' ? 120 + Math.random() * 30 : 200 + Math.random() * 300;
    const speed = type === 'spark' ? 3 + Math.random() * 5 : 0.3 + Math.random() * 0.8;
    const hue = type === 'spark' ? 180 + Math.random() * 40 : Math.random() * 360;
    const life = type === 'spark' ? 20 + Math.random() * 30 : 80 + Math.random() * 120;

    particles.current.push({
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: -Math.cos(angle) * speed,
      vy: -Math.sin(angle) * speed,
      r: type === 'spark' ? 1 + Math.random() * 2 : 1.5 + Math.random() * 2.5,
      life,
      maxLife: life,
      hue,
      type,
    });
  }, []);

  /* ── Canvas animation loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let w = 0, h = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth * devicePixelRatio;
      h = canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const cx = () => window.innerWidth / 2;
    const cy = () => window.innerHeight / 2;

    const animate = () => {
      timeRef.current++;
      const t = timeRef.current;
      const centerX = cx();
      const centerY = cy();

      // Clear with fade trail
      ctx.fillStyle = 'rgba(5,5,16,0.15)';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // Spawn new particles
      if (t % 2 === 0 && particles.current.length < 300) {
        spawnParticle(centerX, centerY, 'vortex');
      }
      if (t % 5 === 0 && particles.current.length < 350) {
        spawnParticle(centerX, centerY, 'ring');
      }

      // Update & draw particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        const dx = centerX - p.x;
        const dy = centerY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Gravitational pull toward center
        const gravity = p.type === 'spark' ? 0 : 0.02 + (0.5 / dist) * 8;
        p.vx += (dx / dist) * gravity;
        p.vy += (dy / dist) * gravity;

        // Tangential (swirl) force
        if (p.type !== 'spark') {
          p.vx += (-dy / dist) * 0.15;
          p.vy += (dx / dist) * 0.15;
        }

        // Damping
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.life <= 0 || dist < 8) {
          particles.current.splice(i, 1);
          continue;
        }

        const alpha = Math.min(1, p.life / p.maxLife) * (p.type === 'ring' ? 0.6 : 0.8);
        const size = p.r * (p.life / p.maxLife);

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${alpha})`;
        ctx.fill();

        // Glow for close particles
        if (dist < 100 && p.type === 'vortex') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${alpha * 0.15})`;
          ctx.fill();
        }
      }

      // Central energy ring
      const ringPulse = 0.5 + 0.5 * Math.sin(t * 0.05);
      const ringRadius = 50 + ringPulse * 10;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, ringRadius);
      gradient.addColorStop(0, `rgba(0,200,255,${0.05 + ringPulse * 0.05})`);
      gradient.addColorStop(0.6, `rgba(88,86,214,${0.03 + ringPulse * 0.03})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Ring outline
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,200,255,${0.08 + ringPulse * 0.08})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Outer ring
      const outerR = 90 + ringPulse * 5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(88,86,214,${0.04 + ringPulse * 0.04})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [spawnParticle]);

  /* ── Enter animation ── */
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('ready'), 100);
    const t2 = setTimeout(() => setShowContent(true), 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* ── Charge on hold (long press for dramatic effect) ── */
  const startCharge = useCallback(() => {
    if (phase !== 'ready' || launchCalled.current) return;
    setPhase('charging');
    setChargeLevel(0);

    let level = 0;
    chargeTimer.current = setInterval(() => {
      level += 2.5;
      setChargeLevel(Math.min(level, 100));

      // Spawn sparks during charge
      const canvas = canvasRef.current;
      if (canvas) {
        for (let i = 0; i < 3; i++) {
          spawnParticle(window.innerWidth / 2, window.innerHeight / 2, 'spark');
        }
      }

      if (level >= 100) {
        if (chargeTimer.current) clearInterval(chargeTimer.current);
        triggerLaunch();
      }
    }, 30);
  }, [phase, spawnParticle]);

  const cancelCharge = useCallback(() => {
    if (phase !== 'charging') return;
    if (chargeTimer.current) clearInterval(chargeTimer.current);
    setChargeLevel(0);
    setPhase('ready');
  }, [phase]);

  /* ── Tap to launch (instant) ── */
  const handleTap = useCallback(() => {
    if (phase !== 'ready' || launchCalled.current) return;
    triggerLaunch();
  }, [phase]);

  const triggerLaunch = useCallback(() => {
    if (launchCalled.current) return;
    launchCalled.current = true;
    setPhase('launch');
    setChargeLevel(100);

    // Explosion burst
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 10;
      particles.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 2 + Math.random() * 3,
        life: 40 + Math.random() * 40,
        maxLife: 80,
        hue: 190 + Math.random() * 30,
        type: 'spark',
      });
    }

    // Warp phase after short delay
    setTimeout(() => setPhase('warp'), 600);
    setTimeout(() => onLaunch(), 1200);
  }, [onLaunch]);

  /* Cleanup */
  useEffect(() => {
    return () => { if (chargeTimer.current) clearInterval(chargeTimer.current); };
  }, []);

  const isWarp = phase === 'warp' || phase === 'launch';

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        opacity: phase === 'enter' ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }}
      onMouseMove={(e) => { mouse.current = { x: e.clientX, y: e.clientY }; }}
    >
      {/* ── Canvas particle layer ── */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: '#050510',
        }}
      />

      {/* ── Warp speed lines ── */}
      {isWarp && (
        <div className="warp-lines" style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
        }} />
      )}

      {/* ── Content card ── */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        padding: '0 24px',
        maxWidth: '380px',
        width: '100%',
        opacity: showContent && !isWarp ? 1 : 0,
        transform: showContent && !isWarp
          ? 'translateY(0) scale(1)'
          : isWarp
            ? 'translateY(0) scale(1.5)'
            : 'translateY(30px) scale(0.9)',
        transition: isWarp
          ? 'all 0.5s cubic-bezier(0.16,1,0.3,1)'
          : 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Game icon + name */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            fontSize: '52px',
            filter: 'drop-shadow(0 0 20px rgba(0,122,255,0.4))',
            animation: 'portalFloat 3s ease-in-out infinite',
          }}>
            {gameIcon}
          </div>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 700,
            color: '#F5F5F7',
            letterSpacing: '-0.5px',
            textAlign: 'center',
            textShadow: '0 0 20px rgba(0,122,255,0.3)',
          }}>
            {gameName}
          </h2>
        </div>

        {/* Choice chips */}
        {choices.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
          }}>
            {choices.map((c, i) => (
              <span
                key={i}
                style={{
                  padding: '6px 14px',
                  borderRadius: '12px',
                  background: 'rgba(0,122,255,0.12)',
                  border: '1px solid rgba(0,122,255,0.20)',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '13px',
                  fontWeight: 500,
                  letterSpacing: '-0.2px',
                  animation: `chipReveal 0.5s cubic-bezier(0.16,1,0.3,1) ${0.6 + i * 0.08}s both`,
                }}
              >
                {c.choiceLabel}
              </span>
            ))}
          </div>
        )}

        {/* Launch button area */}
        <div style={{
          marginTop: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          width: '100%',
        }}>
          {/* Charge ring */}
          <div style={{ position: 'relative', width: '120px', height: '120px' }}>
            {/* Background ring */}
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              style={{
                position: 'absolute',
                inset: 0,
                transform: 'rotate(-90deg)',
                filter: 'drop-shadow(0 0 10px rgba(0,200,255,0.3))',
              }}
            >
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="3"
              />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="url(#chargeGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - chargeLevel / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.1s linear' }}
              />
              <defs>
                <linearGradient id="chargeGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00C8FF" />
                  <stop offset="50%" stopColor="#5856D6" />
                  <stop offset="100%" stopColor="#00FF88" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center button */}
            <button
              onClick={handleTap}
              onMouseDown={startCharge}
              onMouseUp={cancelCharge}
              onMouseLeave={cancelCharge}
              onTouchStart={startCharge}
              onTouchEnd={(e) => { e.preventDefault(); cancelCharge(); }}
              style={{
                position: 'absolute',
                inset: '12px',
                borderRadius: '50%',
                background: phase === 'charging'
                  ? `radial-gradient(circle, rgba(0,200,255,${0.2 + chargeLevel * 0.003}) 0%, rgba(88,86,214,0.15) 100%)`
                  : 'radial-gradient(circle, rgba(0,122,255,0.15) 0%, rgba(88,86,214,0.08) 100%)',
                border: '1.5px solid rgba(0,200,255,0.3)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.2s',
                boxShadow: phase === 'charging'
                  ? `0 0 ${20 + chargeLevel * 0.5}px rgba(0,200,255,${0.2 + chargeLevel * 0.005}), inset 0 0 30px rgba(0,200,255,0.05)`
                  : '0 0 20px rgba(0,122,255,0.15), inset 0 0 20px rgba(0,122,255,0.03)',
                transform: phase === 'charging' ? `scale(${0.95 + chargeLevel * 0.001})` : 'scale(1)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              {/* Status dot */}
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: phase === 'charging' ? '#00FF88' : '#00C8FF',
                boxShadow: `0 0 8px ${phase === 'charging' ? '#00FF88' : '#00C8FF'}`,
                animation: 'statusPulse 1.5s ease-in-out infinite',
              }} />
              {/* Icon */}
              <span style={{
                fontSize: '22px',
                textShadow: '0 0 12px rgba(0,200,255,0.6)',
              }}>
                ▶
              </span>
            </button>
          </div>

          {/* Instruction text */}
          <div style={{
            textAlign: 'center',
            animation: 'breathe 2s ease-in-out infinite',
          }}>
            <span style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textShadow: '0 0 10px rgba(0,200,255,0.3)',
            }}>
              {phase === 'charging' ? '충전 중...' : phase === 'launch' ? '발사!' : '탭하여 생성'}
            </span>
            <p style={{
              margin: '6px 0 0',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.5px',
            }}>
              {phase === 'charging'
                ? `${Math.round(chargeLevel)}%`
                : '길게 누르면 차지 이펙트'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Close / back hint ── */}
      {!isWarp && (
        <div style={{
          position: 'absolute',
          top: 'max(16px, env(safe-area-inset-top, 16px))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          opacity: showContent ? 0.4 : 0,
          transition: 'opacity 0.5s 1s',
        }}>
          <span style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}>
            Launch Sequence Ready
          </span>
        </div>
      )}

      {/* ═══ Keyframes ═══ */}
      <style>{`
        @keyframes portalFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes chipReveal {
          from { opacity: 0; transform: translateY(10px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes breathe {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* Warp speed lines */
        .warp-lines {
          background:
            repeating-conic-gradient(
              from 0deg at 50% 50%,
              transparent 0deg,
              rgba(0,200,255,0.03) 0.5deg,
              transparent 1deg
            );
          animation: warpSpin 0.3s linear infinite;
        }

        @keyframes warpSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
