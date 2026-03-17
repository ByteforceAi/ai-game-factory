'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DEMO_GAMES, DemoGame } from '@/lib/demoGames';
import { matchPromptToGame, MatchResult } from '@/lib/promptMatcher';
import { playSelect, playComplete, playWhoosh, playTick } from '@/lib/sounds';

/* ═══════════════════════════════════════════════
   Inspiration Chips — flat list, no categories
   ═══════════════════════════════════════════════ */
interface ChipItem { label: string; prompt: string; }

const CHIPS: ChipItem[] = [
  { label: '🚀 우주 슈팅', prompt: '우주에서 적을 쏘는 네온 슈팅게임' },
  { label: '🧮 구구단', prompt: '3D 구구단 학습 곱셈 퀴즈' },
  { label: '🌙 달의 공전', prompt: '달의 공전 궤도 시뮬레이션' },
  { label: '🏃 3D 러너', prompt: '3D 장애물 피하는 템플 러너' },
  { label: '🧱 테트리스', prompt: '클래식 테트리스 게임' },
  { label: '🐱 고양이 점프', prompt: '귀여운 고양이 점프 게임' },
  { label: '⚔️ 도트 RPG', prompt: '픽셀 도트 RPG 마을 탐험과 턴제 전투' },
  { label: '🌿 마음의 텃밭', prompt: '3D 힐링 농장 텃밭 작물 키우기' },
  { label: '😄 이모지 캐치', prompt: '떨어지는 이모지 받기 게임' },
  { label: '🎈 풍선 팝', prompt: '풍선 터뜨리기 타이머 게임' },
  { label: '⭐ 별 모으기', prompt: '밤하늘 별 모으기 게임' },
  { label: '🏃 네온 플랫포머', prompt: '점프하고 벽타는 네온 러너 게임' },
];

/* ═══════════════════════════════════════════════
   Per-game modifier system
   ═══════════════════════════════════════════════ */
interface ModOption { value: string; label: string; }
interface ModSlot { id: string; question: string; options: ModOption[]; hasSkip?: boolean; }

const GAME_MODIFIERS: Record<string, ModSlot[]> = {
  'neon-shooter': [
    { id: 'bulletPattern', question: '탄막 패턴을 골라주세요.', options: [
      { value: 'single', label: '🔫 싱글샷' }, { value: 'spread', label: '🌀 확산탄' },
      { value: 'laser', label: '⚡ 레이저빔' }, { value: 'homing', label: '🎯 유도탄' },
    ]},
    { id: 'bossType', question: '보스 스타일은요?', options: [
      { value: 'mecha', label: '🤖 메카닉' }, { value: 'alien', label: '👾 외계 생물' },
      { value: 'warship', label: '🚀 거대 전함' }, { value: 'swarm', label: '🐝 군집형' },
    ]},
    { id: 'powerup', question: '파워업을 추가할까요?', options: [
      { value: 'shield', label: '🛡️ 쉴드' }, { value: 'bomb', label: '💣 스크린 폭탄' },
      { value: 'speed', label: '⚡ 이동속도' }, { value: 'multi', label: '✨ 멀티샷' },
    ], hasSkip: true },
  ],
  'neon-platformer': [
    { id: 'movement', question: '이동 스타일을 골라주세요.', options: [
      { value: 'double', label: '🦘 더블점프' }, { value: 'dash', label: '💨 대시' },
      { value: 'wall', label: '🧗 벽타기' }, { value: 'glide', label: '🪂 글라이드' },
    ]},
    { id: 'mapStyle', question: '맵 분위기는요?', options: [
      { value: 'neon', label: '💜 네온 시티' }, { value: 'forest', label: '🌳 신비의 숲' },
      { value: 'space', label: '🌌 우주 정거장' }, { value: 'lava', label: '🌋 용암 동굴' },
    ]},
    { id: 'hazard', question: '장애물 타입은?', options: [
      { value: 'spike', label: '🔺 가시' }, { value: 'laser', label: '🔴 레이저' },
      { value: 'enemy', label: '👾 적 몬스터' }, { value: 'puzzle', label: '🧩 퍼즐 블록' },
    ], hasSkip: true },
  ],
  'temple-runner': [
    { id: 'theme', question: '러너 배경을 골라주세요.', options: [
      { value: 'temple', label: '🏛️ 고대 신전' }, { value: 'cyber', label: '🌃 사이버 도시' },
      { value: 'snow', label: '🏔️ 설산' }, { value: 'underwater', label: '🌊 해저' },
    ]},
    { id: 'speed', question: '시작 속도는요?', options: [
      { value: 'chill', label: '🐢 여유롭게' }, { value: 'normal', label: '🏃 보통' },
      { value: 'fast', label: '⚡ 빠르게' }, { value: 'sonic', label: '🚀 소닉 모드' },
    ]},
    { id: 'obstacle', question: '장애물 유형을 추가할까요?', options: [
      { value: 'walls', label: '🧱 벽' }, { value: 'gaps', label: '🕳️ 구멍' },
      { value: 'moving', label: '🔄 움직이는 벽' }, { value: 'combo', label: '💥 전부 다!' },
    ], hasSkip: true },
  ],
  'tetris': [
    { id: 'speed', question: '시작 속도를 골라주세요.', options: [
      { value: 'slow', label: '🐌 느리게' }, { value: 'normal', label: '⏱️ 보통' },
      { value: 'fast', label: '⚡ 빠르게' }, { value: 'insane', label: '💀 미친 속도' },
    ]},
    { id: 'visual', question: '비주얼 테마는요?', options: [
      { value: 'classic', label: '🕹️ 클래식' }, { value: 'neon', label: '💜 네온' },
      { value: 'retro', label: '📺 레트로 TV' }, { value: 'minimal', label: '⬜ 미니멀' },
    ]},
    { id: 'rule', question: '특수 규칙을 넣을까요?', options: [
      { value: 'ghost', label: '👻 고스트 피스' }, { value: 'hold', label: '📦 홀드' },
      { value: 'bomb', label: '💣 폭탄 블록' }, { value: 'gravity', label: '🌀 중력 변환' },
    ], hasSkip: true },
  ],
  'dot-rpg': [
    { id: 'class', question: '시작 직업을 골라주세요.', options: [
      { value: 'warrior', label: '⚔️ 전사' }, { value: 'mage', label: '🔮 마법사' },
      { value: 'archer', label: '🏹 궁수' }, { value: 'thief', label: '🗡️ 도적' },
    ]},
    { id: 'world', question: '월드 분위기는요?', options: [
      { value: 'medieval', label: '🏰 중세 판타지' }, { value: 'dark', label: '🌑 다크 판타지' },
      { value: 'cute', label: '🌸 아기자기' }, { value: 'scifi', label: '🛸 SF 판타지' },
    ]},
    { id: 'battle', question: '전투 시스템은?', options: [
      { value: 'turn', label: '⏳ 턴제' }, { value: 'action', label: '⚡ 액션' },
      { value: 'auto', label: '🤖 오토 배틀' }, { value: 'card', label: '🃏 카드 배틀' },
    ], hasSkip: true },
  ],
  'cat-jump': [
    { id: 'catSkin', question: '고양이를 골라주세요.', options: [
      { value: 'orange', label: '🐱 치즈냥' }, { value: 'black', label: '🐈‍⬛ 검은냥' },
      { value: 'calico', label: '🐈 삼색냥' }, { value: 'space', label: '🌟 우주냥' },
    ]},
    { id: 'world', question: '배경 월드는요?', options: [
      { value: 'sky', label: '☁️ 하늘 위' }, { value: 'forest', label: '🌿 고양이 숲' },
      { value: 'candy', label: '🍭 사탕 나라' }, { value: 'night', label: '🌙 별빛 밤' },
    ]},
    { id: 'ability', question: '특수 능력을 줄까요?', options: [
      { value: 'float', label: '🎈 공중 부양' }, { value: 'magnet', label: '🧲 아이템 자석' },
      { value: 'shield', label: '💖 하트 보호막' }, { value: 'dash', label: '💨 냥냥 대시' },
    ], hasSkip: true },
  ],
  'balloon-pop': [
    { id: 'timeLimit', question: '제한 시간을 정해주세요.', options: [
      { value: '30', label: '⚡ 30초 스프린트' }, { value: '60', label: '⏱️ 1분' },
      { value: '120', label: '🕐 2분' }, { value: 'endless', label: '♾️ 무한모드' },
    ]},
    { id: 'balloonType', question: '풍선 타입은요?', options: [
      { value: 'normal', label: '🎈 일반 풍선' }, { value: 'water', label: '💧 물풍선' },
      { value: 'gold', label: '✨ 황금 풍선' }, { value: 'mix', label: '🌈 레인보우 믹스' },
    ]},
    { id: 'hazard', question: '방해 요소를 넣을까요?', options: [
      { value: 'bomb', label: '💣 폭탄' }, { value: 'ice', label: '🧊 빙결 풍선' },
      { value: 'shrink', label: '🔍 미니 풍선' }, { value: 'wind', label: '💨 바람' },
    ], hasSkip: true },
  ],
  'star-catch': [
    { id: 'sky', question: '밤하늘 테마를 골라주세요.', options: [
      { value: 'normal', label: '🌌 기본 밤하늘' }, { value: 'aurora', label: '🟢 오로라' },
      { value: 'galaxy', label: '🌀 은하수' }, { value: 'nebula', label: '💜 성운' },
    ]},
    { id: 'starType', question: '별 종류는요?', options: [
      { value: 'normal', label: '⭐ 기본 별' }, { value: 'constellation', label: '✨ 별자리' },
      { value: 'shooting', label: '🌠 유성' }, { value: 'planet', label: '🪐 행성 믹스' },
    ]},
    { id: 'weather', question: '하늘 날씨는?', options: [
      { value: 'clear', label: '🌙 맑은 밤' }, { value: 'cloud', label: '☁️ 구름 많음' },
      { value: 'snow', label: '❄️ 눈 내리는 밤' }, { value: 'storm', label: '⚡ 천둥 번개' },
    ], hasSkip: true },
  ],
  'emoji-burger': [
    { id: 'emojiTheme', question: '이모지 테마를 골라주세요.', options: [
      { value: 'food', label: '🍔 음식' }, { value: 'animal', label: '🐶 동물' },
      { value: 'sport', label: '⚽ 스포츠' }, { value: 'random', label: '🎲 랜덤 믹스' },
    ]},
    { id: 'speed', question: '떨어지는 속도는요?', options: [
      { value: 'slow', label: '🐢 느긋하게' }, { value: 'normal', label: '🏃 보통' },
      { value: 'fast', label: '⚡ 빠르게' }, { value: 'chaos', label: '🌪️ 카오스' },
    ]},
    { id: 'bonus', question: '보너스 시스템은?', options: [
      { value: 'combo', label: '🔥 콤보' }, { value: 'fever', label: '🌟 피버 타임' },
      { value: 'magnet', label: '🧲 자석 모드' }, { value: 'multi', label: '✖️ 점수 배율' },
    ], hasSkip: true },
  ],
  'farm-garden': [
    { id: 'season', question: '시작 계절을 골라주세요.', options: [
      { value: 'spring', label: '🌸 봄' }, { value: 'summer', label: '☀️ 여름' },
      { value: 'autumn', label: '🍂 가을' }, { value: 'winter', label: '❄️ 겨울' },
    ]},
    { id: 'farmSize', question: '밭 크기는 어떻게 할까요?', options: [
      { value: 'cozy', label: '🏡 아담한 3×3' }, { value: 'normal', label: '🌾 보통 5×5' },
      { value: 'large', label: '🚜 넓은 7×7' }, { value: 'ranch', label: '🏞️ 목장 사이즈' },
    ]},
    { id: 'weather', question: '날씨 빈도를 정할까요?', options: [
      { value: 'sunny', label: '☀️ 맑은 날 위주' }, { value: 'rainy', label: '🌧️ 비 자주' },
      { value: 'random', label: '🎲 랜덤' }, { value: 'extreme', label: '🌪️ 극한 날씨' },
    ], hasSkip: true },
  ],
  'gugudan': [
    { id: 'startDan', question: '몇 단부터 시작할까요?', options: [
      { value: '2', label: '2️⃣ 2단부터' }, { value: '5', label: '5️⃣ 5단부터' },
      { value: '7', label: '7️⃣ 어려운 7단' }, { value: 'random', label: '🎲 랜덤' },
    ]},
    { id: 'quizMode', question: '학습 방식은요?', options: [
      { value: 'step', label: '📖 단계별 학습' }, { value: 'quiz', label: '⚡ 바로 퀴즈' },
      { value: 'explore', label: '🔍 탐색만' }, { value: 'speed', label: '🏃 스피드런' },
    ]},
    { id: 'shape', question: '구슬 모양을 골라주세요.', options: [
      { value: 'sphere', label: '⚪ 구슬' }, { value: 'cube', label: '🟦 큐브' },
      { value: 'cylinder', label: '🔵 원기둥' },
    ], hasSkip: true },
  ],
  'moon-orbit': [
    { id: 'simSpeed', question: '시뮬레이션 속도는요?', options: [
      { value: 'realtime', label: '🕐 실시간' }, { value: 'fast', label: '⚡ 고속 (×10)' },
      { value: 'ultra', label: '🚀 초고속 (×100)' }, { value: 'cinematic', label: '🎬 시네마틱' },
    ]},
    { id: 'detail', question: '디테일 수준을 골라주세요.', options: [
      { value: 'minimal', label: '🔵 미니멀' }, { value: 'standard', label: '🌍 표준' },
      { value: 'rich', label: '✨ 고퀄리티' }, { value: 'scientific', label: '🔬 과학 모드' },
    ]},
    { id: 'overlay', question: '정보 오버레이를 추가할까요?', options: [
      { value: 'hud', label: '📊 데이터 HUD' }, { value: 'labels', label: '🏷️ 라벨 표시' },
      { value: 'trail', label: '🌀 궤적 표시' }, { value: 'clean', label: '🖼️ 클린 뷰' },
    ], hasSkip: true },
  ],
};

const DEFAULT_MODIFIER_SLOTS: ModSlot[] = [
  { id: 'difficulty', question: '난이도를 선택해주세요.', options: [
    { value: 'easy', label: '😊 이지' }, { value: 'normal', label: '⚡ 노멀' },
    { value: 'hard', label: '🔥 하드' }, { value: 'nightmare', label: '💀 나이트메어' },
  ]},
  { id: 'style', question: '비주얼 스타일은요?', options: [
    { value: 'neon', label: '💜 네온' }, { value: 'retro', label: '🕹️ 레트로' },
    { value: 'minimal', label: '⬜ 미니멀' }, { value: 'cyber', label: '🌃 사이버펑크' },
  ]},
  { id: 'effect', question: '특수효과를 추가할까요?', options: [
    { value: 'particle', label: '✨ 파티클' }, { value: 'shake', label: '📳 화면흔들림' },
    { value: 'combo', label: '🎯 콤보 시스템' }, { value: 'slowmo', label: '🕐 슬로우모션' },
  ], hasSkip: true },
];

function getModifierSlots(gameId: string): ModSlot[] {
  return GAME_MODIFIERS[gameId] || DEFAULT_MODIFIER_SLOTS;
}

/* ═══════════════════════════════════════════════
   AI Reactions — per slot/value
   ═══════════════════════════════════════════════ */
const AI_REACTIONS: Record<string, Record<string, string>> = {
  bulletPattern: { single: '정확한 한 발, 스나이퍼 스타일이네요.', spread: '넓게 퍼지는 탄막, 시원하겠네요.', laser: '관통하는 레이저빔, 강력해요.', homing: '유도탄이면 빗나갈 일 없죠.' },
  bossType: { mecha: '거대 로봇 보스, 멋지겠네요.', alien: '외계 생물체 보스, 기괴한 패턴이겠죠.', warship: '거대 전함, 박진감 넘치겠어요.', swarm: '수천 마리가 몰려오는 군집형, 소름.' },
  powerup: { shield: '든든한 보호막, 생존에 유리해요.', bomb: '스크린 폭탄으로 한방 정리!', speed: '빠른 이동으로 탄막을 회피해요.', multi: '멀티샷으로 화력을 높여볼게요.', skip: '기본 세팅으로 갈게요.' },
  movement: { double: '더블점프! 기본 중의 기본이죠.', dash: '순간 대시, 짜릿한 속도감!', wall: '벽을 타고 오르는 닌자 스타일.', glide: '하늘을 나는 듯한 글라이딩.' },
  mapStyle: { neon: '네온 불빛이 반짝이는 밤거리.', forest: '신비로운 숲속을 달려볼게요.', space: '무중력 우주 정거장, 신선하네요.', lava: '용암 위를 뛰어다니는 긴장감!' },
  hazard: { spike: '뾰족한 가시, 클래식한 위험요소.', laser: '레이저 빔 피하기, 타이밍이 핵심.', enemy: '몬스터를 피하면서 달려볼게요.', puzzle: '퍼즐 블록으로 머리도 써야 해요.', skip: '기본 장애물로 갈게요.', bomb: '폭탄이 터지기 전에 피해요!', ice: '빙결 풍선, 조심하세요!', shrink: '미니 풍선은 정밀 터치!', wind: '바람이 풍선을 흔들어요!' },
  theme: { temple: '고대 유적의 신비로운 분위기.', cyber: '사이버펑크 도시를 달려요.', snow: '설산을 가로지르는 모험!', underwater: '해저 터널, 환상적이겠네요.' },
  speed: { chill: '편하게 경치 감상하면서.', normal: '적당한 속도감, 좋아요.', fast: '빠르게! 반응 속도가 중요해요.', sonic: '초고속 모드, 눈이 바빠지겠네요.', slow: '좋아요, 천천히 가볼게요.', insane: '미친 속도, 건투를 빕니다!', chaos: '카오스 모드! 생존이 목표에요.' },
  obstacle: { walls: '벽을 피하는 클래식한 스타일.', gaps: '틈새를 뛰어넘는 스릴!', moving: '움직이는 장애물, 긴장감 UP.', combo: '전부 다! 하드코어 가보죠.', skip: '기본 장애물로 시작할게요.' },
  visual: { classic: '클래식 테트리스 감성, 최고.', neon: '형형색색 네온, 화려하게.', retro: '브라운관 TV 느낌, 향수가.', minimal: '깔끔한 미니멀, 집중하기 좋아요.' },
  rule: { ghost: '고스트 피스로 착지점을 미리 보여줄게요.', hold: '홀드 기능으로 전략적 플레이!', bomb: '폭탄 블록, 한방에 줄을 날려요.', gravity: '중력이 바뀌면 멘탈도 바뀌어요.', skip: '클래식 룰로 갈게요.' },
  class: { warrior: '튼튼한 전사, 근접 전투의 왕.', mage: '강력한 마법사, 화력이 최고.', archer: '날렵한 궁수, 원거리 딜러.', thief: '은밀한 도적, 크리티컬 한 방.' },
  world: { medieval: '검과 마법의 클래식 판타지.', dark: '어둡고 무거운 세계관.', cute: '아기자기한 세상, 힐링되겠네요.', scifi: 'SF와 판타지의 만남, 독특해요.', sky: '하늘 위 구름 사이를 뛰어다녀요.', forest: '자연 속에서 모험!', candy: '사탕 나라, 달콤한 세계!', night: '별빛 아래 점프!', },
  battle: { turn: '전략적 턴제, 생각하며 싸워요.', action: '실시간 액션, 손맛이 최고.', auto: '편하게 오토 배틀, 구경하세요.', card: '카드 배틀, 덱 빌딩의 재미.', skip: '기본 전투 시스템으로.' },
  catSkin: { orange: '귀여운 치즈냥이 출발!', black: '시크한 검은 고양이, 멋져요.', calico: '삼색냥 아기자기 매력.', space: '우주 고양이, 반짝반짝!' },
  ability: { float: '공중 부양으로 떨어질 걱정 없어요.', magnet: '아이템 자석, 자동으로 쏙쏙.', shield: '하트 보호막으로 안전하게.', dash: '냥냥 대시로 빠르게 이동!', skip: '기본 능력으로 시작할게요.' },
  timeLimit: { '30': '30초 스프린트! 집중력 테스트.', '60': '1분, 적당한 긴장감.', '120': '2분, 여유롭게 즐겨요.', endless: '무한모드, 끝없는 도전!' },
  balloonType: { normal: '알록달록 기본 풍선.', water: '물풍선 터지면 스플래시!', gold: '황금 풍선, 고득점 찬스.', mix: '레인보우 믹스, 전부 섞어요.' },
  sky: { normal: '고요한 밤하늘, 별이 쏟아져요.', aurora: '초록빛 오로라 아래서.', galaxy: '은하수를 배경으로.', nebula: '몽환적인 성운 속에서.' },
  starType: { normal: '반짝이는 기본 별들.', constellation: '별자리를 모아보세요.', shooting: '유성을 잡아요, 소원 빌기!', planet: '행성과 별이 섞여있어요.' },
  weather: { clear: '맑은 밤하늘, 완벽해요.', cloud: '구름 사이로 별 찾기!', snow: '눈 내리는 밤, 로맨틱하네요.', storm: '천둥 번개 속 별 모으기!', sunny: '맑은 날씨로 안정적 농사.', rainy: '비 자주 오면 물 주기 절약!', random: '예측불가 날씨, 리얼리즘.', extreme: '극한 날씨, 서바이벌 농장.', skip: '랜덤 날씨로 갈게요.' },
  emojiTheme: { food: '맛있는 음식 이모지, 냠냠.', animal: '귀여운 동물 이모지들.', sport: '스포츠 이모지, 활기차게.', random: '뭐가 나올지 모르는 재미!' },
  bonus: { combo: '연속 콤보로 점수 폭발!', fever: '피버 타임, 이모지가 쏟아져요.', magnet: '자석으로 이모지 흡수!', multi: '점수 배율로 고득점 노려요.', skip: '기본 모드로 시작!' },
  season: { spring: '벚꽃 날리는 봄, 파종의 계절.', summer: '뜨거운 여름, 작물이 무럭무럭.', autumn: '풍성한 가을, 수확의 기쁨.', winter: '겨울 농장, 도전적이네요.' },
  farmSize: { cozy: '아담한 텃밭, 소확행.', normal: '적당한 크기, 좋은 선택.', large: '넓은 밭, 본격 농부 모드.', ranch: '대형 목장, 야심찬데요?' },
  startDan: { '2': '기초부터 차근차근! 2단 시작.', '5': '5단은 패턴이 명확해서 재밌어요!', '7': '7단은 가장 어렵다는 소문이... 도전!', random: '랜덤으로 골라볼게요!' },
  quizMode: { step: '탐색 → 세기 → 패턴 → 퀴즈, 단계별로.', quiz: '바로 퀴즈! 실력을 시험해봐요.', explore: '3D로 곱셈을 눈으로 보며 이해해요.', speed: '빠르게빠르게! 스피드런 모드!' },
  shape: { sphere: '동글동글 구슬로 세어봐요.', cube: '네모난 큐브 블록! 깔끔하죠?', cylinder: '원기둥으로 색다르게!', skip: '기본 구슬로 갈게요.' },
  simSpeed: { realtime: '실제 시간 흐름 그대로 보여드릴게요.', fast: '빠르게 감아서 변화를 한눈에.', ultra: '시간을 압축해서 보여드릴게요.', cinematic: '영화 같은 연출로 가볼게요.' },
  detail: { minimal: '깔끔하게 핵심만 보여드릴게요.', standard: '적당한 디테일, 좋은 선택이에요.', rich: '풍부한 비주얼, 눈이 즐거울 거예요.', scientific: '과학 데이터 중심으로 세팅할게요.' },
  overlay: { hud: '실시간 데이터를 오버레이 할게요.', labels: '주요 요소에 이름표를 달아줄게요.', trail: '궤적을 따라가는 라인을 그릴게요.', clean: '화면을 깨끗하게. 몰입 모드로.', skip: '기본 세팅 그대로 갈게요.' },
  difficulty: { easy: '좋아요, 편하게 즐기는 걸로.', normal: '적당한 도전. 좋은 선택이에요.', hard: '도전적이네요. 멋져요.', nightmare: '진심이군요. 존경합니다.' },
  style: { neon: '사이버 시티 분위기로 갈게요.', retro: '90년대 감성, 알겠어요.', minimal: '깔끔하게. 좋은 취향이에요.', cyber: '미래 도시 느낌으로 만들어볼게요.' },
  effect: { particle: '화면 가득 파티클을 뿌릴게요.', shake: '타격감 있는 흔들림, 넣을게요.', combo: '연속 히트의 쾌감을 드릴게요.', slowmo: '시간이 느려지는 순간을 만들게요.', skip: '깔끔하게 기본으로 갈게요.' },
};

/* ═══════════════════════════════════════════════
   Types for chat flow
   ═══════════════════════════════════════════════ */
interface ChatItem {
  id: string;
  type: 'ai' | 'user' | 'input' | 'chips' | 'options' | 'progress';
  text?: string;
  options?: ModOption[];
  slotId?: string;
  hasSkip?: boolean;
  visible: boolean;
}

const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/* ═══════════════════════════════════════════════
   Main Component — Apple Intelligence Dark Theme
   ═══════════════════════════════════════════════ */
interface PromptTerminalProps {
  onComplete: (game: DemoGame) => void;
}

export default function PromptTerminal({ onComplete }: PromptTerminalProps) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [typingText, setTypingText] = useState('');
  const [typingId, setTypingId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputTyping, setInputTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [frozen, setFrozen] = useState<Set<string>>(new Set());
  const [progressWidth, setProgressWidth] = useState(0);
  const [showChips, setShowChips] = useState(false);

  const matchRef = useRef<MatchResult | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null!); // eslint-disable-line
  const idCounter = useRef(0);
  const typingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const nid = () => `i-${++idCounter.current}`;

  /* ── Scroll ── */
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
      });
    });
  }, []);

  /* ── Type AI text character by character ── */
  const typeAiText = useCallback((text: string, speed = 55): Promise<string> => {
    return new Promise((resolve) => {
      const id = nid();
      setItems(prev => [...prev, { id, type: 'ai', text: '', visible: true }]);
      setTypingId(id);
      setTypingText('');
      scrollToBottom();

      const chars = Array.from(text);
      let i = 0;
      const iv = setInterval(() => {
        if (i < chars.length) {
          setTypingText(text.slice(0, i + 1));
          i++;
          scrollToBottom();
        } else {
          clearInterval(iv);
          setTypingId(null);
          setTypingText('');
          setItems(prev => prev.map(item => item.id === id ? { ...item, text } : item));
          scrollToBottom();
          resolve(id);
        }
      }, speed);
    });
  }, [scrollToBottom]);

  /* ── Show thinking dots then type ── */
  const aiSpeak = useCallback(async (text: string, pauseBefore = 700, speed = 55): Promise<string> => {
    const thinkId = nid();
    setItems(prev => [...prev, { id: thinkId, type: 'ai', text: '···', visible: true }]);
    scrollToBottom();
    await wait(pauseBefore);
    setItems(prev => prev.filter(item => item.id !== thinkId));
    return typeAiText(text, speed);
  }, [typeAiText, scrollToBottom]);

  /* ── Add widget ── */
  const addWidget = useCallback((type: ChatItem['type'], extra?: Partial<ChatItem>): string => {
    const id = nid();
    setItems(prev => [...prev, { id, type, visible: true, ...extra }]);
    scrollToBottom();
    return id;
  }, [scrollToBottom]);

  /* ── Add user message ── */
  const addUser = useCallback((text: string) => {
    playSelect();
    const id = nid();
    setItems(prev => [...prev, { id, type: 'user', text, visible: true }]);
    scrollToBottom();
    return id;
  }, [scrollToBottom]);

  const fadeOut = useCallback((id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, visible: false } : item));
  }, []);

  const freeze = useCallback((id: string) => {
    setFrozen(prev => new Set(prev).add(id));
  }, []);

  /* ═══════ Main conversation flow ═══════ */
  const gamePromptResolver = useRef<((prompt: string) => void) | null>(null);
  const optionResolver = useRef<((value: string) => void) | null>(null);

  const waitForGamePrompt = (): Promise<string> => new Promise(r => { gamePromptResolver.current = r; });
  const waitForOption = (_slotId: string): Promise<string> => new Promise(r => { optionResolver.current = r; });

  const runFlow = useCallback(async () => {
    await wait(600);
    await aiSpeak('어떤 게임을 상상하고 있나요?', 0, 55);
    await wait(500);
    setShowChips(true);
    addWidget('input');

    const prompt = await waitForGamePrompt();
    setShowChips(false);

    const game = DEMO_GAMES.find(g => g.id === matchRef.current?.gameId);
    const gameName = game?.title || '프로젝트';
    const gameId = matchRef.current?.gameId || '';
    const isSim = gameId === 'moon-orbit';

    await wait(1000);
    await aiSpeak(
      isSim ? `${gameName} 시뮬레이션, 흥미로운 선택이에요.` : `${gameName}, 좋은 선택이에요.`,
      800, 55
    );

    const slots = getModifierSlots(gameId);
    for (let si = 0; si < slots.length; si++) {
      const slot = slots[si];
      await wait(800);
      await aiSpeak(slot.question, 700, 55);
      await wait(400);

      const optId = addWidget('options', {
        options: slot.options,
        slotId: slot.id,
        hasSkip: slot.hasSkip,
      });

      const choice = await waitForOption(slot.id);
      freeze(optId);
      await wait(200);
      fadeOut(optId);
      await wait(200);

      const reaction = AI_REACTIONS[slot.id]?.[choice];
      if (reaction) {
        await wait(800);
        await aiSpeak(reaction, 700, 55);
      }
    }

    await wait(1200);
    await aiSpeak('완벽해요. 지금 바로 만들어볼게요!', 700, 70);
    await wait(400);

    const progId = addWidget('progress');
    playComplete();
    await animateProgress();
    await wait(300);
    playWhoosh();
    if (game) onComplete(game);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Handlers ── */
  const handlePromptSubmit = useCallback((prompt: string) => {
    if (!prompt.trim()) return;
    const result = matchPromptToGame(prompt);
    matchRef.current = result;
    addUser(prompt.trim());
    setInputValue('');
    if (gamePromptResolver.current) {
      gamePromptResolver.current(prompt.trim());
      gamePromptResolver.current = null;
    }
  }, [addUser]);

  const handleOptionSelect = useCallback((slotId: string, opt: ModOption) => {
    playTick();
    if (navigator.vibrate) navigator.vibrate(10);
    addUser(opt.label);
    if (optionResolver.current) {
      optionResolver.current(opt.value);
      optionResolver.current = null;
    }
  }, [addUser]);

  const handleSkip = useCallback((_slotId: string) => {
    playTick();
    addUser('건너뛰기');
    if (optionResolver.current) {
      optionResolver.current('skip');
      optionResolver.current = null;
    }
  }, [addUser]);

  const handleChipClick = useCallback((chip: ChipItem) => {
    if (inputTyping) return;
    setInputTyping(true);
    setInputValue('');
    typingTimers.current.forEach(t => clearTimeout(t));
    typingTimers.current = [];

    const chars = chip.prompt.split('');
    chars.forEach((_, i) => {
      const timer = setTimeout(() => {
        setInputValue(chip.prompt.slice(0, i + 1));
        if (i % 3 === 0) playTick();
      }, i * 28);
      typingTimers.current.push(timer);
    });

    const submitTimer = setTimeout(() => {
      setInputTyping(false);
      handlePromptSubmit(chip.prompt);
    }, chars.length * 28 + 250);
    typingTimers.current.push(submitTimer);
  }, [handlePromptSubmit, inputTyping]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handlePromptSubmit(inputValue);
    }
  }, [inputValue, handlePromptSubmit]);

  const animateProgress = (): Promise<void> => {
    return new Promise(resolve => {
      setProgressWidth(0);
      requestAnimationFrame(() => setProgressWidth(100));
      setTimeout(resolve, 2200);
    });
  };

  useEffect(() => {
    setMounted(true);
    runFlow();
    return () => { typingTimers.current.forEach(t => clearTimeout(t)); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ═══════════════════════════════════════════════
     Render — Apple Intelligence Dark Chat UI
     ═══════════════════════════════════════════════ */
  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #0A0A1A 0%, #111125 40%, #1A1A2E 100%)',
      position: 'relative',
      overflow: 'hidden',
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.8s ease',
    }}>
      {/* ═══ Subtle background glow ═══ */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(0,122,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* ═══ Header — minimal ═══ */}
      <header style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 20px',
        paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Logo circle */}
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #007AFF, #5856D6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,122,255,0.3)',
          }}>
            <span style={{ fontSize: '14px', color: '#fff' }}>✦</span>
          </div>
          <span style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.3px',
          }}>
            Vibe Coding
          </span>
          <span style={{
            fontSize: '10px',
            fontWeight: 500,
            color: 'var(--text-tertiary)',
            padding: '2px 8px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.06)',
            letterSpacing: '0.05em',
          }}>
            BETA
          </span>
        </div>
      </header>

      {/* ═══ Chat area — 80% of screen ═══ */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'relative',
          zIndex: 1,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        <style>{`.chat-scroll::-webkit-scrollbar { display: none; }`}</style>
        <div className="chat-scroll" style={{
          maxWidth: '640px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          paddingTop: '8px',
          paddingBottom: '16px',
        }}>
          {items.map((item) => {
            if (!item.visible && (item.type === 'input' || item.type === 'chips' || item.type === 'options')) {
              return <div key={item.id} style={{ height: 0, overflow: 'hidden', transition: 'height 0.3s' }} />;
            }
            switch (item.type) {
              case 'ai':
                return <AiMessage key={item.id} text={item.id === typingId ? typingText : (item.text || '')} isTyping={item.id === typingId} isThinking={item.text === '···'} />;
              case 'user':
                return <UserMessage key={item.id} text={item.text || ''} />;
              case 'input':
                return null; // Input is rendered at the bottom, not in the chat flow
              case 'options':
                return <OptionsWidget key={item.id} options={item.options || []} slotId={item.slotId || ''} onSelect={handleOptionSelect} onSkip={item.hasSkip ? handleSkip : undefined} disabled={frozen.has(item.id)} />;
              case 'progress':
                return <ProgressBar key={item.id} width={progressWidth} />;
              default:
                return null;
            }
          })}
        </div>
      </div>

      {/* ═══ Bottom section — chips + input ═══ */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        flexShrink: 0,
        background: 'linear-gradient(to top, rgba(10,10,26,0.98) 0%, rgba(10,10,26,0.85) 70%, transparent 100%)',
        paddingTop: '16px',
      }}>
        {/* Horizontal scroll chips */}
        {showChips && (
          <div style={{
            padding: '0 20px 12px',
            maxWidth: '680px',
            margin: '0 auto',
            animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
          }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingBottom: '2px',
              WebkitOverflowScrolling: 'touch',
            }}>
              {CHIPS.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleChipClick(chip)}
                  style={{
                    flexShrink: 0,
                    padding: '8px 16px',
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '-0.2px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0,122,255,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(0,122,255,0.3)';
                    e.currentTarget.style.color = '#F5F5F7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Capsule input bar */}
        <div style={{
          padding: '0 16px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          maxWidth: '680px',
          margin: '0 auto',
          width: '100%',
        }}>
          <InputBar
            value={inputValue}
            onChange={(v) => !inputTyping && setInputValue(v)}
            onSubmit={() => handlePromptSubmit(inputValue)}
            onKeyDown={handleKeyDown}
            readOnly={inputTyping}
            isTyping={inputTyping}
            inputRef={inputRef}
          />
        </div>
      </div>

      {/* ═══ Keyframes ═══ */}
      <style>{`
        @keyframes aiSlideIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes userSlideIn {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes shimmerDark {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Sub-components — Apple Intelligence Dark
   ═══════════════════════════════════════════════ */

function AiMessage({ text, isTyping, isThinking }: { text: string; isTyping: boolean; isThinking: boolean; }) {
  if (isThinking) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'aiSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
        maxWidth: '640px',
      }}>
        <AiAvatar pulse />
        <div style={{ display: 'flex', gap: '5px', padding: '16px 20px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--text-tertiary)',
              animation: `dotPulse 1.4s ease-in-out ${i * 0.16}s infinite`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      animation: 'aiSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
      maxWidth: '640px',
    }}>
      <AiAvatar />
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '4px 20px 20px 20px',
        padding: '14px 18px',
        border: '1px solid rgba(255,255,255,0.08)',
        fontSize: '15px',
        fontWeight: 400,
        color: 'var(--text-primary)',
        lineHeight: 1.7,
        maxWidth: 'calc(100% - 50px)',
        letterSpacing: '-0.3px',
      }}>
        {text}
        {isTyping && (
          <span style={{
            display: 'inline-block',
            width: '2px',
            height: '16px',
            marginLeft: '2px',
            verticalAlign: 'text-bottom',
            borderRadius: '1px',
            background: '#007AFF',
            animation: 'cursorBlink 0.8s ease-in-out infinite',
          }} />
        )}
      </div>
    </div>
  );
}

function AiAvatar({ pulse }: { pulse?: boolean }) {
  return (
    <div style={{
      width: '32px',
      height: '32px',
      borderRadius: '10px',
      background: 'linear-gradient(135deg, #007AFF, #5856D6)',
      flexShrink: 0,
      marginTop: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 10px rgba(0,122,255,0.3)',
      transition: 'box-shadow 0.3s',
      ...(pulse ? { animation: 'dotPulse 2s ease-in-out infinite' } : {}),
    }}>
      <span style={{ fontSize: '15px', color: '#fff' }}>✦</span>
    </div>
  );
}

function UserMessage({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      animation: 'userSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) both',
      maxWidth: '640px',
    }}>
      <div style={{
        background: '#007AFF',
        borderRadius: '20px 4px 20px 20px',
        padding: '12px 18px',
        fontSize: '15px',
        fontWeight: 500,
        color: '#ffffff',
        lineHeight: 1.7,
        maxWidth: '80%',
        letterSpacing: '-0.3px',
        boxShadow: '0 2px 12px rgba(0,122,255,0.3)',
      }}>
        {text}
      </div>
    </div>
  );
}

function InputBar({ value, onChange, onSubmit, onKeyDown, readOnly, isTyping, inputRef }: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  readOnly: boolean;
  isTyping: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: focused ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '26px',
      border: `1.5px solid ${focused ? 'rgba(0,122,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
      padding: '6px 6px 6px 20px',
      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
      boxShadow: focused
        ? '0 0 0 4px rgba(0,122,255,0.08), 0 4px 20px rgba(0,0,0,0.2)'
        : '0 2px 8px rgba(0,0,0,0.15)',
      minHeight: '52px',
    }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="어떤 게임을 상상하고 있나요?"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        readOnly={readOnly}
        autoFocus
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: isTyping ? '#007AFF' : 'var(--text-primary)',
          fontSize: '15px',
          fontWeight: 400,
          lineHeight: '24px',
          padding: '8px 0',
          caretColor: '#007AFF',
          letterSpacing: '-0.3px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Noto Sans KR", system-ui, sans-serif',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {/* Send button — gradient circle */}
      <button
        onClick={onSubmit}
        disabled={!value.trim() || isTyping}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: value.trim() && !isTyping
            ? '#007AFF'
            : 'rgba(255,255,255,0.06)',
          border: 'none',
          color: value.trim() && !isTyping ? '#fff' : 'var(--text-dim)',
          fontSize: '16px',
          cursor: value.trim() && !isTyping ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
          flexShrink: 0,
          boxShadow: value.trim() && !isTyping ? '0 2px 10px rgba(0,122,255,0.35)' : 'none',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3 9L15 9M15 9L10 4M15 9L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ opacity: value.trim() ? 1 : 0.3, transition: 'opacity 0.2s' }} />
        </svg>
      </button>
    </div>
  );
}

function OptionsWidget({ options, slotId, onSelect, onSkip, disabled }: {
  options: ModOption[];
  slotId: string;
  onSelect: (slotId: string, opt: ModOption) => void;
  onSkip?: (slotId: string) => void;
  disabled: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      paddingLeft: '44px',
      animation: 'aiSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
      opacity: disabled ? 0.4 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
      transition: 'opacity 0.3s',
      maxWidth: '640px',
    }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(slotId, opt)}
          style={{
            padding: '10px 16px',
            borderRadius: '16px',
            background: 'rgba(0,122,255,0.08)',
            border: '1px solid rgba(0,122,255,0.2)',
            color: '#5AC8FA',
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '-0.2px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,122,255,0.18)';
            e.currentTarget.style.borderColor = 'rgba(0,122,255,0.4)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,122,255,0.08)';
            e.currentTarget.style.borderColor = 'rgba(0,122,255,0.2)';
            e.currentTarget.style.color = '#5AC8FA';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {opt.label}
        </button>
      ))}
      {onSkip && (
        <button
          onClick={() => onSkip(slotId)}
          style={{
            padding: '10px 16px',
            borderRadius: '16px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-tertiary)',
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '-0.2px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-tertiary)';
          }}
        >
          건너뛰기
        </button>
      )}
    </div>
  );
}

function ProgressBar({ width }: { width: number }) {
  return (
    <div style={{
      maxWidth: '640px',
      paddingLeft: '44px',
      animation: 'aiSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '16px 20px',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#007AFF',
            letterSpacing: '-0.2px',
          }}>
            코드 생성 중...
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--text-tertiary)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {Math.round(width)}%
          </span>
        </div>
        <div style={{
          height: '4px',
          borderRadius: '2px',
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${width}%`,
            borderRadius: '2px',
            background: 'linear-gradient(90deg, #007AFF, #5AC8FA)',
            transition: 'width 2s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: '0 0 10px rgba(0,122,255,0.4)',
          }} />
        </div>
      </div>
    </div>
  );
}
