// Remix Presets — predefined code modifications for each game
// Each preset modifies the game HTML via string replacement

export interface RemixPreset {
  id: string;
  label: string;
  icon: string;
  description: string;
  apply: (html: string) => string;
}

export interface GameRemixConfig {
  gameId: string;
  presets: RemixPreset[];
}

// --- Emoji Burger Game Remixes ---
const burgerRemixes: RemixPreset[] = [
  {
    id: 'burger-speed',
    label: '고속 모드',
    icon: '⚡',
    description: '음식이 2배 빠르게 떨어져요',
    apply: (html) =>
      html.replace(/fallSpeed\s*=\s*[\d.]+/g, (m) => {
        const val = parseFloat(m.split('=')[1]);
        return `fallSpeed = ${val * 2}`;
      }),
  },
  {
    id: 'burger-neon',
    label: '네온 테마',
    icon: '🌈',
    description: '형광 네온 배경으로 변경',
    apply: (html) =>
      html
        .replace(/#1a1a2e/g, '#0d0221')
        .replace(/#16213e/g, '#150533')
        .replace(
          /ctx\.shadowColor\s*=\s*['"][^'"]*['"]/g,
          "ctx.shadowColor = '#ff00ff'"
        )
        .replace(
          /ctx\.shadowBlur\s*=\s*\d+/g,
          'ctx.shadowBlur = 20'
        ),
  },
  {
    id: 'burger-giant',
    label: '거대 이모지',
    icon: '🔍',
    description: '이모지 크기 1.5배 확대',
    apply: (html) =>
      html.replace(/fontSize\s*=\s*([\d.]+)/g, (_, val) => {
        return `fontSize = ${parseFloat(val) * 1.5}`;
      }),
  },
  {
    id: 'burger-more-food',
    label: '음식 폭탄',
    icon: '🍔',
    description: '한 번에 더 많은 음식 등장',
    apply: (html) =>
      html.replace(/spawnInterval\s*=\s*[\d.]+/g, (m) => {
        const val = parseFloat(m.split('=')[1]);
        return `spawnInterval = ${val * 0.5}`;
      }),
  },
];

// --- Temple Runner Game Remixes ---
const runnerRemixes: RemixPreset[] = [
  {
    id: 'runner-turbo',
    label: '터보 모드',
    icon: '🏎️',
    description: '시작 속도 2배, 더 빠른 가속',
    apply: (html) =>
      html.replace(/baseSpeed\s*=\s*[\d.]+/g, (m) => {
        const val = parseFloat(m.split('=')[1]);
        return `baseSpeed = ${val * 2}`;
      }),
  },
  {
    id: 'runner-night',
    label: '나이트 모드',
    icon: '🌙',
    description: '어두운 밤 테마 + 네온 장애물',
    apply: (html) =>
      html
        .replace(/0x87CEEB/g, '0x0a0a2e')
        .replace(/0x228B22/g, '0x1a1a3e')
        .replace(/fog\.color\.set\([^)]+\)/g, "fog.color.set(0x0a0a2e)"),
  },
  {
    id: 'runner-coins',
    label: '코인 러시',
    icon: '💰',
    description: '코인 2배 등장, 보너스 점수',
    apply: (html) =>
      html.replace(/coinInterval\s*=\s*[\d.]+/g, (m) => {
        const val = parseFloat(m.split('=')[1]);
        return `coinInterval = ${val * 0.5}`;
      }),
  },
  {
    id: 'runner-wide',
    label: '5레인 모드',
    icon: '🛣️',
    description: '3레인 → 5레인으로 확장',
    apply: (html) =>
      html
        .replace(/lanes\s*=\s*\[-?\d+,\s*\d+,\s*-?\d+\]/g, 'lanes = [-4, -2, 0, 2, 4]')
        .replace(/laneCount\s*=\s*3/g, 'laneCount = 5'),
  },
];

// --- Tetris Game Remixes ---
const tetrisRemixes: RemixPreset[] = [
  {
    id: 'tetris-speed',
    label: '스피드 테트리스',
    icon: '⚡',
    description: '기본 속도 2배, 하드코어 모드',
    apply: (html) =>
      html.replace(/dropInterval\s*=\s*[\d.]+/g, (m) => {
        const val = parseFloat(m.split('=')[1]);
        return `dropInterval = ${val * 0.5}`;
      }),
  },
  {
    id: 'tetris-wide',
    label: '와이드 보드',
    icon: '📐',
    description: '10칸 → 15칸 넓은 보드',
    apply: (html) =>
      html.replace(/COLS\s*=\s*10/g, 'COLS = 15'),
  },
  {
    id: 'tetris-retro',
    label: '레트로 테마',
    icon: '👾',
    description: '초록 모노크롬 레트로 스타일',
    apply: (html) =>
      html
        .replace(/#00f5ff/g, '#00ff41')
        .replace(/#fff700/g, '#00ff41')
        .replace(/#b400ff/g, '#00cc33')
        .replace(/#00ff88/g, '#00ff41')
        .replace(/#ff0044/g, '#00aa22')
        .replace(/#0066ff/g, '#00ff41')
        .replace(/#ff8800/g, '#00cc33')
        .replace(/#0a0a0a/g, '#000000'),
  },
  {
    id: 'tetris-gravity',
    label: '중력 모드',
    icon: '🌍',
    description: '줄 클리어 시 빈 공간으로 블록 낙하',
    apply: (html) =>
      html.replace(
        /\/\/ gravity-hook/g,
        '// gravity mode enabled'
      ),
  },
];

export const GAME_REMIX_CONFIGS: GameRemixConfig[] = [
  { gameId: 'emoji-burger', presets: burgerRemixes },
  { gameId: 'temple-runner', presets: runnerRemixes },
  { gameId: 'tetris', presets: tetrisRemixes },
];

export function getRemixPresets(gameId: string): RemixPreset[] {
  return GAME_REMIX_CONFIGS.find((c) => c.gameId === gameId)?.presets ?? [];
}
