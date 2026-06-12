/**
 * Per-game Vibe Coding configuration
 * Level 1: Sliders / toggles / selects that send postMessage to iframe
 * Level 2: Chat patterns that map natural language → postMessage commands
 */

export interface SliderCommand {
  id: string;
  label: string;
  icon: string;
  type: 'slider' | 'toggle' | 'select';
  messageType: string; // postMessage { type: messageType, value }
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  options?: { label: string; value: string }[];
  unit?: string;
}

export interface ChatPattern {
  patterns: string[]; // Korean/English keywords to match
  messageType: string;
  value: unknown;
  response: string; // "AI" response text
  codeSnippet: string; // fake code to show in typing animation
}

export interface GameVibeConfig {
  sliders: SliderCommand[];
  chatPatterns: ChatPattern[];
}

const FARM_GARDEN_CONFIG: GameVibeConfig = {
  sliders: [
    {
      id: 'weather',
      label: '날씨',
      icon: '🌤️',
      type: 'select',
      messageType: 'SET_WEATHER',
      options: [
        { label: '☀️ 맑음', value: 'clear' },
        { label: '⛅ 흐림', value: 'cloudy' },
        { label: '🌧️ 비', value: 'rain' },
      ],
    },
    {
      id: 'timeSpeed',
      label: '시간 속도',
      icon: '⏱️',
      type: 'slider',
      messageType: 'SET_TIME_SPEED',
      min: 0.1,
      max: 5,
      step: 0.1,
      defaultValue: 1,
      unit: 'x',
    },
    {
      id: 'growSpeed',
      label: '작물 성장',
      icon: '🌱',
      type: 'slider',
      messageType: 'SET_GROW_SPEED',
      min: 0.5,
      max: 10,
      step: 0.5,
      defaultValue: 1,
      unit: 'x',
    },
    {
      id: 'gold',
      label: '골드',
      icon: '💰',
      type: 'slider',
      messageType: 'SET_GOLD',
      min: 0,
      max: 9999,
      step: 100,
      defaultValue: 20,
      unit: 'G',
    },
    {
      id: 'water',
      label: '물 리필',
      icon: '💧',
      type: 'toggle',
      messageType: 'REFILL_WATER',
    },
    {
      id: 'dayPhase',
      label: '시간대',
      icon: '🌅',
      type: 'select',
      messageType: 'SET_DAY_PHASE',
      options: [
        { label: '🌅 아침', value: 'morning' },
        { label: '☀️ 낮', value: 'day' },
        { label: '🌇 저녁', value: 'evening' },
        { label: '🌙 밤', value: 'night' },
      ],
    },
  ],
  chatPatterns: [
    {
      patterns: ['비', 'rain', '비 내려', '비 내리', '비오', '장마'],
      messageType: 'SET_WEATHER',
      value: 'rain',
      response: '🌧️ 비가 내리기 시작해요! 작물이 자동으로 물을 받아요.',
      codeSnippet: `// weather-system.js
weather = 'rain';
weatherTimer = 60;
autoWaterAllCrops();
updateSkyColor(0x607D8B);
enableRainParticles(true);`,
    },
    {
      patterns: ['맑', '햇빛', 'clear', 'sunny', '해'],
      messageType: 'SET_WEATHER',
      value: 'clear',
      response: '☀️ 맑은 날씨로 바뀌었어요! 햇빛이 따사로워요.',
      codeSnippet: `// weather-system.js
weather = 'clear';
enableRainParticles(false);
dirLight.intensity = 1.2;
scene.background = new Color(0x87CEEB);`,
    },
    {
      patterns: ['밤', 'night', '어두', '달빛'],
      messageType: 'SET_DAY_PHASE',
      value: 'night',
      response: '🌙 밤이 되었어요. 별이 빛나는 밤하늘...',
      codeSnippet: `// day-night-cycle.js
gameTime = 22; // 10 PM
dayPhase = 'night';
ambLight.intensity = 0.2;
scene.background = new Color(0x1a237e);
scene.fog.color.set(0x1a237e);`,
    },
    {
      patterns: ['아침', 'morning', '새벽', '해뜨'],
      messageType: 'SET_DAY_PHASE',
      value: 'morning',
      response: '🌅 아침이 밝았어요! 새로운 하루의 시작!',
      codeSnippet: `// day-night-cycle.js
gameTime = 6;
dayPhase = 'morning';
scene.background = new Color(0xFFB74D);
dirLight.intensity = 0.8;`,
    },
    {
      patterns: ['골드', 'gold', '돈', '부자', '999', '만원', '무한'],
      messageType: 'SET_GOLD',
      value: 9999,
      response: '💰 금화 9999G 지급! 부자 농부가 되었어요!',
      codeSnippet: `// economy-manager.js
gold = 9999;
spawnGoldParticles(playerPos);
sfxCoin();
updateHUD();
showMsg('💰 금고가 가득!');`,
    },
    {
      patterns: ['빨리', '성장', '속도', 'fast', 'speed', '터보', '급성장'],
      messageType: 'SET_GROW_SPEED',
      value: 5,
      response: '🚀 작물 성장 속도 5배! 금방 수확할 수 있어요!',
      codeSnippet: `// crop-growth.js
speedBoost = 5.0;
for (let plot of plots) {
  if (plot.state === 'growing')
    plot.growMultiplier = 5.0;
}`,
    },
    {
      patterns: ['물', 'water', '채워', '리필', '물주'],
      messageType: 'REFILL_WATER',
      value: true,
      response: '💧 물통이 가득 찼어요! 마음껏 물을 주세요.',
      codeSnippet: `// water-system.js
waterCount = maxWater;
sfxWater();
updateHUD();
showMsg('💧 물 충전!');`,
    },
    {
      patterns: ['느리', 'slow', '천천히', '여유', '힐링'],
      messageType: 'SET_TIME_SPEED',
      value: 0.2,
      response: '🍃 시간이 천천히 흘러요... 힐링 타임!',
      codeSnippet: `// time-manager.js
timeMultiplier = 0.2;
ambientVolume = 0.8;
enableRelaxMode(true);`,
    },
    {
      patterns: ['저녁', 'evening', '노을', '석양'],
      messageType: 'SET_DAY_PHASE',
      value: 'evening',
      response: '🌇 노을이 물들어요. 아름다운 저녁 풍경...',
      codeSnippet: `// day-night-cycle.js
gameTime = 18;
dayPhase = 'evening';
scene.background = new Color(0xFF7043);
dirLight.color.set(0xFFAB91);`,
    },
    {
      patterns: ['레벨', 'level', '레벨업', '경험치'],
      messageType: 'SET_LEVEL',
      value: 7,
      response: '⭐ Lv.7 달성! 모든 작물이 해금되었어요!',
      codeSnippet: `// player-stats.js
xp = 1400;
level = getLevel(xp); // Lv.7
sfxLevelUp();
updateHUD();
showMsg('🎊 전설의 농부!');`,
    },
  ],
};

const NEON_SHOOTER_CONFIG: GameVibeConfig = {
  sliders: [
    {
      id: 'fireRate',
      label: '연사 속도',
      icon: '🔫',
      type: 'slider',
      messageType: 'SET_FIRE_RATE',
      min: 1,
      max: 20,
      step: 1,
      defaultValue: 5,
      unit: '/s',
    },
    {
      id: 'playerSpeed',
      label: '이동 속도',
      icon: '💨',
      type: 'slider',
      messageType: 'SET_PLAYER_SPEED',
      min: 1,
      max: 10,
      step: 0.5,
      defaultValue: 3,
      unit: 'x',
    },
    {
      id: 'enemyCount',
      label: '적 수',
      icon: '👾',
      type: 'slider',
      messageType: 'SET_ENEMY_COUNT',
      min: 1,
      max: 30,
      step: 1,
      defaultValue: 5,
      unit: '마리',
    },
    {
      id: 'invincible',
      label: '무적 모드',
      icon: '🛡️',
      type: 'toggle',
      messageType: 'SET_INVINCIBLE',
    },
  ],
  chatPatterns: [
    {
      patterns: ['무적', 'invincible', '안죽', '불사'],
      messageType: 'SET_INVINCIBLE',
      value: true,
      response: '🛡️ 무적 모드 ON! 이제 피해를 받지 않아요.',
      codeSnippet: `player.invincible = true;\nplayer.shield.visible = true;\nplayer.shield.material.opacity = 0.3;`,
    },
    {
      patterns: ['빨리', 'fast', '속도', '터보'],
      messageType: 'SET_FIRE_RATE',
      value: 15,
      response: '🔥 연사 속도 MAX! 총알이 빗줄기처럼 쏟아져요!',
      codeSnippet: `player.fireRate = 15;\nplayer.bulletType = 'rapid';`,
    },
    {
      patterns: ['보스', 'boss', '강적'],
      messageType: 'SPAWN_BOSS',
      value: true,
      response: '👹 보스 출현! 움직임 패턴을 읽으면 이길 수 있어요!',
      codeSnippet: `spawnBoss();\nboss.hp = 500;\nboss.pattern = 'spiral';`,
    },
  ],
};

const TEMPLE_RUNNER_CONFIG: GameVibeConfig = {
  sliders: [
    {
      id: 'runSpeed',
      label: '달리기 속도',
      icon: '🏃',
      type: 'slider',
      messageType: 'SET_RUN_SPEED',
      min: 1,
      max: 10,
      step: 0.5,
      defaultValue: 3,
      unit: 'x',
    },
    {
      id: 'coinMagnet',
      label: '코인 자석',
      icon: '🧲',
      type: 'toggle',
      messageType: 'SET_COIN_MAGNET',
    },
    {
      id: 'obstacleFreq',
      label: '장애물 빈도',
      icon: '🪨',
      type: 'slider',
      messageType: 'SET_OBSTACLE_FREQ',
      min: 0,
      max: 10,
      step: 1,
      defaultValue: 5,
      unit: '',
    },
  ],
  chatPatterns: [
    {
      patterns: ['빨리', 'fast', '속도', '터보'],
      messageType: 'SET_RUN_SPEED',
      value: 8,
      response: '💨 초고속 모드! 바람처럼 달려요!',
      codeSnippet: `runSpeed = 8;\ncamera.fov = 80;\ntrail.enabled = true;`,
    },
    {
      patterns: ['코인', 'coin', '자석', '모아'],
      messageType: 'SET_COIN_MAGNET',
      value: true,
      response: '🧲 코인 자석 ON! 코인이 알아서 따라와요.',
      codeSnippet: `player.magnetRadius = 5;\ncoins.forEach(c => c.attracted = true);`,
    },
  ],
};

const TETRIS_CONFIG: GameVibeConfig = {
  sliders: [
    {
      id: 'dropSpeed',
      label: '낙하 속도',
      icon: '⬇️',
      type: 'slider',
      messageType: 'SET_DROP_SPEED',
      min: 100,
      max: 2000,
      step: 100,
      defaultValue: 1000,
      unit: 'ms',
    },
    {
      id: 'gridWidth',
      label: '그리드 폭',
      icon: '📐',
      type: 'slider',
      messageType: 'SET_GRID_WIDTH',
      min: 6,
      max: 16,
      step: 1,
      defaultValue: 10,
      unit: '칸',
    },
    {
      id: 'ghost',
      label: '고스트 피스',
      icon: '👻',
      type: 'toggle',
      messageType: 'TOGGLE_GHOST',
    },
  ],
  chatPatterns: [
    {
      patterns: ['느리', 'slow', '천천히', '쉽'],
      messageType: 'SET_DROP_SPEED',
      value: 2000,
      response: '🐢 느긋하게~ 천천히 내려와요.',
      codeSnippet: `dropInterval = 2000;\nlevel = 1;\nupdateSpeedDisplay();`,
    },
    {
      patterns: ['빨리', 'fast', '어려', '극한'],
      messageType: 'SET_DROP_SPEED',
      value: 200,
      response: '⚡ 극한 속도! 손가락이 바빠져요!',
      codeSnippet: `dropInterval = 200;\neffects.screenShake(2);`,
    },
  ],
};

const DOT_RPG_CONFIG: GameVibeConfig = {
  sliders: [
    {
      id: 'playerHp',
      label: 'HP',
      icon: '❤️',
      type: 'slider',
      messageType: 'SET_PLAYER_HP',
      min: 10,
      max: 999,
      step: 10,
      defaultValue: 100,
      unit: '',
    },
    {
      id: 'playerAtk',
      label: '공격력',
      icon: '⚔️',
      type: 'slider',
      messageType: 'SET_PLAYER_ATK',
      min: 1,
      max: 99,
      step: 1,
      defaultValue: 10,
      unit: '',
    },
    {
      id: 'encounterRate',
      label: '조우율',
      icon: '👾',
      type: 'slider',
      messageType: 'SET_ENCOUNTER_RATE',
      min: 0,
      max: 100,
      step: 5,
      defaultValue: 30,
      unit: '%',
    },
  ],
  chatPatterns: [
    {
      patterns: ['무적', '강해', '최강', 'god'],
      messageType: 'SET_PLAYER_HP',
      value: 999,
      response: '💪 HP 999! 전설의 용사 모드!',
      codeSnippet: `player.hp = 999;\nplayer.maxHp = 999;\nplayer.atk = 99;`,
    },
  ],
};

const MOON_ORBIT_CONFIG: GameVibeConfig = {
  sliders: [
    {
      id: 'simSpeed',
      label: '시뮬 속도',
      icon: '⏱️',
      type: 'slider',
      messageType: 'SET_SIM_SPEED',
      min: 0.1,
      max: 20,
      step: 0.1,
      defaultValue: 1,
      unit: 'x',
    },
    {
      id: 'moonDist',
      label: '달 거리',
      icon: '🌙',
      type: 'slider',
      messageType: 'SET_MOON_DISTANCE',
      min: 2,
      max: 20,
      step: 0.5,
      defaultValue: 8,
      unit: '',
    },
    {
      id: 'showOrbits',
      label: '궤도선',
      icon: '⭕',
      type: 'toggle',
      messageType: 'TOGGLE_ORBITS',
    },
  ],
  chatPatterns: [
    {
      patterns: ['빨리', 'fast', '속도', '터보'],
      messageType: 'SET_SIM_SPEED',
      value: 10,
      response: '🚀 시뮬레이션 10배속! 시간이 빠르게 흘러요.',
      codeSnippet: `simSpeed = 10;\norbitTrail.length = 500;`,
    },
    {
      patterns: ['가까', 'close', '충돌'],
      messageType: 'SET_MOON_DISTANCE',
      value: 3,
      response: '🌙 달이 아주 가까워졌어요! 달이 가까울수록 바닷물을 끌어당기는 힘(조석력)도 세져요.',
      codeSnippet: `moonOrbit.radius = 3;\ntidalForce = calculateTidal(3);`,
    },
  ],
};

const NEON_PLATFORMER_CONFIG: GameVibeConfig = {
  sliders: [
    {
      id: 'scrollSpeed',
      label: '스크롤 속도',
      icon: '💨',
      type: 'slider',
      messageType: 'SET_SCROLL_SPEED',
      min: 0.5,
      max: 8,
      step: 0.5,
      defaultValue: 2,
      unit: 'x',
    },
    {
      id: 'difficulty',
      label: '난이도',
      icon: '📈',
      type: 'slider',
      messageType: 'SET_DIFFICULTY',
      min: 0.5,
      max: 5,
      step: 0.5,
      defaultValue: 1,
      unit: 'x',
    },
    {
      id: 'invincible',
      label: '무적 모드',
      icon: '🛡️',
      type: 'toggle',
      messageType: 'SET_INVINCIBLE',
    },
  ],
  chatPatterns: [
    {
      patterns: ['무적', 'invincible', '안죽', '불사'],
      messageType: 'SET_INVINCIBLE',
      value: true,
      response: '🛡️ 무적 모드! 떨어져도 살아남아요!',
      codeSnippet: `player.invincible = true;\nplayer.glow.color = '#00ff88';`,
    },
    {
      patterns: ['빨리', 'fast', '속도'],
      messageType: 'SET_SCROLL_SPEED',
      value: 5,
      response: '💨 초고속 스크롤! 반사신경이 필요해요!',
      codeSnippet: `scrollSpeed = 5;\ncamera.shake(0.02);`,
    },
    {
      patterns: ['쉽', 'easy', '느리'],
      messageType: 'SET_DIFFICULTY',
      value: 0.5,
      response: '🌿 이지 모드~ 여유롭게 즐기세요.',
      codeSnippet: `difficultyMult = 0.5;\nplatformGap = 80;`,
    },
  ],
};

const CAT_JUMP_CONFIG: GameVibeConfig = {
  sliders: [
    {
      id: 'lives',
      label: '목숨',
      icon: '❤️',
      type: 'slider',
      messageType: 'SET_CAT_LIVES',
      min: 1,
      max: 99,
      step: 1,
      defaultValue: 9,
      unit: '개',
    },
    {
      id: 'jumpForce',
      label: '점프력',
      icon: '🦘',
      type: 'slider',
      messageType: 'SET_JUMP_FORCE',
      min: 5,
      max: 25,
      step: 1,
      defaultValue: 12,
      unit: '',
    },
    {
      id: 'gravity',
      label: '중력',
      icon: '🌍',
      type: 'slider',
      messageType: 'SET_GRAVITY',
      min: 0.1,
      max: 1.5,
      step: 0.05,
      defaultValue: 0.5,
      unit: '',
    },
  ],
  chatPatterns: [
    {
      patterns: ['목숨', '라이프', '99', '무한'],
      messageType: 'SET_CAT_LIVES',
      value: 99,
      response: '❤️ 목숨 99개! 고양이 목숨이 9개라는데, 그 열 배가 넘어요!',
      codeSnippet: `cat.lives = 99;\nspawnHearts(cat.x, cat.y);\nsfxPowerup();`,
    },
    {
      patterns: ['높이', '점프', '날아', '슈퍼'],
      messageType: 'SET_JUMP_FORCE',
      value: 20,
      response: '🚀 슈퍼 점프! 구름 위까지 날아가요!',
      codeSnippet: `jumpForce = 20;\ncat.trail = true;\nparticles.emit('stars');`,
    },
    {
      patterns: ['달', '무중력', '가벼', '느리'],
      messageType: 'SET_GRAVITY',
      value: 0.15,
      response: '🌙 무중력 모드! 달에서 뛰는 느낌~',
      codeSnippet: `gravity = 0.15;\nbgColor = '#1a1a3e';`,
    },
  ],
};

const BALLOON_POP_CONFIG: GameVibeConfig = {
  sliders: [
    {
      id: 'time',
      label: '남은 시간',
      icon: '⏰',
      type: 'slider',
      messageType: 'SET_TIME',
      min: 10,
      max: 300,
      step: 10,
      defaultValue: 60,
      unit: '초',
    },
    {
      id: 'combo',
      label: '콤보 부스트',
      icon: '🔥',
      type: 'slider',
      messageType: 'SET_COMBO',
      min: 0,
      max: 50,
      step: 1,
      defaultValue: 0,
      unit: 'x',
    },
    {
      id: 'spawnRate',
      label: '풍선 생성',
      icon: '🎈',
      type: 'slider',
      messageType: 'SET_SPAWN_RATE',
      min: 0.5,
      max: 5,
      step: 0.5,
      defaultValue: 1,
      unit: 'x',
    },
  ],
  chatPatterns: [
    {
      patterns: ['시간', '추가', '더', 'time'],
      messageType: 'SET_TIME',
      value: 120,
      response: '⏰ 시간 2분으로 연장! 더 많이 터뜨려요!',
      codeSnippet: `timeLeft = 120;\ntimer.reset();\nsfxTimeBonus();`,
    },
    {
      patterns: ['콤보', 'combo', '연속', '폭발'],
      messageType: 'SET_COMBO',
      value: 20,
      response: '🔥 콤보 x20! 점수가 쭉쭉 올라가요!',
      codeSnippet: `combo = 20;\ncomboTimer = 10;\nscreen.flash('#ff0');`,
    },
    {
      patterns: ['많이', '빵빵', '풍선', '가득'],
      messageType: 'SET_SPAWN_RATE',
      value: 4,
      response: '🎈 풍선이 빵빵! 화면이 가득 차요!',
      codeSnippet: `spawnRate = 4;\nfor(let i=0;i<20;i++) spawnBalloon();`,
    },
  ],
};

const STAR_CATCH_CONFIG: GameVibeConfig = {
  sliders: [
    {
      id: 'lives',
      label: '목숨',
      icon: '❤️',
      type: 'slider',
      messageType: 'SET_LIVES',
      min: 1,
      max: 20,
      step: 1,
      defaultValue: 5,
      unit: '개',
    },
    {
      id: 'level',
      label: '레벨',
      icon: '⭐',
      type: 'slider',
      messageType: 'SET_LEVEL',
      min: 1,
      max: 20,
      step: 1,
      defaultValue: 1,
      unit: '',
    },
    {
      id: 'spawnRate',
      label: '별 생성',
      icon: '✨',
      type: 'slider',
      messageType: 'SET_SPAWN_RATE',
      min: 0.5,
      max: 5,
      step: 0.5,
      defaultValue: 1,
      unit: 'x',
    },
  ],
  chatPatterns: [
    {
      patterns: ['목숨', '라이프', '안죽', '무한'],
      messageType: 'SET_LIVES',
      value: 20,
      response: '❤️ 목숨 20개! 넉넉하게 즐기세요~',
      codeSnippet: `lives = 20;\nupdateHUD();\nsfxPowerup();`,
    },
    {
      patterns: ['레벨', 'level', '높', '어려'],
      messageType: 'SET_LEVEL',
      value: 15,
      response: '⭐ 레벨 15! 별이 쏟아져요!',
      codeSnippet: `level = 15;\nspawnRate *= 3;\nstarSize = 'large';`,
    },
    {
      patterns: ['별', '많이', '가득', '쏟아'],
      messageType: 'SET_SPAWN_RATE',
      value: 4,
      response: '✨ 별이 쏟아져요! 밤하늘이 반짝반짝!',
      codeSnippet: `spawnMultiplier = 4;\nfor(let i=0;i<10;i++) spawnStar();`,
    },
  ],
};

const GUGUDAN_CONFIG: GameVibeConfig = {
  sliders: [
    {
      id: 'dan',
      label: '현재 단',
      icon: '🔢',
      type: 'select',
      messageType: 'SET_DAN',
      options: [
        { label: '2단', value: '2' },
        { label: '3단', value: '3' },
        { label: '4단', value: '4' },
        { label: '5단', value: '5' },
        { label: '6단', value: '6' },
        { label: '7단', value: '7' },
        { label: '8단', value: '8' },
        { label: '9단', value: '9' },
      ],
    },
    {
      id: 'shape',
      label: '구슬 모양',
      icon: '⚪',
      type: 'select',
      messageType: 'SET_SHAPE',
      options: [
        { label: '⚪ 구슬', value: 'sphere' },
        { label: '🟦 큐브', value: 'cube' },
        { label: '🔵 원기둥', value: 'cylinder' },
      ],
    },
    {
      id: 'skipToQuiz',
      label: '바로 퀴즈',
      icon: '⚡',
      type: 'toggle',
      messageType: 'SKIP_TO_QUIZ',
    },
  ],
  chatPatterns: [
    {
      patterns: ['7단', '어려', '칠', '일곱'],
      messageType: 'SET_DAN',
      value: 7,
      response: '🔢 7단으로 이동! 가장 어려운 단이에요!',
      codeSnippet: `D = 7;\nP = 0;\nexpN = 1;\nclearAll();\nrender();`,
    },
    {
      patterns: ['퀴즈', 'quiz', '시험', '테스트'],
      messageType: 'SKIP_TO_QUIZ',
      value: true,
      response: '⚡ 바로 퀴즈 모드! 실력을 보여주세요!',
      codeSnippet: `P = 3;\nstartQuiz();\nflash('퀴즈 시작!', '#007AFF');`,
    },
    {
      patterns: ['큐브', '네모', '사각', 'cube'],
      messageType: 'SET_SHAPE',
      value: 'cube',
      response: '🟦 구슬이 네모 큐브로 변했어요!',
      codeSnippet: `sphereShape = 'cube';\nrender();\nspawnParticles(10);`,
    },
    {
      patterns: ['전부', '완성', '올클', '다 깨'],
      messageType: 'COMPLETE_ALL',
      value: true,
      response: '🎉 2단~9단 전부 완성! 구구단 마스터!',
      codeSnippet: `for(let d=2;d<=9;d++) done[d]=true;\nscore = 1220;\nsfxComplete();`,
    },
    {
      patterns: ['9단', '구단', '아홉'],
      messageType: 'SET_DAN',
      value: 9,
      response: '🔢 9단! 십의자리+일의자리=9 패턴 찾아봐요!',
      codeSnippet: `D = 9;\nP = 0;\nrender();`,
    },
  ],
};

// Default config for games without specific config
const DEFAULT_CONFIG: GameVibeConfig = {
  sliders: [
    {
      id: 'gameSpeed',
      label: '게임 속도',
      icon: '⚡',
      type: 'slider',
      messageType: 'SET_GAME_SPEED',
      min: 0.5,
      max: 3,
      step: 0.25,
      defaultValue: 1,
      unit: 'x',
    },
  ],
  chatPatterns: [
    {
      patterns: ['빨리', 'fast', '속도'],
      messageType: 'SET_GAME_SPEED',
      value: 2,
      response: '⚡ 게임 속도 2배! 눈이 바빠질 거예요!',
      codeSnippet: `gameSpeed = 2.0;`,
    },
  ],
};

const VIBE_CONFIGS: Record<string, GameVibeConfig> = {
  'farm-garden': FARM_GARDEN_CONFIG,
  'neon-shooter': NEON_SHOOTER_CONFIG,
  'neon-platformer': NEON_PLATFORMER_CONFIG,
  'temple-runner': TEMPLE_RUNNER_CONFIG,
  'tetris': TETRIS_CONFIG,
  'dot-rpg': DOT_RPG_CONFIG,
  'cat-jump': CAT_JUMP_CONFIG,
  'balloon-pop': BALLOON_POP_CONFIG,
  'star-catch': STAR_CATCH_CONFIG,
  'moon-orbit': MOON_ORBIT_CONFIG,
  'gugudan': GUGUDAN_CONFIG,
};

export function getVibeConfig(gameId: string): GameVibeConfig {
  return VIBE_CONFIGS[gameId] || DEFAULT_CONFIG;
}

/** Match user's chat input to a ChatPattern */
export function matchChatCommand(gameId: string, input: string): ChatPattern | null {
  const config = getVibeConfig(gameId);
  const lower = input.toLowerCase();

  let bestMatch: ChatPattern | null = null;
  let bestScore = 0;

  for (const pattern of config.chatPatterns) {
    const matchCount = pattern.patterns.filter(p => lower.includes(p.toLowerCase())).length;
    if (matchCount > bestScore) {
      bestScore = matchCount;
      bestMatch = pattern;
    }
  }

  return bestMatch;
}
