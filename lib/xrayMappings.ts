/**
 * Code X-Ray — Keyword-to-Target Mapping
 *
 * When a student hovers over a code line, we scan for keywords
 * and determine which game element to highlight.
 *
 * This is GENERIC — works for all games without per-game config.
 * The gameExtensions.ts handler inside the iframe knows how to
 * visualize each target type.
 */

export interface XRayTarget {
  target: string;  // matches zone keys in gameExtensions.ts
  label: string;   // tooltip shown to student
}

// Keyword groups → target mapping
// Order matters: first match wins (more specific first)
const KEYWORD_MAP: [string[], XRayTarget][] = [
  // Player / Character
  [
    ['player', 'hero', 'ship', 'cat', 'character', 'runner', 'farmer', 'wizard'],
    { target: 'player', label: '🚀 이 코드는 플레이어를 제어해요' },
  ],
  // Score / Points
  [
    ['score', 'point', 'combo', 'scoreText', 'displayScore'],
    { target: 'score', label: '🏆 이 코드는 점수를 계산해요' },
  ],
  // Lives / Health
  [
    ['lives', 'life', 'hp', 'health', 'heart', 'damage'],
    { target: 'lives', label: '❤️ 이 코드는 체력/목숨을 관리해요' },
  ],
  // Enemies / Obstacles
  [
    ['enemy', 'enemies', 'obstacle', 'block', 'boss', 'monster', 'hazard'],
    { target: 'enemies', label: '👾 이 코드는 적/장애물을 제어해요' },
  ],
  // Speed / Velocity
  [
    ['speed', 'velocity', 'vx', 'vy', 'dx', 'dy', 'moveSpeed', 'runSpeed'],
    { target: 'speed', label: '⚡ 이 코드는 이동 속도를 설정해요' },
  ],
  // Gravity / Physics
  [
    ['gravity', 'gy', 'fall', 'jump', 'jumpForce', 'bounce'],
    { target: 'gravity', label: '⬇️ 이 코드는 물리(중력/점프)를 제어해요' },
  ],
  // Collision
  [
    ['collision', 'collide', 'hitbox', 'intersect', 'overlap', 'checkHit'],
    { target: 'collision', label: '💥 이 코드는 충돌 판정을 해요' },
  ],
  // Input / Controls
  [
    ['keydown', 'keyup', 'keyboard', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'input', 'touch'],
    { target: 'input', label: '🎮 이 코드는 키보드/터치 입력을 처리해요' },
  ],
  // Rendering / Drawing
  [
    ['fillRect', 'drawImage', 'strokeRect', 'clearRect', 'fillText', 'render', 'draw', 'paint', 'ctx.'],
    { target: 'render', label: '🎨 이 코드는 화면에 그림을 그려요' },
  ],
  // Timer / Clock
  [
    ['timer', 'countdown', 'setTimeout', 'setInterval', 'requestAnimationFrame', 'gameLoop', 'loop'],
    { target: 'timer', label: '⏱️ 이 코드는 타이머/게임 루프예요' },
  ],
  // Spawning
  [
    ['spawn', 'create', 'generate', 'push', 'addEnemy', 'newPiece', 'addBalloon'],
    { target: 'spawn', label: '✨ 이 코드는 새 오브젝트를 생성해요' },
  ],
  // Grid / Board
  [
    ['grid', 'board', 'cell', 'tile', 'matrix', 'row', 'col'],
    { target: 'grid', label: '🧱 이 코드는 그리드/보드를 관리해요' },
  ],
  // Particles / Effects
  [
    ['particle', 'effect', 'explosion', 'confetti', 'sparkle', 'flash', 'glow'],
    { target: 'particles', label: '✨ 이 코드는 시각 효과를 만들어요' },
  ],
  // UI / HUD
  [
    ['hud', 'ui', 'display', 'label', 'text', 'font', 'fillText'],
    { target: 'ui', label: '📊 이 코드는 UI/점수판을 표시해요' },
  ],
  // Background / Scene
  [
    ['background', 'bg', 'sky', 'scene', 'canvas.width', 'canvas.height'],
    { target: 'background', label: '🖼️ 이 코드는 배경/화면을 설정해요' },
  ],
];

/**
 * Scan a code line for keywords and return the matching X-Ray target.
 * Returns null if no match found (line is not interesting enough to highlight).
 */
export function matchXRayTarget(codeLine: string): XRayTarget | null {
  const lower = codeLine.toLowerCase();

  // Skip empty lines, comments-only, closing braces
  const trimmed = lower.trim();
  if (!trimmed || trimmed === '}' || trimmed === '{' || trimmed.startsWith('//')) {
    return null;
  }

  for (const [keywords, target] of KEYWORD_MAP) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return target;
      }
    }
  }

  return null;
}
