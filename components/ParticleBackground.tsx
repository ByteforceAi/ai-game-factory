'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  vx: number;
  vy: number;
  pulse: number;
  pulseSpeed: number;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    let animId = 0;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      canvas!.style.width = W + 'px';
      canvas!.style.height = H + 'px';
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // Particles
    const particleCount = Math.min(120, Math.floor(W * H / 8000));
    const particles: Particle[] = [];
    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#a78bfa', '#818cf8'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Nebula orbs (large, slow-moving, ambient)
    const nebulas: Nebula[] = [
      { x: W * 0.2, y: H * 0.3, radius: W * 0.25, color: '99,102,241', alpha: 0.06, vx: 0.15, vy: 0.08, pulse: 0, pulseSpeed: 0.008 },
      { x: W * 0.8, y: H * 0.7, radius: W * 0.3, color: '139,92,246', alpha: 0.05, vx: -0.1, vy: -0.06, pulse: Math.PI, pulseSpeed: 0.006 },
      { x: W * 0.5, y: H * 0.1, radius: W * 0.2, color: '6,182,212', alpha: 0.04, vx: 0.08, vy: 0.12, pulse: Math.PI / 2, pulseSpeed: 0.01 },
    ];

    const connectionDistance = 120;

    function handleMouseMove(e: MouseEvent) {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    }
    function handleTouchMove(e: TouchEvent) {
      mouseRef.current.x = e.touches[0].clientX;
      mouseRef.current.y = e.touches[0].clientY;
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      // Dark gradient background
      const grad = ctx!.createLinearGradient(0, 0, W * 0.5, H);
      grad.addColorStop(0, '#050510');
      grad.addColorStop(0.5, '#0a0a20');
      grad.addColorStop(1, '#080818');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H);

      // Nebulas
      for (const n of nebulas) {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += n.pulseSpeed;
        if (n.x < -n.radius || n.x > W + n.radius) n.vx *= -1;
        if (n.y < -n.radius || n.y > H + n.radius) n.vy *= -1;

        const pulseAlpha = n.alpha + Math.sin(n.pulse) * 0.015;
        const g = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
        g.addColorStop(0, `rgba(${n.color}, ${pulseAlpha})`);
        g.addColorStop(0.5, `rgba(${n.color}, ${pulseAlpha * 0.4})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx!.fillStyle = g;
        ctx!.fillRect(n.x - n.radius, n.y - n.radius, n.radius * 2, n.radius * 2);
      }

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Update & draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        // Mouse interaction — gentle attraction
        const dmx = mx - p.x;
        const dmy = my - p.y;
        const dmDist = Math.sqrt(dmx * dmx + dmy * dmy);
        if (dmDist < 200 && dmDist > 10) {
          p.vx += dmx / dmDist * 0.02;
          p.vy += dmy / dmDist * 0.02;
        }

        // Dampen
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Draw particle
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = p.alpha;
        ctx!.fill();

        // Connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            const lineAlpha = (1 - dist / connectionDistance) * 0.15;
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(p2.x, p2.y);
            ctx!.strokeStyle = p.color;
            ctx!.globalAlpha = lineAlpha;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      // Mouse glow
      if (mx > 0 && my > 0) {
        const mg = ctx!.createRadialGradient(mx, my, 0, mx, my, 150);
        mg.addColorStop(0, 'rgba(99,102,241,0.06)');
        mg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx!.globalAlpha = 1;
        ctx!.fillStyle = mg;
        ctx!.fillRect(mx - 150, my - 150, 300, 300);
      }

      ctx!.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
