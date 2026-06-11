/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 브랜드 그린 (CSS 변수 --accent-primary와 동일)
        brand: {
          DEFAULT: '#22c55e',
          dim: 'rgba(34,197,94,0.45)',
        },
        // 공유 게임 플레이어(/play)의 라이트 글래스 카드 팔레트
        glass: {
          accent: '#007AFF',
          indigo: '#5856D6',
          bg: '#F2F2F7',
          text: '#1D1D1F',
          'text-secondary': '#6E6E73',
          'text-muted': '#98989D',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans KR', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Pretendard', 'Noto Sans KR', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'gradient-border': 'gradientBorderFlow 4s linear infinite',
        'cursor-blink': 'cursorBlink .7s step-end infinite',
        'msg-in': 'msgFadeIn .35s ease-out',
        'dot-bounce': 'dotBounce 1.2s infinite',
        'line-fade-in': 'lineFadeIn .12s ease forwards',
        'log-pulse': 'logPulse 3s infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        gradientBorderFlow: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 300%' },
        },
        cursorBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        msgFadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        dotBounce: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%': { transform: 'translateY(-4px)', opacity: '1' },
        },
        lineFadeIn: {
          to: { opacity: '1' },
        },
        logPulse: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        'claude-sm': '8px',
        'claude-md': '12px',
        'claude-lg': '20px',
        'claude-xl': '24px',
      },
    },
  },
  plugins: [],
};
