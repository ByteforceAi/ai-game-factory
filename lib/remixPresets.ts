// Remix Presets — predefined code modifications for each game
// Each preset modifies the game HTML via string replacement
// IMPORTANT: All regex patterns are verified against actual game HTML in demoGames.ts

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
// Actual vars: baseSpeed = 2, spawnRate = 60, player.size, #1a1a2e, #16213e
const burgerRemixes: RemixPreset[] = [
  {
    id: 'burger-speed',
    label: '고속 모드',
    icon: '⚡',
    description: '음식이 2배 빠르게 떨어져요',
    apply: (html) =>
      html.replace(/var baseSpeed\s*=\s*[\d.]+/, 'var baseSpeed = 4'),
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
        .replace(/#FFD700/g, '#ff00ff')
        .replace(/#44FF44/g, '#00ffff'),
  },
  {
    id: 'burger-giant',
    label: '거대 이모지',
    icon: '🔍',
    description: '이모지와 플레이어 크기 1.5배 확대',
    apply: (html) =>
      html
        .replace(
          /player\.size\s*=\s*Math\.min\(canvas\.width,\s*canvas\.height\)\s*\*\s*0\.08/g,
          'player.size = Math.min(canvas.width, canvas.height) * 0.12'
        )
        .replace(
          /size:\s*player\.size\s*\*\s*\(0\.7/g,
          'size: player.size * (1.0'
        ),
  },
  {
    id: 'burger-more-food',
    label: '음식 폭탄',
    icon: '🍔',
    description: '한 번에 더 많은 음식 등장',
    apply: (html) =>
      html.replace(/var spawnRate\s*=\s*60/, 'var spawnRate = 25'),
  },
];

// --- Temple Runner Game Remixes ---
// Actual vars: baseSpeed=18, maxSpeed=55, scene.background=0x1a0a2e, scene.fog=0x1a0a2e
// laneX=[-2.4,0,2.4], lanes=[0,1,2], wallMat color:0xcc3300, coinMat color:0xffcc00
const runnerRemixes: RemixPreset[] = [
  {
    id: 'runner-turbo',
    label: '터보 모드',
    icon: '🏎️',
    description: '시작 속도 2배, 더 빠른 가속',
    apply: (html) =>
      html
        .replace(/baseSpeed=18/, 'baseSpeed=36')
        .replace(/maxSpeed=55/, 'maxSpeed=80'),
  },
  {
    id: 'runner-night',
    label: '나이트 모드',
    icon: '🌙',
    description: '어두운 밤 테마 + 네온 장애물',
    apply: (html) =>
      html
        .replace(/0x1a0a2e/g, '0x020010')
        .replace(/0x2a1a3a/g, '0x0a0520')
        .replace(/0x3a2a4a/g, '0x150a30')
        .replace(/color:0xcc3300/g, 'color:0xff0066')
        .replace(/color:0xddcc00/g, 'color:0x00ffcc')
        .replace(/color:0x00ccff/g, 'color:0xff00ff')
        .replace(/emissive:0x441100/g, 'emissive:0x660033')
        .replace(/emissive:0x443300/g, 'emissive:0x006644'),
  },
  {
    id: 'runner-coins',
    label: '코인 러시',
    icon: '💰',
    description: '코인 크기 2배 + 점수 2배',
    apply: (html) =>
      html
        .replace(
          /new THREE\.OctahedronGeometry\(0\.4\)/,
          'new THREE.OctahedronGeometry(0.8)'
        )
        .replace(/score\+=10/g, 'score+=20'),
  },
  {
    id: 'runner-wide',
    label: '5레인 모드',
    icon: '🛣️',
    description: '3레인 → 5레인으로 확장',
    apply: (html) =>
      html
        .replace(
          /laneX=\[-2\.4,0,2\.4\]/,
          'laneX=[-4.8,-2.4,0,2.4,4.8]'
        )
        .replace(
          /var lanes=\[0,1,2\]/,
          'var lanes=[0,1,2,3,4]'
        )
        .replace(/currentLane=1/, 'currentLane=2'),
  },
];

// --- Tetris Game Remixes ---
// Actual vars: COLS=10, dropInterval=1000, COLORS={I:'#00f5ff',...}, #0a0a0a background
const tetrisRemixes: RemixPreset[] = [
  {
    id: 'tetris-speed',
    label: '스피드 테트리스',
    icon: '⚡',
    description: '기본 속도 2배, 하드코어 모드',
    apply: (html) =>
      html.replace(/dropInterval=1000/, 'dropInterval=500'),
  },
  {
    id: 'tetris-wide',
    label: '와이드 보드',
    icon: '📐',
    description: '10칸 → 15칸 넓은 보드',
    apply: (html) =>
      html.replace(/COLS=10/, 'COLS=15'),
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
        .replace(/#0a0a0a/g, '#000800'),
  },
  {
    id: 'tetris-marathon',
    label: '마라톤 모드',
    icon: '🏃',
    description: '보드 높이 30칸! 긴 게임을 즐기세요',
    apply: (html) =>
      html.replace(/ROWS=20/, 'ROWS=30'),
  },
];

// --- Hamburger Dodge Game Remixes ---
// Actual vars: baseSpeed = 3, spawnRate = 45, lives = 3, lanes = 5, #1a1a2e, #16213e
const dodgeRemixes: RemixPreset[] = [
  {
    id: 'dodge-turbo',
    label: '터보 모드',
    icon: '⚡',
    description: '장애물 속도 2배! 극한의 도전',
    apply: (html) =>
      html.replace(/var baseSpeed = 3/, 'var baseSpeed = 6'),
  },
  {
    id: 'dodge-tank',
    label: '탱크 모드',
    icon: '🛡️',
    description: '목숨 5개로 시작! 오래 살아남자',
    apply: (html) =>
      html
        .replace(/var lives = 3/, 'var lives = 5')
        .replace(/var maxLives = 3/, 'var maxLives = 5'),
  },
  {
    id: 'dodge-neon',
    label: '네온 테마',
    icon: '🌈',
    description: '사이버펑크 네온 배경',
    apply: (html) =>
      html
        .replace(/#1a1a2e/g, '#0d0221')
        .replace(/#16213e/g, '#150533'),
  },
  {
    id: 'dodge-chaos',
    label: '카오스 모드',
    icon: '💥',
    description: '장애물 폭탄! 스폰 속도 3배',
    apply: (html) =>
      html.replace(/var spawnRate = 45/, 'var spawnRate = 15'),
  },
];

// --- Neon Shooter Remixes ---
// Actual vars: sc.fireRate = 180, sc.lives = 3, bossHp = 20 + sc.wave * 5
const shooterRemixes: RemixPreset[] = [
  {
    id: 'shooter-rapid',
    label: '래피드 파이어',
    icon: '⚡',
    description: '발사 속도 3배 증가',
    apply: (html) =>
      html.replace(/sc\.fireRate = 180/, 'sc.fireRate = 60'),
  },
  {
    id: 'shooter-tank',
    label: '탱크 모드',
    icon: '🛡️',
    description: '목숨 5개로 시작',
    apply: (html) =>
      html.replace(/sc\.lives = 3/, 'sc.lives = 5')
           .replace(/LIVES: 3/, 'LIVES: 5'),
  },
  {
    id: 'shooter-boss',
    label: '보스 러시',
    icon: '👹',
    description: '보스 체력 절반, 더 자주 출현',
    apply: (html) =>
      html.replace(/var bossHp = 20 \+ sc\.wave \* 5/, 'var bossHp = 10 + sc.wave * 2'),
  },
];

// --- Neon Platformer Remixes ---
// Actual vars: GRAVITY = 720, PLAYER_SPEED = 260, JUMP_VEL = -420, DOUBLE_JUMP_VEL = -380
const platformerRemixes: RemixPreset[] = [
  {
    id: 'plat-moon',
    label: '달 중력',
    icon: '🌙',
    description: '중력 절반, 더 높이 점프',
    apply: (html) =>
      html.replace(/const GRAVITY = 720/, 'const GRAVITY = 360')
           .replace(/const JUMP_VEL = -420/, 'const JUMP_VEL = -350'),
  },
  {
    id: 'plat-sonic',
    label: '소닉 스피드',
    icon: '💨',
    description: '이동속도 2배, 스크롤 빨라짐',
    apply: (html) =>
      html.replace(/const PLAYER_SPEED = 260/, 'const PLAYER_SPEED = 500')
           .replace(/const PLATFORM_SCROLL_SPEED = 160/, 'const PLATFORM_SCROLL_SPEED = 280'),
  },
  {
    id: 'plat-super',
    label: '슈퍼 점프',
    icon: '🚀',
    description: '점프력 1.5배, 더블점프 강화',
    apply: (html) =>
      html.replace(/const JUMP_VEL = -420/, 'const JUMP_VEL = -600')
           .replace(/const DOUBLE_JUMP_VEL = -380/, 'const DOUBLE_JUMP_VEL = -550'),
  },
];

export const GAME_REMIX_CONFIGS: GameRemixConfig[] = [
  { gameId: 'neon-shooter', presets: shooterRemixes },
  { gameId: 'neon-platformer', presets: platformerRemixes },
  { gameId: 'temple-runner', presets: runnerRemixes },
  { gameId: 'tetris', presets: tetrisRemixes },
];

export function getRemixPresets(gameId: string): RemixPreset[] {
  return GAME_REMIX_CONFIGS.find((c) => c.gameId === gameId)?.presets ?? [];
}
