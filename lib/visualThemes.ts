// Visual Theme System — CSS-based transformations that work on ALL games
// These inject <style> blocks and CSS filters into game HTML

export interface VisualTheme {
  id: string;
  label: string;
  icon: string;
  description: string;
  category: ThemeCategory;
  /** CSS to inject into the game <head> */
  css: string;
  /** Optional: wrap body in a filter */
  bodyFilter?: string;
  /** Preview gradient for the card */
  preview: string;
  /** Optional pattern overlay for richer thumbnail preview */
  previewPattern?: 'dots' | 'grid' | 'scanlines' | 'noise' | 'diagonal' | 'none';
}

export type ThemeCategory =
  | 'color'      // 컬러 테마
  | 'effect'     // 시각 효과
  | 'overlay'    // 오버레이
  | 'typography' // 폰트/텍스트
  | 'mood';      // 분위기

export const CATEGORY_LABELS: Record<ThemeCategory, { label: string; icon: string }> = {
  color: { label: '컬러', icon: '🎨' },
  effect: { label: '이펙트', icon: '✨' },
  overlay: { label: '오버레이', icon: '🌧️' },
  typography: { label: '타이포', icon: '🔤' },
  mood: { label: '무드', icon: '🌙' },
};

export const VISUAL_THEMES: VisualTheme[] = [
  // ═══════════════ COLOR THEMES ═══════════════
  {
    id: 'theme-cyberpunk',
    label: '사이버펑크',
    icon: '🌃',
    description: '네온 핑크 + 시안 글로우',
    category: 'color',
    preview: 'linear-gradient(135deg, #ff00ff, #00ffff)',
    previewPattern: 'grid',
    css: `
      * { --neon-primary: #ff00ff; --neon-secondary: #00ffff; }
      body { background: #0a0010 !important; }
      canvas { filter: saturate(1.8) contrast(1.2) brightness(1.05); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background:
          radial-gradient(ellipse at 0% 0%, rgba(255,0,255,0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 100% 100%, rgba(0,255,255,0.12) 0%, transparent 50%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'theme-vaporwave',
    label: '베이퍼웨이브',
    icon: '🌴',
    description: '90년대 레트로 + 핑크 선셋',
    category: 'color',
    preview: 'linear-gradient(135deg, #ff71ce, #b967ff, #01cdfe)',
    previewPattern: 'scanlines',
    css: `
      body { background: #1a0a2e !important; }
      canvas { filter: saturate(2.0) hue-rotate(320deg) brightness(1.15); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: repeating-linear-gradient(
          0deg,
          transparent,
          transparent 3px,
          rgba(255,113,206,0.06) 3px,
          rgba(255,113,206,0.06) 4px
        );
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'theme-ocean',
    label: '딥 오션',
    icon: '🌊',
    description: '깊은 바다 블루 톤',
    category: 'color',
    preview: 'linear-gradient(135deg, #0077b6, #023e8a, #00b4d8)',
    css: `
      body { background: #000a14 !important; }
      canvas { filter: hue-rotate(200deg) saturate(1.8) brightness(0.9); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at center, transparent 35%, rgba(0,40,120,0.35) 100%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'theme-sunset',
    label: '선셋 글로우',
    icon: '🌅',
    description: '따뜻한 오렌지 + 퍼플',
    category: 'color',
    preview: 'linear-gradient(135deg, #ff6b35, #f7931e, #9b59b6)',
    css: `
      body { background: #1a0800 !important; }
      canvas { filter: hue-rotate(340deg) saturate(2.2) brightness(1.1) contrast(1.15); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background:
          radial-gradient(ellipse at 50% 100%, rgba(255,107,53,0.15) 0%, transparent 60%),
          radial-gradient(ellipse at 50% 0%, rgba(155,89,182,0.12) 0%, transparent 50%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'theme-sakura',
    label: '사쿠라',
    icon: '🌸',
    description: '벚꽃 핑크 파스텔',
    category: 'color',
    preview: 'linear-gradient(135deg, #ffb7c5, #ff69b4, #fff0f5)',
    css: `
      body { background: #1a0a12 !important; }
      canvas { filter: hue-rotate(330deg) saturate(1.2) brightness(1.2) contrast(1.05); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at center, rgba(255,183,197,0.08) 0%, transparent 60%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'theme-matrix',
    previewPattern: 'noise',
    label: '매트릭스',
    icon: '💚',
    description: '초록 모노크롬 해커 스타일',
    category: 'color',
    preview: 'linear-gradient(135deg, #00ff41, #003300)',
    css: `
      body { background: #000800 !important; }
      canvas { filter: hue-rotate(100deg) saturate(2.5) brightness(0.85) contrast(1.2); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at center, transparent 30%, rgba(0,30,0,0.4) 100%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'theme-arctic',
    label: '아크틱',
    icon: '❄️',
    description: '얼음 화이트 + 블루',
    category: 'color',
    preview: 'linear-gradient(135deg, #e0f7fa, #4dd0e1, #006064)',
    css: `
      body { background: #0a0e14 !important; }
      canvas { filter: hue-rotate(180deg) saturate(1.0) brightness(1.25) contrast(1.05); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at center, rgba(200,240,255,0.06) 0%, rgba(0,40,80,0.2) 100%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'theme-lava',
    label: '라바',
    icon: '🌋',
    description: '용암 레드 + 오렌지 불꽃',
    category: 'color',
    preview: 'linear-gradient(135deg, #ff0000, #ff6600, #ffcc00)',
    css: `
      body { background: #140000 !important; }
      canvas { filter: hue-rotate(350deg) saturate(2.5) brightness(1.15) contrast(1.3); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background:
          radial-gradient(ellipse at 50% 100%, rgba(255,0,0,0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 0%, rgba(255,100,0,0.1) 0%, transparent 40%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'theme-midnight',
    label: '미드나잇',
    icon: '🌑',
    description: '진한 남색 + 골드 악센트',
    category: 'color',
    preview: 'linear-gradient(135deg, #191970, #000033, #ffd700)',
    css: `
      body { background: #000008 !important; }
      canvas { filter: hue-rotate(240deg) saturate(1.6) brightness(0.8) contrast(1.15); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,30,0.45) 100%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'theme-candy',
    label: '캔디팝',
    icon: '🍬',
    description: '달콤한 파스텔 멀티컬러',
    category: 'color',
    preview: 'linear-gradient(135deg, #ff9a9e, #fad0c4, #a18cd1)',
    css: `
      body { background: #1a0a1a !important; }
      canvas { filter: saturate(1.0) brightness(1.35) contrast(0.9); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at center, rgba(255,154,158,0.06) 0%, rgba(161,140,209,0.1) 100%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'theme-forest',
    label: '포레스트',
    icon: '🌲',
    description: '숲속 초록 + 브라운',
    category: 'color',
    preview: 'linear-gradient(135deg, #2d5016, #1a3a0a, #8B4513)',
    css: `
      body { background: #050a02 !important; }
      canvas { filter: hue-rotate(80deg) saturate(1.8) brightness(0.85) contrast(1.1); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at center, transparent 35%, rgba(0,20,0,0.35) 100%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'theme-galaxy',
    previewPattern: 'dots',
    label: '갤럭시',
    icon: '🌌',
    description: '우주 퍼플 + 스타더스트',
    category: 'color',
    preview: 'linear-gradient(135deg, #4a0080, #7b2ff7, #ff6ec7)',
    css: `
      body { background: #08001a !important; }
      canvas { filter: hue-rotate(280deg) saturate(2.2) brightness(1.1) contrast(1.1); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background:
          radial-gradient(ellipse at 30% 20%, rgba(123,47,247,0.1) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(255,110,199,0.08) 0%, transparent 50%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },

  // ═══════════════ EFFECTS ═══════════════
  {
    id: 'fx-scanlines',
    label: '스캔라인',
    icon: '📺',
    description: 'CRT 모니터 스캔라인 효과',
    category: 'effect',
    preview: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
    css: `
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0,0,0,0.25) 2px,
          rgba(0,0,0,0.25) 4px
        );
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'fx-crt',
    label: 'CRT 모니터',
    icon: '🖥️',
    description: '곡면 CRT + 비네팅 효과',
    category: 'effect',
    preview: 'radial-gradient(ellipse, transparent 60%, rgba(0,0,0,0.6))',
    css: `
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%);
        pointer-events: none;
        z-index: 9999;
      }
      body::before {
        content: '';
        position: fixed;
        inset: 0;
        background: repeating-linear-gradient(
          0deg,
          transparent,
          transparent 1px,
          rgba(0,255,0,0.06) 1px,
          rgba(0,255,0,0.06) 2px
        );
        pointer-events: none;
        z-index: 9998;
      }
    `,
  },
  {
    id: 'fx-glitch',
    label: '글리치',
    icon: '📡',
    description: 'RGB 분리 글리치 효과',
    category: 'effect',
    preview: 'linear-gradient(135deg, #ff0000, #00ff00, #0000ff)',
    css: `
      @keyframes glitch {
        0%, 100% { filter: none; }
        20% { filter: hue-rotate(90deg); }
        40% { filter: invert(0.1); }
        60% { filter: saturate(3); }
        80% { filter: hue-rotate(-90deg) contrast(1.5); }
      }
      canvas {
        animation: glitch 4s infinite;
      }
    `,
  },
  {
    id: 'fx-blur-edges',
    label: '틸트 시프트',
    icon: '📷',
    description: '미니어처 틸트시프트 효과',
    category: 'effect',
    preview: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent 30%, transparent 70%, rgba(0,0,0,0.4))',
    css: `
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: linear-gradient(
          to bottom,
          rgba(0,0,0,0.5) 0%,
          transparent 20%,
          transparent 80%,
          rgba(0,0,0,0.5) 100%
        );
        backdrop-filter: blur(0px);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'fx-pixelate',
    label: '픽셀아트',
    icon: '🎮',
    description: '레트로 픽셀화 렌더링',
    category: 'effect',
    preview: 'linear-gradient(135deg, #333, #666, #999)',
    css: `
      canvas {
        image-rendering: pixelated !important;
        image-rendering: -moz-crisp-edges !important;
        image-rendering: crisp-edges !important;
      }
    `,
  },
  {
    id: 'fx-bloom',
    label: '블룸',
    icon: '💡',
    description: '밝은 부분이 빛나는 블룸 효과',
    category: 'effect',
    preview: 'radial-gradient(circle, rgba(255,255,255,0.3), transparent)',
    css: `
      canvas {
        filter: brightness(1.2) contrast(1.2);
      }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.15) 0%, transparent 70%);
        pointer-events: none;
        z-index: 9999;
        mix-blend-mode: screen;
      }
    `,
  },
  {
    id: 'fx-chromatic',
    label: '색수차',
    icon: '🌈',
    description: 'RGB 색수차 렌즈 효과',
    category: 'effect',
    preview: 'linear-gradient(135deg, #ff000033, #00ff0033, #0000ff33)',
    css: `
      @keyframes chromatic {
        0%, 100% { text-shadow: -2px 0 red, 2px 0 cyan; }
        50% { text-shadow: 2px 0 red, -2px 0 cyan; }
      }
      body {
        text-shadow: -1px 0 rgba(255,0,0,0.3), 1px 0 rgba(0,255,255,0.3);
      }
    `,
  },

  // ═══════════════ OVERLAYS ═══════════════
  {
    id: 'ov-rain',
    label: '비 내리기',
    icon: '🌧️',
    description: '빗방울이 떨어지는 효과',
    category: 'overlay',
    preview: 'linear-gradient(to bottom, #333, #111)',
    css: `
      @keyframes rain {
        0% { background-position: 0 0; }
        100% { background-position: 20px 600px; }
      }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background-image:
          linear-gradient(transparent 93%, rgba(120,180,255,0.3) 93%, rgba(120,180,255,0.3) 94%, transparent 94%),
          linear-gradient(transparent 90%, rgba(140,200,255,0.2) 90%, rgba(140,200,255,0.2) 91%, transparent 91%),
          linear-gradient(transparent 96%, rgba(100,160,255,0.25) 96%, rgba(100,160,255,0.25) 96.8%, transparent 96.8%);
        background-size: 25px 55px, 40px 70px, 55px 85px;
        animation: rain 0.6s linear infinite;
        pointer-events: none;
        z-index: 9999;
        opacity: 0.9;
      }
    `,
  },
  {
    id: 'ov-snow',
    label: '눈 내리기',
    icon: '❄️',
    description: '부드러운 눈발 효과',
    category: 'overlay',
    preview: 'linear-gradient(to bottom, #1a1a2e, #2a2a4e)',
    css: `
      @keyframes snow {
        0% { background-position: 0 0, 0 0, 0 0; }
        100% { background-position: 500px 1000px, 400px 400px, 300px 300px; }
      }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background-image:
          radial-gradient(3px 3px at 100px 50px, white 50%, transparent 50%),
          radial-gradient(4px 4px at 200px 150px, rgba(255,255,255,0.9) 50%, transparent 50%),
          radial-gradient(2px 2px at 50px 200px, rgba(255,255,255,0.7) 50%, transparent 50%),
          radial-gradient(3px 3px at 300px 100px, rgba(255,255,255,0.8) 50%, transparent 50%);
        background-size: 300px 250px, 220px 180px, 130px 130px, 280px 220px;
        animation: snow 6s linear infinite;
        pointer-events: none;
        z-index: 9999;
        opacity: 1;
      }
    `,
  },
  {
    id: 'ov-stars',
    label: '별빛',
    icon: '⭐',
    description: '반짝이는 별빛 배경',
    category: 'overlay',
    preview: 'radial-gradient(circle, #fff 1px, transparent 1px), #000',
    css: `
      @keyframes twinkle {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
      body::before {
        content: '';
        position: fixed;
        inset: 0;
        background-image:
          radial-gradient(2px 2px at 50px 30px, rgba(255,255,255,0.9) 50%, transparent 50%),
          radial-gradient(2px 2px at 150px 100px, rgba(255,255,255,0.8) 50%, transparent 50%),
          radial-gradient(3px 3px at 250px 60px, rgba(255,255,255,1.0) 50%, transparent 50%),
          radial-gradient(2px 2px at 80px 180px, rgba(255,255,255,0.7) 50%, transparent 50%),
          radial-gradient(2px 2px at 320px 150px, rgba(255,255,255,0.85) 50%, transparent 50%);
        background-size: 400px 250px;
        animation: twinkle 3s ease-in-out infinite;
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'ov-grid',
    label: '그리드',
    icon: '📐',
    description: '트론 스타일 그리드 바닥',
    category: 'overlay',
    preview: 'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)',
    css: `
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background:
          linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px);
        background-size: 40px 40px;
        pointer-events: none;
        z-index: 9999;
        mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.8) 100%);
        -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.8) 100%);
      }
    `,
  },
  {
    id: 'ov-vignette',
    label: '비네팅',
    icon: '🔲',
    description: '가장자리 어두워지는 효과',
    category: 'overlay',
    preview: 'radial-gradient(ellipse, transparent 40%, rgba(0,0,0,0.7))',
    css: `
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.75) 100%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'ov-particles',
    label: '파티클',
    icon: '✨',
    description: '떠다니는 빛나는 파티클',
    category: 'overlay',
    preview: 'radial-gradient(circle, rgba(99,102,241,0.5), transparent 70%)',
    css: `
      @keyframes float1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,-40px); } }
      @keyframes float2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-20px,30px); } }
      @keyframes float3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(40px,20px); } }
      body::before {
        content: '';
        position: fixed;
        inset: 0;
        background-image:
          radial-gradient(4px 4px at 25% 30%, rgba(99,102,241,0.7) 50%, transparent 50%),
          radial-gradient(3px 3px at 75% 60%, rgba(16,185,129,0.6) 50%, transparent 50%),
          radial-gradient(4px 4px at 50% 80%, rgba(244,114,182,0.6) 50%, transparent 50%);
        background-size: 300px 300px, 200px 200px, 250px 250px;
        animation: float1 6s ease-in-out infinite;
        pointer-events: none;
        z-index: 9999;
        opacity: 0.8;
      }
    `,
  },

  // ═══════════════ TYPOGRAPHY ═══════════════
  {
    id: 'typo-glow',
    label: '글로우 텍스트',
    icon: '💫',
    description: '모든 텍스트에 네온 글로우',
    category: 'typography',
    preview: 'linear-gradient(135deg, #00ffff, #ff00ff)',
    css: `
      * {
        text-shadow: 0 0 8px currentColor, 0 0 16px currentColor !important;
      }
    `,
  },
  {
    id: 'typo-outline',
    label: '아웃라인',
    icon: '🔲',
    description: '텍스트에 강한 외곽선',
    category: 'typography',
    preview: 'linear-gradient(135deg, #fff, #888)',
    css: `
      * {
        -webkit-text-stroke: 0.5px rgba(255,255,255,0.5);
      }
    `,
  },
  {
    id: 'typo-shadow',
    label: '롱 섀도우',
    icon: '🏗️',
    description: '길게 늘어지는 텍스트 그림자',
    category: 'typography',
    preview: 'linear-gradient(135deg, #333, #111)',
    css: `
      * {
        text-shadow:
          1px 1px 0 rgba(0,0,0,0.3),
          2px 2px 0 rgba(0,0,0,0.25),
          3px 3px 0 rgba(0,0,0,0.2),
          4px 4px 0 rgba(0,0,0,0.15) !important;
      }
    `,
  },

  // ═══════════════ MOOD ═══════════════
  {
    id: 'mood-noir',
    label: '필름 느와르',
    icon: '🎬',
    description: '흑백 시네마틱 무드',
    category: 'mood',
    preview: 'linear-gradient(135deg, #333, #000)',
    css: `
      canvas { filter: grayscale(0.95) contrast(1.4) brightness(0.85); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'mood-sepia',
    label: '세피아',
    icon: '📜',
    description: '빈티지 세피아 톤',
    category: 'mood',
    preview: 'linear-gradient(135deg, #d4a574, #8b6914)',
    css: `
      canvas { filter: sepia(0.85) contrast(1.2) brightness(0.9); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at center, rgba(180,140,80,0.06) 0%, rgba(50,30,0,0.3) 100%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'mood-dreamy',
    label: '드리미',
    icon: '☁️',
    description: '몽환적인 소프트 블러',
    category: 'mood',
    preview: 'linear-gradient(135deg, #e8d5f5, #c5a3e8, #f5d5e8)',
    css: `
      canvas { filter: brightness(1.25) contrast(0.8) saturate(0.7) blur(0.5px); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at center, rgba(200,180,255,0.15) 0%, rgba(180,160,240,0.08) 70%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'mood-horror',
    label: '호러',
    icon: '👻',
    description: '어둡고 으스스한 분위기',
    category: 'mood',
    preview: 'linear-gradient(135deg, #1a0000, #330000, #000)',
    css: `
      canvas { filter: contrast(1.5) brightness(0.6) saturate(0.4); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.8) 100%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'mood-neon-nights',
    label: '네온 나이트',
    icon: '🌃',
    description: '밤거리 네온사인 분위기',
    category: 'mood',
    preview: 'linear-gradient(135deg, #ff006e, #8338ec, #3a86ff)',
    css: `
      canvas { filter: saturate(2.2) contrast(1.25) brightness(1.1); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background:
          linear-gradient(135deg, rgba(255,0,110,0.12) 0%, transparent 50%),
          linear-gradient(225deg, rgba(58,134,255,0.12) 0%, transparent 50%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'mood-sunny',
    label: '써니 데이',
    icon: '☀️',
    description: '밝고 따뜻한 햇살 무드',
    category: 'mood',
    preview: 'linear-gradient(135deg, #fff3b0, #ffdd57, #ffb347)',
    css: `
      canvas { filter: brightness(1.3) saturate(1.3) contrast(1.0) sepia(0.2); }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at 50% 30%, rgba(255,220,100,0.1) 0%, transparent 60%);
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },
  {
    id: 'mood-underwater',
    label: '언더워터',
    icon: '🐠',
    description: '수중 세계 느낌',
    category: 'mood',
    preview: 'linear-gradient(135deg, #006994, #004466, #00cccc)',
    css: `
      canvas { filter: hue-rotate(160deg) saturate(1.6) brightness(0.8) contrast(0.85); }
      @keyframes underwater {
        0%,100% { opacity: 0.04; }
        50% { opacity: 0.08; }
      }
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: linear-gradient(0deg, rgba(0,100,200,0.15) 0%, transparent 100%);
        animation: underwater 4s ease-in-out infinite;
        pointer-events: none;
        z-index: 9999;
      }
    `,
  },

  // ═══════════════ GLASSMORPHISM ═══════════════
  {
    id: 'theme-glass',
    label: '글래스모피즘',
    icon: '🪟',
    description: '유리 질감 + 블러 효과',
    category: 'effect',
    preview: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
    css: `
      body::after {
        content: '';
        position: fixed;
        top: 10%;
        left: 10%;
        right: 10%;
        bottom: 10%;
        background: rgba(255,255,255,0.03);
        backdrop-filter: blur(1px);
        -webkit-backdrop-filter: blur(1px);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px;
        pointer-events: none;
        z-index: 9998;
      }
    `,
  },
];

/**
 * Apply a visual theme to game HTML by injecting CSS.
 * Multiple themes can be stacked.
 */
export function applyVisualTheme(html: string, theme: VisualTheme): string {
  const styleTag = `<style data-theme="${theme.id}">${theme.css}</style>`;

  // Inject before </head> if exists, otherwise before </html> or at the end
  if (html.includes('</head>')) {
    return html.replace('</head>', `${styleTag}</head>`);
  } else if (html.includes('<body')) {
    return html.replace('<body', `${styleTag}<body`);
  } else {
    return styleTag + html;
  }
}

/**
 * Apply multiple visual themes at once
 */
export function applyVisualThemes(html: string, themes: VisualTheme[]): string {
  return themes.reduce((h, t) => applyVisualTheme(h, t), html);
}

/**
 * Remove a specific theme from HTML
 */
export function removeVisualTheme(html: string, themeId: string): string {
  const regex = new RegExp(`<style data-theme="${themeId}">[^]*?</style>`, 'g');
  return html.replace(regex, '');
}

/**
 * Get themes by category
 */
export function getThemesByCategory(category: ThemeCategory): VisualTheme[] {
  return VISUAL_THEMES.filter(t => t.category === category);
}
