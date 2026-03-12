/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          bg: '#f5f5f7',
          surface: '#ffffff',
          elevated: '#ffffff',
          border: 'rgba(0,0,0,0.08)',
          'border-light': 'rgba(0,0,0,0.04)',
          highlight: 'rgba(255,255,255,0.9)',
          text: '#1d1d1f',
          'text-secondary': '#86868b',
          'text-muted': '#aeaeb2',
          accent: '#007AFF',
          'accent-light': '#5AC8FA',
          green: '#34C759',
          red: '#FF3B30',
          orange: '#FF9500',
          purple: '#AF52DE',
          pink: '#FF2D55',
          teal: '#5AC8FA',
          yellow: '#FFCC00',
          indigo: '#5856D6',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Noto Sans KR', 'Helvetica Neue', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'glass-shimmer': 'glassShimmer 3s ease-in-out infinite',
        'float': 'float 8s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glassShimmer: {
          '0%, 100%': { backgroundPosition: '200% center' },
          '50%': { backgroundPosition: '-200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0px, 0px)' },
          '33%': { transform: 'translate(10px, -10px)' },
          '66%': { transform: 'translate(-5px, 5px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
      borderRadius: {
        'glass': '20px',
        'glass-sm': '14px',
        'glass-lg': '28px',
      },
      backdropBlur: {
        'glass': '20px',
        'glass-heavy': '40px',
      },
    },
  },
  plugins: [],
};
