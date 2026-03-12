/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#050508',
          surface: '#0A0A12',
          cyan: '#00E5FF',
          'cyan-dim': 'rgba(0,229,255,0.4)',
          green: '#00E676',
          amber: '#FFAB00',
          text: '#DCE4F0',
          'text-dim': 'rgba(220,228,240,0.5)',
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'monospace'],
        mono: ['JetBrains Mono', 'monospace'],
        body: ['Noto Sans KR', 'sans-serif'],
      },
      animation: {
        'neon-pulse': 'neonPulse 2s ease-in-out infinite',
        'scan-beam': 'scanBeam 3s linear infinite',
        'glow-pulse': 'glowPulse 3s infinite',
      },
      keyframes: {
        neonPulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        scanBeam: {
          '0%': { top: '-5%' },
          '100%': { top: '105%' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,229,255,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(0,229,255,0.4)' },
        },
      },
    },
  },
  plugins: [],
};
