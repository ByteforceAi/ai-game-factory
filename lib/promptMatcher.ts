export interface MatchResult {
  gameId: string;
  confidence: number;
  detectedKeywords: string[];
  genre: string;
  engine: string;
  artStyle: string;
  systems: string;
}

const GAME_KEYWORDS: Record<string, {
  keywords: string[];
  genre: string;
  engine: string;
  artStyle: string;
  systems: string;
}> = {
  'neon-shooter': {
    keywords: ['슈팅', '우주', '비행기', '총', '적', '발사', 'shoot', 'space', '전투', '미사일', '보스', '탄막', '탄알', '외계인', '레이저', '공격', '폭발', '전쟁'],
    genre: 'Vertical Scroll Shooter',
    engine: 'Phaser.js 3.80 — Arcade Physics',
    artStyle: 'Neon Cyberpunk',
    systems: 'Wave AI + Boss + Power-ups',
  },
  'neon-platformer': {
    keywords: ['플랫포머', '점프', '횡스크롤', '벽', 'platform', 'jump', '마리오', '닌자', '어드벤처', '모험', '캐릭터', '히어로', '영웅'],
    genre: 'Physics Platformer',
    engine: 'Phaser.js 3.80 — Arcade Physics',
    artStyle: 'Neon Retrowave',
    systems: 'Double Jump + Wall Slide + Procedural Map',
  },
  'temple-runner': {
    keywords: ['3d', '3D', '러너', '달리기', '장애물', '피하기', '템플', 'runner', '레인', '무한', '코인', 'temple', '던전', '탈출', '도망', '쫓기', '속도'],
    genre: '3D Endless Runner',
    engine: 'Three.js r160 — WebGL',
    artStyle: 'Temple Ruins',
    systems: 'Lane Switch + Obstacles + Coins',
  },
  'tetris': {
    keywords: ['테트리스', '퍼즐', '블록', '떨어지는', 'tetris', 'puzzle', '쌓기', '라인', '클래식', '고전', '레트로', '타일'],
    genre: 'Classic Puzzle',
    engine: 'Canvas 2D — 10×20 Grid',
    artStyle: 'Neon Minimal',
    systems: 'SRS Rotation + Line Combos + Level Up',
  },
  'emoji-burger': {
    keywords: ['이모지', '버거', '햄버거', '캐치', '받기', '음식', 'catch', 'food', '먹기', '모으기', '떨어지', '귀여운', '캐주얼', '간단', '쉬운'],
    genre: 'Catch & Collect',
    engine: 'Canvas 2D — 60fps',
    artStyle: 'Emoji Pop',
    systems: 'Physics Drop + Combo + Speed Ramp',
  },
  'dot-rpg': {
    keywords: ['rpg', 'RPG', '알피지', '도트', '픽셀', '마을', '던전', '몬스터', '퀘스트', '용사', '탐험', '전투', '턴제', '레벨', '경험치', 'npc', '대화', '슬라임', '검', '방패', '기사', '캐릭터', '성장'],
    genre: 'Pixel Dot RPG',
    engine: 'Canvas 2D — Tile Map',
    artStyle: 'Classic Pixel RPG',
    systems: 'Tile Map + NPC Dialog + Turn Battle + Level Up',
  },
  'cat-jump': {
    keywords: ['고양이', '냥이', '캣', 'cat', '점프', '뛰기', '올라가기', '위로', '귀여운', '아기자기', '냥', '발바닥', '털실'],
    genre: 'Cute Platformer',
    engine: 'Canvas 2D — 60fps',
    artStyle: 'Kawaii Pastel',
    systems: 'Infinite Jump + Moving Platforms + Hearts',
  },
  'balloon-pop': {
    keywords: ['풍선', '터뜨리기', '팝', 'balloon', 'pop', '터치', '탭', '콤보', '시간제한', '타이머'],
    genre: 'Tap & Pop',
    engine: 'Canvas 2D — Touch',
    artStyle: 'Pastel Rainbow',
    systems: 'Tap Pop + Combo + Timer + Bombs',
  },
  'star-catch': {
    keywords: ['별', '모으기', 'star', '밤하늘', '하늘', '구름', '캐치', '받기', '모아', '떨어지는별', '소원'],
    genre: 'Catch & Collect',
    engine: 'Canvas 2D — Night Sky',
    artStyle: 'Dreamy Night',
    systems: 'Mouse Follow + Item Types + Level Scaling',
  },
  'moon-orbit': {
    keywords: ['달', '공전', '궤도', '시뮬레이션', '천문', '우주', 'moon', 'orbit', 'simulation', '지구', '태양', '월령', '조석', '위성', '행성', '태양계', '과학', '물리', '천체'],
    genre: '3D Orbital Simulation',
    engine: 'Three.js r128 — WebGL',
    artStyle: 'Space Dark',
    systems: 'Elliptical Orbit + Tidal Lock + Moon Phase + Camera Control',
  },
};

const FALLBACK_ORDER = ['neon-shooter', 'temple-runner', 'neon-platformer', 'tetris', 'emoji-burger', 'cat-jump', 'balloon-pop', 'star-catch'];

export function matchPromptToGame(input: string): MatchResult {
  const lower = input.toLowerCase();
  let bestId = FALLBACK_ORDER[0];
  let bestScore = 0;
  let bestKeywords: string[] = [];

  for (const [gameId, data] of Object.entries(GAME_KEYWORDS)) {
    const matched = data.keywords.filter(kw => lower.includes(kw.toLowerCase()));
    const score = matched.length;
    if (score > bestScore) {
      bestScore = score;
      bestId = gameId;
      bestKeywords = matched;
    }
  }

  // Heuristics for zero-match
  if (bestScore === 0) {
    if (lower.includes('시뮬') || lower.includes('simulation')) bestId = 'moon-orbit';
    else if (lower.includes('3d')) bestId = 'temple-runner';
    else if (lower.includes('고전') || lower.includes('레트로')) bestId = 'tetris';
    else if (lower.includes('귀여') || lower.includes('쉬운')) bestId = 'emoji-burger';
    else bestId = FALLBACK_ORDER[Math.floor(Math.random() * 3)];
  }

  const data = GAME_KEYWORDS[bestId];
  return {
    gameId: bestId,
    confidence: Math.min(98, 78 + bestScore * 7),
    detectedKeywords: bestKeywords.length > 0 ? bestKeywords : [input.trim().split(' ')[0] || 'game'],
    genre: data.genre,
    engine: data.engine,
    artStyle: data.artStyle,
    systems: data.systems,
  };
}
