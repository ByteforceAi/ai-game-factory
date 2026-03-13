const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, '..', 'lib', 'games');
const outFile = path.join(__dirname, '..', 'lib', 'demoGames.ts');

function escapeTemplateLiteral(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

const burger = fs.readFileSync(path.join(gamesDir, 'emoji-burger.html'), 'utf8');
const runner = fs.readFileSync(path.join(gamesDir, 'temple-runner.html'), 'utf8');
const tetris = fs.readFileSync(path.join(gamesDir, 'tetris.html'), 'utf8');

const output = `export interface DemoGame {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: string;
  accentColor: string;
  html: string;
}

const EMOJI_BURGER_HTML = \`${escapeTemplateLiteral(burger)}\`;

const TEMPLE_RUNNER_HTML = \`${escapeTemplateLiteral(runner)}\`;

const TETRIS_HTML = \`${escapeTemplateLiteral(tetris)}\`;

export const DEMO_GAMES: DemoGame[] = [
  {
    id: 'emoji-burger',
    title: '이모지 햄버거 먹기',
    description: '하늘에서 떨어지는 음식을 잡아라! 독은 피하고 🍔',
    prompt: '이모지로 만든 캐주얼 음식 잡기 게임. 터치/마우스로 좌우 이동, 음식 이모지를 잡으면 점수, 독을 피하면서 3목숨을 지켜라!',
    icon: '🍔',
    accentColor: '#FF8C00',
    html: EMOJI_BURGER_HTML,
  },
  {
    id: 'temple-runner',
    title: '템플 러너',
    description: '3D 끝없는 러너! 장애물을 피하고 코인을 모아라 🏃',
    prompt: 'Three.js 3D 1인칭 끝없는 러너. 3레인 좌우 이동, 점프, 장애물 회피, 코인 수집. 속도 점진적 증가.',
    icon: '🏃',
    accentColor: '#00CCFF',
    html: TEMPLE_RUNNER_HTML,
  },
  {
    id: 'tetris',
    title: '테트리스',
    description: '클래식 테트리스! 줄을 완성하고 높은 점수를 노려라 🧱',
    prompt: '클래식 10x20 테트리스. 7종 테트로미노, 줄 클리어, 레벨 시스템, 네온 비주얼. 모바일 터치 버튼 포함.',
    icon: '🧱',
    accentColor: '#B400FF',
    html: TETRIS_HTML,
  },
];
`;

fs.writeFileSync(outFile, output, 'utf8');
console.log('Generated demoGames.ts:', output.length, 'bytes');
console.log('Burger HTML length:', burger.length);
console.log('Runner HTML length:', runner.length);
console.log('Tetris HTML length:', tetris.length);
