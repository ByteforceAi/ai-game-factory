// ═══════════════════════════════════════════
// Game HTML Loader
// Lazy-loads actual game HTML from lib/games/
// ═══════════════════════════════════════════

import { EMOJI_BURGER_HTML } from './demoGames';
import { NEON_SHOOTER_HTML } from './games/neonShooter';
import { NEON_PLATFORMER_HTML } from './games/neonPlatformer';
import { TEMPLE_RUNNER_HTML } from './games/templeRunner';
import { TETRIS_HTML } from './games/tetris';
import { DOT_RPG_HTML } from './games/dotRpg';
import { CAT_JUMP_HTML } from './games/catJump';
import { BALLOON_POP_HTML } from './games/balloonPop';
import { STAR_CATCH_HTML } from './games/starCatch';
import { MOON_ORBIT_HTML } from './games/moonOrbit';
import { FARM_GARDEN_HTML } from './games/farmGarden';
import { GUGUDAN_HTML } from './games/gugudan';

const GAME_MAP: Record<string, string> = {
  'neon-shooter': NEON_SHOOTER_HTML,
  'neon-platformer': NEON_PLATFORMER_HTML,
  'temple-runner': TEMPLE_RUNNER_HTML,
  'tetris': TETRIS_HTML,
  'dot-rpg': DOT_RPG_HTML,
  'cat-jump': CAT_JUMP_HTML,
  'emoji-catch': EMOJI_BURGER_HTML,
  'balloon-pop': BALLOON_POP_HTML,
  'star-catch': STAR_CATCH_HTML,
  'moon-orbit': MOON_ORBIT_HTML,
  'farm-garden': FARM_GARDEN_HTML,
  'gugudan-3d': GUGUDAN_HTML,
};

export function getGameHtml(gameId: string): string | undefined {
  return GAME_MAP[gameId];
}
