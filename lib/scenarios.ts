// ═══════════════════════════════════════════
// CLAUDE SIMULATOR — Scenario Data
// 오프라인 시나리오 기반 응답 시스템
// ═══════════════════════════════════════════

export interface ScenarioResponse {
  text: string;
  artifact?: boolean;
  artifactTitle?: string;
  artifactCode?: string;
  artifactPreview?: string;
  /** Full playable HTML for iframe — if present, artifact shows "플레이" tab */
  gameHtml?: string;
  /** Suggestion chips shown after AI response — for game modifications */
  suggestions?: { icon: string; label: string; prompt: string }[];
  /** Terminal-style prompt — student must type this themselves */
  typingPrompt?: string;
}

export interface Scenario {
  id: string;
  title: string;
  icon: string;
  description: string;
  category: 'game' | 'math' | 'science' | 'simulation';
  accentColor: string;
  prompt: string;
  /** If set, the actual game HTML from lib/games/ is loaded at runtime */
  gameId?: string;
  response: (userName: string) => ScenarioResponse;
}

// ── 카테고리 정의 ──
export const CATEGORIES = [
  { id: 'game' as const, label: '🎮 게임', color: '#00CCFF' },
  { id: 'math' as const, label: '📐 수학', color: '#B400FF' },
  { id: 'science' as const, label: '🔬 과학', color: '#34C759' },
  { id: 'simulation' as const, label: '🌍 시뮬레이션', color: '#FF9500' },
] as const;

// ── 시나리오 목록 ──
export const SCENARIOS: Scenario[] = [
  // ═══════════════ 게임 ═══════════════
  {
    id: 'neon-shooter',
    title: '네온 슈터',
    icon: '◆',
    description: '네온 우주 슈팅 게임',
    category: 'game',
    accentColor: '#00FFFF',
    gameId: 'neon-shooter',
    prompt: '우주 슈팅 게임 만들어줘',
    response: (userName) => ({
      text: `${userName}님이 말한 대로 우주 슈팅 게임을 만들게요! 🚀

지금 **물리엔진**을 깔고 있어요 — 총알이 날아가고 적이 부서지는 움직임을 전부 계산해주는 부품이에요.

오래 버틸수록 적이 빨라지고, 가끔 **보스**도 등장해요. 파워업을 먹으면 총알이 세 갈래로!

완성되면 한 판 해보고, 마음에 안 드는 건 말로 바꿔보세요 👉`,
      artifact: true,
      artifactTitle: 'neon_shooter.js',
      artifactCode: `// 🚀 네온 슈터 — Phaser 3 Arcade Physics
// AI가 생성한 우주 슈팅 게임

class ShooterScene extends Phaser.Scene {
    constructor() {
        super('ShooterScene');
        this.score = 0;
        this.level = 1;
    }

    preload() {
        // 프로시저럴 스프라이트 생성
        this.createShipGraphics();
    }

    create() {
        // 배경 별 파티클
        this.stars = this.add.particles(0, 0, 'star', {
            x: { min: 0, max: 800 },
            y: -10,
            speedY: { min: 50, max: 150 },
            scale: { min: 0.1, max: 0.4 },
            lifespan: 8000
        });

        // 플레이어 우주선
        this.player = this.physics.add.sprite(400, 550, 'ship');
        this.player.setCollideWorldBounds(true);

        // 입력 처리
        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey('SPACE');

        // 적 그룹
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();

        // 충돌 감지
        this.physics.add.overlap(
            this.bullets, this.enemies,
            this.hitEnemy, null, this
        );

        // 적 스폰 타이머
        this.time.addEvent({
            delay: 1000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // 점수 표시
        this.scoreText = this.add.text(16, 16,
            'SCORE: 0', {
                fontSize: '18px',
                fill: '#0ff',
                fontFamily: 'monospace'
            }
        );
    }

    update() {
        // 이동
        if (this.cursors.left.isDown)
            this.player.setVelocityX(-300);
        else if (this.cursors.right.isDown)
            this.player.setVelocityX(300);
        else
            this.player.setVelocityX(0);

        // 발사
        if (Phaser.Input.Keyboard.JustDown(this.fireKey)) {
            this.fireBullet();
        }
    }

    fireBullet() {
        const bullet = this.bullets.create(
            this.player.x, this.player.y - 20, 'bullet'
        );
        bullet.setVelocityY(-500);
    }

    spawnEnemy() {
        const x = Phaser.Math.Between(50, 750);
        const enemy = this.enemies.create(x, -30, 'enemy');
        enemy.setVelocityY(Phaser.Math.Between(80, 200));
    }

    hitEnemy(bullet, enemy) {
        bullet.destroy();
        enemy.destroy();
        this.score += 100;
        this.scoreText.setText('SCORE: ' + this.score);
    }
}`,
      artifactPreview: `<h1>🚀 네온 슈터</h1>
<p>Phaser 3 Arcade Physics 기반 수직 스크롤 우주 슈팅 게임입니다.</p>
<p><strong>조작법:</strong></p>
<p>• ← → 방향키: 좌우 이동<br>• 스페이스바: 레이저 발사</p>
<p style="background:#3d3d3d;padding:16px;border-radius:8px;font-family:monospace;font-size:13px;line-height:1.8;color:#0ff">
SCORE: 2400 &nbsp; LEVEL: 3<br><br>
&nbsp;&nbsp;&nbsp;&nbsp;👾 &nbsp;&nbsp; 👾<br>
&nbsp;&nbsp;👾 &nbsp;&nbsp;&nbsp; 👾 &nbsp;&nbsp; 👾<br><br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp; |<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 🚀<br>
</p>`,
    }),
  },
  {
    id: 'temple-runner',
    title: '3D 러너',
    icon: '▸▸',
    description: '3D 무한 러너 게임',
    category: 'game',
    accentColor: '#00CCFF',
    gameId: 'temple-runner',
    prompt: '3D 러너 게임 만들어줘',
    response: (userName) => ({
      text: `달리는 3D 게임이요? 좋아요, 바로 만들게요! 🏃

이번엔 **3D 그래픽**을 써요 — 평평한 화면 속에 진짜 공간이 있는 것처럼 보이게 하는 기술이에요. 신전 속을 끝없이 달리며 장애물을 피하고 코인을 모으면 돼요.

달릴수록 점점 빨라지는 게 포인트예요. 어디까지 버틸 수 있을까요?

완성되면 방향키(태블릿은 스와이프)로 움직여보세요 👉`,
      artifact: true,
      artifactTitle: 'temple_runner.js',
      artifactCode: `// 🏃 3D 템플 러너 — Three.js WebGL
// 1인칭 무한 러너 게임

import * as THREE from 'three';

class TempleRunner {
    constructor() {
        this.score = 0;
        this.speed = 5;
        this.lane = 0; // -1, 0, 1
        this.init();
    }

    init() {
        // 씬 설정
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000011, 10, 50);

        // 카메라 (1인칭)
        this.camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight
        );
        this.camera.position.set(0, 2, 0);

        // 렌더러
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // 바닥
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 1000),
            new THREE.MeshStandardMaterial({ color: 0x333355 })
        );
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);

        // 조명
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 10, 5);
        this.scene.add(light);

        // 장애물 풀
        this.obstacles = [];
        for (let i = 0; i < 20; i++) {
            this.spawnObstacle(i * 10 + 20);
        }

        // 입력
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && this.lane > -1) this.lane--;
            if (e.key === 'ArrowRight' && this.lane < 1) this.lane++;
        });

        this.animate();
    }

    spawnObstacle(z) {
        const lane = Math.floor(Math.random() * 3) - 1;
        const obstacle = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 1.5, 0.8),
            new THREE.MeshStandardMaterial({ color: 0xff4444 })
        );
        obstacle.position.set(lane, 0.75, -z);
        this.scene.add(obstacle);
        this.obstacles.push(obstacle);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // 카메라 이동 (달리기 효과)
        this.camera.position.x += (this.lane - this.camera.position.x) * 0.1;

        // 장애물 이동
        for (const obs of this.obstacles) {
            obs.position.z += this.speed * 0.016;
            if (obs.position.z > 5) {
                obs.position.z -= 200;
                this.score += 10;
            }
        }

        this.speed += 0.001; // 가속
        this.renderer.render(this.scene, this.camera);
    }
}`,
      artifactPreview: `<h1>🏃 3D 템플 러너</h1>
<p>Three.js WebGL 기반 1인칭 무한 러너 게임입니다.</p>
<p><strong>조작법:</strong> ← → 방향키로 레인 변경</p>`,
    }),
  },
  {
    id: 'tetris',
    title: '테트리스',
    icon: '⊞',
    description: '클래식 테트리스 퍼즐',
    category: 'game',
    accentColor: '#B400FF',
    gameId: 'tetris',
    prompt: '테트리스 게임 만들어줘',
    response: (userName) => ({
      text: `클래식 중의 클래식, 테트리스를 만들게요! 🧩

비밀 하나 알려줄까요? 테트리스 블록은 모두 **네모 4개**로 이루어져 있어요. 그래서 이름도 '테트라(4)'에서 왔답니다.

줄을 가득 채우면 사라지면서 점수가 올라가고, 여러 줄을 한꺼번에 지우면 보너스! 레벨이 오를수록 빨라져요.

너무 빠르다 싶으면 "속도 느리게 해줘"라고 말해보세요 👉`,
      artifact: true,
      artifactTitle: 'tetris.js',
      artifactCode: `// 🧩 테트리스 — Canvas 2D
// 클래식 10x20 테트리스 게임

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

// 테트로미노 정의
const SHAPES = {
    I: [[1,1,1,1]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1]],
    S: [[0,1,1],[1,1,0]],
    Z: [[1,1,0],[0,1,1]],
    J: [[1,0,0],[1,1,1]],
    L: [[0,0,1],[1,1,1]]
};

const COLORS = {
    I: '#00f0f0', O: '#f0f000',
    T: '#a000f0', S: '#00f000',
    Z: '#f00000', J: '#0000f0',
    L: '#f0a000'
};

class Tetris {
    constructor(canvas) {
        this.ctx = canvas.getContext('2d');
        this.board = Array(ROWS).fill(null)
            .map(() => Array(COLS).fill(0));
        this.score = 0;
        this.level = 1;
        this.spawn();
        this.loop();
    }

    spawn() {
        const types = Object.keys(SHAPES);
        const type = types[Math.floor(Math.random() * types.length)];
        this.current = {
            shape: SHAPES[type],
            color: COLORS[type],
            x: 3, y: 0
        };
    }

    rotate() {
        const shape = this.current.shape;
        const rotated = shape[0].map((_, i) =>
            shape.map(row => row[i]).reverse()
        );
        this.current.shape = rotated;
    }

    move(dx) {
        this.current.x += dx;
        if (this.collides()) this.current.x -= dx;
    }

    drop() {
        this.current.y++;
        if (this.collides()) {
            this.current.y--;
            this.lock();
            this.clearLines();
            this.spawn();
        }
    }

    collides() {
        for (let y = 0; y < this.current.shape.length; y++) {
            for (let x = 0; x < this.current.shape[y].length; x++) {
                if (!this.current.shape[y][x]) continue;
                const bx = this.current.x + x;
                const by = this.current.y + y;
                if (bx < 0 || bx >= COLS || by >= ROWS) return true;
                if (by >= 0 && this.board[by][bx]) return true;
            }
        }
        return false;
    }

    lock() {
        for (let y = 0; y < this.current.shape.length; y++) {
            for (let x = 0; x < this.current.shape[y].length; x++) {
                if (!this.current.shape[y][x]) continue;
                this.board[this.current.y + y][this.current.x + x] =
                    this.current.color;
            }
        }
    }

    clearLines() {
        let cleared = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(COLS).fill(0));
                cleared++;
                y++;
            }
        }
        this.score += [0, 100, 300, 500, 800][cleared];
    }

    draw() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK);

        // 보드
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.board[y][x]) {
                    this.ctx.fillStyle = this.board[y][x];
                    this.ctx.fillRect(
                        x * BLOCK + 1, y * BLOCK + 1,
                        BLOCK - 2, BLOCK - 2
                    );
                }
            }
        }

        // 현재 블록
        if (this.current) {
            this.ctx.fillStyle = this.current.color;
            for (let y = 0; y < this.current.shape.length; y++) {
                for (let x = 0; x < this.current.shape[y].length; x++) {
                    if (this.current.shape[y][x]) {
                        this.ctx.fillRect(
                            (this.current.x + x) * BLOCK + 1,
                            (this.current.y + y) * BLOCK + 1,
                            BLOCK - 2, BLOCK - 2
                        );
                    }
                }
            }
        }
    }
}`,
      artifactPreview: `<h1>🧩 테트리스</h1>
<p>클래식 10×20 테트리스 게임입니다.</p>
<p><strong>조작법:</strong> ← → 이동, ↑ 회전, ↓ 빠르게 내리기</p>`,
    }),
  },
  {
    id: 'cat-jump',
    title: '고양이 점프',
    icon: '🐱',
    description: '귀여운 무한 점프 게임',
    category: 'game',
    accentColor: '#ff8844',
    gameId: 'cat-jump',
    prompt: '고양이 점프 게임 만들어줘',
    response: (userName) => ({
      text: `귀여운 거 좋아하는군요! 고양이 점프 게임을 만들게요 🐱

고양이가 발판을 밟고 폴짝폴짝 끝없이 올라가는 게임이에요. 발판 중에는 움직이는 것도, 밟으면 사라지는 것도 숨어 있어요!

높이 올라갈수록 발판 사이가 넓어져요. 하트를 모으면서 최고 기록에 도전해보세요.

점프가 모자라다 싶으면 "점프력 높여줘"라고 해보세요 👉`,
      artifact: true,
      artifactTitle: 'cat_jump.js',
      artifactCode: `// 🐱 고양이 점프 — Canvas 2D
// 무한 점프 플랫포머 게임

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const cat = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    vy: 0,
    width: 30,
    height: 30,
    jumping: false
};

const GRAVITY = 0.4;
const JUMP_FORCE = -12;
let platforms = [];
let score = 0;
let cameraY = 0;

// 플랫폼 초기화
function initPlatforms() {
    platforms = [];
    for (let i = 0; i < 8; i++) {
        platforms.push({
            x: Math.random() * (canvas.width - 80),
            y: canvas.height - i * 80 - 50,
            width: 80,
            type: Math.random() > 0.7 ? 'moving' : 'normal',
            dx: Math.random() > 0.5 ? 2 : -2
        });
    }
}

function update() {
    // 중력
    cat.vy += GRAVITY;
    cat.y += cat.vy;

    // 플랫폼 충돌
    for (const p of platforms) {
        if (cat.vy > 0 &&
            cat.x + cat.width > p.x &&
            cat.x < p.x + p.width &&
            cat.y + cat.height > p.y &&
            cat.y + cat.height < p.y + 15) {
            cat.vy = JUMP_FORCE;
            score += 10;
        }

        // 움직이는 플랫폼
        if (p.type === 'moving') {
            p.x += p.dx;
            if (p.x <= 0 || p.x + p.width >= canvas.width) {
                p.dx *= -1;
            }
        }
    }

    // 카메라 추적
    if (cat.y < canvas.height / 2) {
        const dy = canvas.height / 2 - cat.y;
        cat.y = canvas.height / 2;
        cameraY += dy;
        for (const p of platforms) {
            p.y += dy;
        }
    }

    // 새 플랫폼 생성
    while (platforms[platforms.length - 1].y > -20) {
        platforms.push({
            x: Math.random() * (canvas.width - 80),
            y: platforms[platforms.length - 1].y - 80,
            width: 80,
            type: Math.random() > 0.7 ? 'moving' : 'normal',
            dx: Math.random() > 0.5 ? 2 : -2
        });
    }
}

function draw() {
    ctx.fillStyle = '#1a1a3e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 플랫폼
    for (const p of platforms) {
        ctx.fillStyle = p.type === 'moving' ? '#ffaa44' : '#44cc88';
        ctx.fillRect(p.x, p.y, p.width, 12);
    }

    // 고양이
    ctx.font = '28px serif';
    ctx.fillText('🐱', cat.x, cat.y + cat.height);

    // 점수
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.fillText('Score: ' + score, 10, 30);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

initPlatforms();
gameLoop();`,
      artifactPreview: `<h1>🐱 고양이 점프</h1>
<p>귀여운 고양이가 끝없이 점프하는 게임입니다.</p>
<p><strong>조작법:</strong> ← → 방향키로 이동, 자동 점프</p>`,
    }),
  },
  {
    id: 'neon-platformer',
    title: '네온 러너',
    icon: '◈',
    description: '네온 물리 플랫포머',
    category: 'game',
    accentColor: '#FF00FF',
    gameId: 'neon-platformer',
    prompt: '네온 플랫포머 게임 만들어줘',
    response: (userName) => ({
      text: `네온 불빛 속을 달리는 플랫포머를 만들게요! ◈

이 게임의 무기는 **더블점프**와 **벽타기**예요 — 공중에서 한 번 더 뛰고, 벽에 붙어 미끄러지면서 더 높은 곳으로 갈 수 있어요.

그리고 맵은 매번 조금씩 달라요. 컴퓨터가 그때그때 새로 짜기 때문이죠!

너무 어려우면 비밀 치트, "무적 모드 켜줘"도 있어요 👉`,
      artifact: true,
      artifactTitle: 'neon_platformer.js',
      artifactCode: `// ◈ 네온 러너 — Phaser 3 Physics
// 더블점프 + 벽타기 플랫포머

class PlatformerScene extends Phaser.Scene {
    create() {
        this.player = this.physics.add.sprite(100, 400, 'player');
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(true);

        this.jumpCount = 0;
        this.maxJumps = 2; // 더블점프

        // 프로시저럴 맵 생성
        this.platforms = this.physics.add.staticGroup();
        this.generateLevel();

        this.physics.add.collider(this.player, this.platforms);
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    generateLevel() {
        // 바닥
        this.platforms.create(400, 580, 'ground');

        // 랜덤 플랫폼
        for (let i = 0; i < 12; i++) {
            const x = Phaser.Math.Between(50, 750);
            const y = 500 - i * 45;
            this.platforms.create(x, y, 'platform');
        }
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-200);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }

        // 더블점프
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            if (this.player.body.touching.down) {
                this.jumpCount = 0;
            }
            if (this.jumpCount < this.maxJumps) {
                this.player.setVelocityY(-400);
                this.jumpCount++;
            }
        }

        if (this.player.body.touching.down) {
            this.jumpCount = 0;
        }
    }
}`,
      artifactPreview: `<h1>◈ 네온 러너</h1>
<p>더블점프와 벽타기가 가능한 네온 플랫포머입니다.</p>`,
    }),
  },
  {
    id: 'dot-rpg',
    title: '도트 RPG',
    icon: '⚔',
    description: '픽셀 도트 RPG 마을',
    category: 'game',
    accentColor: '#FFD700',
    gameId: 'dot-rpg',
    prompt: '도트 RPG 게임 만들어줘',
    response: (userName) => ({
      text: `오, 모험을 떠나고 싶군요! ${userName}님의 도트 RPG를 만들게요 ⚔

옛날 게임처럼 **픽셀**(작은 네모 점)로 그린 마을이에요. 주민에게 말을 걸면 대화가 열리고, 몬스터를 만나면 차례를 주고받는 전투가 벌어져요.

이기면 경험치를 얻고 레벨업! 공격력과 체력이 쑥쑥 자라요.

전투가 버거우면 "공격력 올려줘"라고 외쳐보세요 👉`,
      artifact: true,
      artifactTitle: 'dot_rpg.js',
      artifactCode: `// ⚔ 도트 RPG — 픽셀아트 RPG 마을
// NPC 대화 + 턴제 전투 + 레벨업

const TILE_SIZE = 32;

const player = {
    x: 5, y: 5,
    hp: 100, maxHp: 100,
    atk: 15, def: 8,
    level: 1, exp: 0,
    sprite: '🧙'
};

// 맵 데이터 (0=풀, 1=벽, 2=NPC, 3=적)
const MAP = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,2,0,0,0,3,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,3,0,0,0,2,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,3,1],
    [1,1,1,1,1,1,1,1,1,1]
];

const NPCS = [
    { x: 3, y: 2, sprite: '👵', dialog: "용사님, 이 마을을 지켜주세요!" },
    { x: 6, y: 6, sprite: '🧝', dialog: "동쪽 숲에 몬스터가 있어요." }
];

function movePlayer(dx, dy) {
    const nx = player.x + dx;
    const ny = player.y + dy;

    if (MAP[ny]?.[nx] === 0) {
        player.x = nx;
        player.y = ny;
    } else if (MAP[ny]?.[nx] === 2) {
        // NPC 대화
        const npc = NPCS.find(n => n.x === nx && n.y === ny);
        if (npc) showDialog(npc.dialog);
    } else if (MAP[ny]?.[nx] === 3) {
        // 전투 시작
        startBattle();
    }
}

function startBattle() {
    const enemy = {
        name: '슬라임', sprite: '🟢',
        hp: 30, atk: 8, def: 3,
        exp: 20
    };
    // 턴제 전투 로직...
    console.log("⚔ 전투 시작: " + enemy.name);
}`,
      artifactPreview: `<h1>⚔ 도트 RPG</h1>
<p>픽셀아트 스타일의 RPG 마을 탐험 게임입니다.</p>
<p>NPC와 대화하고, 몬스터와 전투하세요!</p>`,
    }),
  },
  {
    id: 'emoji-catch',
    title: '이모지 캐치',
    icon: '🍔',
    description: '떨어지는 이모지 모으기',
    category: 'game',
    accentColor: '#FF6B35',
    gameId: 'emoji-catch',
    prompt: '이모지 캐치 게임 만들어줘',
    response: (userName) => ({
      text: `맛있는 게임을 만들게요! 이모지 캐치 🍔

하늘에서 햄버거, 피자, 도넛이 비처럼 쏟아져요. 바구니를 움직여 받으면 점수!

그런데 떨어지는 속도가 제각각이라, 어떤 걸 먼저 노릴지 눈이 바빠질 거예요.

더 정신없게 만들고 싶으면 "음식 많이 나오게 해줘"! 👉`,
      artifact: true,
      artifactTitle: 'emoji_catch.js',
      artifactCode: `// 🍔 이모지 캐치 — Canvas 2D
// 떨어지는 이모지를 받는 게임

const emojis = ['🍔','🍕','🌮','🍩','🍦','🎂','🍎','⭐'];
let score = 0;
let basket = { x: 200, width: 60 };
let items = [];

function spawnItem() {
    items.push({
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: Math.random() * 380 + 10,
        y: -20,
        speed: 2 + Math.random() * 3
    });
}

function update() {
    for (let i = items.length - 1; i >= 0; i--) {
        items[i].y += items[i].speed;

        // 바구니에 닿으면 점수
        if (items[i].y > 560 &&
            Math.abs(items[i].x - basket.x) < basket.width / 2) {
            score += 10;
            items.splice(i, 1);
        }
        // 바닥에 떨어지면 제거
        else if (items[i].y > 600) {
            items.splice(i, 1);
        }
    }
}

setInterval(spawnItem, 800);`,
      artifactPreview: `<h1>🍔 이모지 캐치</h1>
<p>떨어지는 이모지를 바구니로 받는 게임입니다.</p>`,
    }),
  },
  {
    id: 'balloon-pop',
    title: '풍선 팝',
    icon: '🎈',
    description: '60초 풍선 터뜨리기',
    category: 'game',
    accentColor: '#ff6b8a',
    gameId: 'balloon-pop',
    prompt: '풍선 터뜨리기 게임 만들어줘',
    response: (userName) => ({
      text: `풍선 팡팡! 60초 타임어택 게임을 만들게요 🎈

알록달록 풍선이 떠오르면 터뜨려서 점수를 모으세요. 쉬지 않고 연달아 터뜨리면 **콤보**가 쌓여서 점수가 훨씬 커져요!

60초는 생각보다 짧아요. 손이 바빠질 준비 됐나요?

시간이 아쉬우면 "시간 늘려줘"라고 해보세요 👉`,
      artifact: true,
      artifactTitle: 'balloon_pop.js',
      artifactCode: `// 🎈 풍선 팝 — Canvas 2D
// 60초 타임어택 풍선 터뜨리기

let score = 0;
let combo = 0;
let timeLeft = 60;
let balloons = [];

const COLORS = ['#ff6b8a','#4ecdc4','#ffe66d','#a8e6cf','#ff8b94'];

function spawnBalloon() {
    balloons.push({
        x: Math.random() * 380 + 10,
        y: 620,
        radius: 20 + Math.random() * 15,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        speed: 1 + Math.random() * 2,
        popped: false
    });
}

function popBalloon(x, y) {
    for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        const dist = Math.sqrt((x - b.x) ** 2 + (y - b.y) ** 2);
        if (dist < b.radius && !b.popped) {
            b.popped = true;
            combo++;
            score += 10 * combo; // 콤보 보너스!
            setTimeout(() => {
                balloons.splice(balloons.indexOf(b), 1);
            }, 200);
            return;
        }
    }
    combo = 0; // 빗나가면 콤보 리셋
}

setInterval(spawnBalloon, 500);
setInterval(() => { timeLeft--; }, 1000);`,
      artifactPreview: `<h1>🎈 풍선 팝</h1>
<p>60초 안에 풍선을 최대한 많이 터뜨리세요!</p>
<p>연속으로 터뜨리면 콤보 보너스!</p>`,
    }),
  },
  {
    id: 'star-catch',
    title: '별 모으기',
    icon: '⭐',
    description: '밤하늘 별 수집 게임',
    category: 'game',
    accentColor: '#ffd700',
    gameId: 'star-catch',
    prompt: '별 모으기 게임 만들어줘',
    response: (userName) => ({
      text: `밤하늘 게임이라니, 낭만적인데요! 별 모으기를 만들게요 ⭐

구름을 움직여 떨어지는 별을 받으면 점수가 올라가요. 그런데 조심하세요 — 가끔 **번개**가 섞여서 떨어져요!

별만 골라 받는 순발력이 핵심이에요.

별이 너무 빠르면 "속도 느리게 해줘"라고 말해보세요 👉`,
      artifact: true,
      artifactTitle: 'star_catch.js',
      artifactCode: `// ⭐ 별 모으기 — Canvas 2D
// 구름이 별을 받는 캐치 게임

let score = 0;
let cloud = { x: 200, y: 550, width: 60 };
let stars = [];
let lightning = [];

function spawnStar() {
    if (Math.random() > 0.15) {
        stars.push({
            x: Math.random() * 380 + 10,
            y: -20,
            type: 'star',
            speed: 2 + Math.random() * 2
        });
    } else {
        // 번개 (피해야 함!)
        stars.push({
            x: Math.random() * 380 + 10,
            y: -20,
            type: 'lightning',
            speed: 3 + Math.random() * 2
        });
    }
}

function update() {
    for (let i = stars.length - 1; i >= 0; i--) {
        stars[i].y += stars[i].speed;

        if (stars[i].y > cloud.y &&
            Math.abs(stars[i].x - cloud.x) < cloud.width / 2) {
            if (stars[i].type === 'star') {
                score += 10;
            } else {
                score -= 30; // 번개 맞으면 감점!
            }
            stars.splice(i, 1);
        }
    }
}

setInterval(spawnStar, 600);`,
      artifactPreview: `<h1>⭐ 별 모으기</h1>
<p>밤하늘에서 떨어지는 별을 구름으로 받으세요!</p>
<p>⚡ 번개는 피해야 합니다!</p>`,
    }),
  },

  // ═══════════════ 수학 ═══════════════
  {
    id: 'gugudan-code',
    title: '구구단 코딩',
    icon: '🔢',
    description: '파이썬 구구단 프로그램',
    category: 'math',
    accentColor: '#007AFF',
    prompt: '파이썬으로 구구단 프로그램 만들어줘',
    response: () => ({
      text: `구구단 프로그램을 만들게요! 이번엔 **파이썬**을 써요 — 전 세계 프로그래머들이 가장 사랑하는 언어 중 하나예요.

핵심은 딱 두 가지예요. "1부터 9까지 반복해!"(for문), 그리고 "곱한 걸 보여줘!"(print). 컴퓨터는 반복을 시켜도 절대 지치지 않거든요.

오른쪽 코드에서 **for**라는 단어를 찾아보세요 — 그게 반복의 마법이에요 👉`,
      artifact: true,
      artifactTitle: 'gugudan.py',
      artifactCode: `# 🔢 구구단 프로그램
# AI가 만든 파이썬 코드

def gugudan(dan):
    """입력받은 단의 구구단을 출력합니다"""
    print(f"\\n══ {dan}단 ══")
    for i in range(1, 10):
        result = dan * i
        print(f"  {dan} × {i} = {result}")

def main():
    print("🎮 구구단 프로그램에 오신 걸 환영합니다!")
    print("─" * 30)

    while True:
        user_input = input("\\n몇 단을 볼까요? (종료: q) > ")

        if user_input.lower() == 'q':
            print("\\n👋 다음에 또 만나요!")
            break

        try:
            dan = int(user_input)
            if 1 <= dan <= 99:
                gugudan(dan)
            else:
                print("⚠️ 1부터 99 사이 숫자를 입력해주세요!")
        except ValueError:
            print("⚠️ 숫자를 입력해주세요!")

# 프로그램 실행
if __name__ == "__main__":
    main()`,
      artifactPreview: `<h1>🔢 구구단 프로그램</h1>
<p>이 프로그램은 원하는 단의 구구단을 보여줍니다.</p>
<p style="background:#3d3d3d;padding:16px;border-radius:8px;font-family:monospace;font-size:13px;line-height:1.8">
🎮 구구단 프로그램에 오신 걸 환영합니다!<br>──────────────────────<br><br>몇 단을 볼까요? (종료: q) > <span style="color:#6bbd7b">5</span><br><br>══ 5단 ══<br>&nbsp;&nbsp;5 × 1 = 5<br>&nbsp;&nbsp;5 × 2 = 10<br>&nbsp;&nbsp;5 × 3 = 15<br>&nbsp;&nbsp;5 × 4 = 20<br>&nbsp;&nbsp;5 × 5 = 25</p>`,
    }),
  },
  {
    id: 'equation',
    title: '방정식 풀이',
    icon: '📊',
    description: '이차방정식 풀이 과정',
    category: 'math',
    accentColor: '#5856D6',
    prompt: '이차방정식 x²-5x+6=0 풀어줘',
    response: (userName) => ({
      text: `${userName}님, 이차방정식을 풀어볼게요!

**문제:** x² - 5x + 6 = 0

**풀이 과정:**

1. 이 식을 **인수분해**할 수 있어요
2. 곱해서 6이 되고, 더해서 -5가 되는 두 수를 찾으면...
3. **-2**와 **-3**이에요! (-2 × -3 = 6, -2 + (-3) = -5)

따라서:
x² - 5x + 6 = (x - 2)(x - 3) = 0

**답: x = 2 또는 x = 3** ✅

검증해볼까요?
• x = 2일 때: 4 - 10 + 6 = **0** ✓
• x = 3일 때: 9 - 15 + 6 = **0** ✓`,
    }),
  },
  {
    id: 'gugudan-3d',
    title: '3D 구구단',
    icon: '🧊',
    description: '3D 구구단 학습 게임',
    category: 'math',
    accentColor: '#007AFF',
    gameId: 'gugudan-3d',
    prompt: '3D 구구단 학습 게임 만들어줘',
    response: (userName) => ({
      text: `구구단을 게임으로 배워볼까요? 3D 구구단을 만들게요! 🧊

3D 공간에 큐브들이 떠 있어요. 2×3이면 큐브가 2줄로 3개씩 — **곱셈이 눈에 보이는** 거예요!

탐색 → 세기 → 패턴 → 퀴즈, 4단계로 점점 깊어져요. 퀴즈까지 통과하면 진짜 구구단 마스터!

다른 단이 궁금하면 "다른 단 보여줘"라고 하세요 👉`,
      artifact: true,
      artifactTitle: 'gugudan_3d.js',
      artifactCode: `// 🧊 3D 구구단 — Three.js WebGL
// 탐색 + 세기 + 패턴 + 퀴즈 4단계

import * as THREE from 'three';

class GugudanGame {
    constructor() {
        this.stage = 1; // 4단계
        this.currentDan = 2;
        this.score = 0;
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a3e);

        this.camera = new THREE.PerspectiveCamera(60,
            window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // 3D 블록으로 구구단 시각화
        this.createBlocks();
        this.animate();
    }

    createBlocks() {
        // 현재 단의 곱셈을 3D 블록으로 표현
        for (let i = 1; i <= 9; i++) {
            const result = this.currentDan * i;
            const group = new THREE.Group();

            // result 개의 작은 큐브 배치
            for (let j = 0; j < result; j++) {
                const cube = new THREE.Mesh(
                    new THREE.BoxGeometry(0.3, 0.3, 0.3),
                    new THREE.MeshStandardMaterial({
                        color: new THREE.Color().setHSL(i / 10, 0.7, 0.6)
                    })
                );
                cube.position.set(
                    (j % this.currentDan) * 0.4,
                    Math.floor(j / this.currentDan) * 0.4,
                    0
                );
                group.add(cube);
            }

            group.position.x = (i - 5) * 2;
            this.scene.add(group);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}`,
      artifactPreview: `<h1>🧊 3D 구구단 학습</h1>
<p>3D 블록으로 곱셈을 시각적으로 이해하는 학습 게임입니다.</p>
<p>4단계: 탐색 → 세기 → 패턴 → 퀴즈</p>`,
    }),
  },

  // ═══════════════ 과학 ═══════════════
  {
    id: 'ai-explain',
    title: 'AI란 뭐야?',
    icon: '🤖',
    description: 'AI 개념을 쉽게 설명',
    category: 'science',
    accentColor: '#e07a5f',
    prompt: 'AI가 뭐야? 쉽게 설명해줘',
    response: (userName) => ({
      text: `좋은 질문이에요! 😊

**AI(인공지능)**란 컴퓨터가 사람처럼 생각하고, 배우고, 판단할 수 있게 만든 기술이에요.

우리 주변에서 AI는 이미 많이 쓰이고 있어요:

• **음성 비서** — "시리야", "오케이 구글" 할 때 대답해주는 것
• **추천 시스템** — 유튜브가 "너 이 영상 좋아할 걸?" 하고 추천해주는 것
• **번역** — 한국어를 영어로 바꿔주는 것
• **지금 이 대화** — 제가 ${userName}님의 질문을 이해하고 대답하는 것도 AI!

저(Claude)는 **대규모 언어 모델(LLM)**이라는 AI예요. 엄청나게 많은 글을 읽고 학습해서, 사람과 자연스럽게 대화할 수 있게 된 거죠.

더 궁금한 점 있으면 편하게 물어보세요!`,
    }),
  },
  {
    id: 'moon-orbit',
    title: '달의 공전',
    icon: '🌙',
    description: '3D 달 궤도 시뮬레이션',
    category: 'science',
    accentColor: '#4488ff',
    gameId: 'moon-orbit',
    prompt: '달의 공전 시뮬레이션 만들어줘',
    response: (userName) => ({
      text: `달 시뮬레이션, 멋진 선택이에요! 🌙

진짜 달처럼 **타원 궤도**로 지구를 도는 3D 우주를 만들고 있어요. 달이 우리에게 늘 같은 면만 보여주는 비밀(조석 고정)까지 그대로 담았어요.

천천히 돌려보면서 보름달이 되는 순간을 찾아보세요.

더 가까이 보고 싶으면 "줌인 해줘"! 👉`,
      artifact: true,
      artifactTitle: 'moon_orbit.js',
      artifactCode: `// 🌙 달의 공전 — Three.js WebGL
// 타원 궤도 + 조석 고정 + 월령 표시

import * as THREE from 'three';

class MoonOrbitSim {
    constructor() {
        this.time = 0;
        this.orbitalPeriod = 27.3; // 일
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);

        this.camera = new THREE.PerspectiveCamera(60,
            window.innerWidth / window.innerHeight);
        this.camera.position.set(0, 15, 20);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        // 지구
        const earthGeo = new THREE.SphereGeometry(3, 32, 32);
        const earthMat = new THREE.MeshStandardMaterial({ color: 0x2266aa });
        this.earth = new THREE.Mesh(earthGeo, earthMat);
        this.scene.add(this.earth);

        // 달
        const moonGeo = new THREE.SphereGeometry(0.8, 16, 16);
        const moonMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        this.moon = new THREE.Mesh(moonGeo, moonMat);
        this.scene.add(this.moon);

        // 궤도 선
        const orbitCurve = new THREE.EllipseCurve(0, 0, 10, 9.5);
        const orbitPoints = orbitCurve.getPoints(64);
        const orbitGeo = new THREE.BufferGeometry().setFromPoints(
            orbitPoints.map(p => new THREE.Vector3(p.x, 0, p.y))
        );
        this.scene.add(new THREE.Line(orbitGeo,
            new THREE.LineBasicMaterial({ color: 0x333366 })));

        // 태양광
        const sun = new THREE.DirectionalLight(0xffffff, 1.5);
        sun.position.set(50, 10, 0);
        this.scene.add(sun);
        this.scene.add(new THREE.AmbientLight(0x111122));

        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.time += 0.005;

        // 타원 궤도
        const a = 10, b = 9.5;
        this.moon.position.x = a * Math.cos(this.time);
        this.moon.position.z = b * Math.sin(this.time);

        // 조석 고정 (항상 같은 면이 지구를 향함)
        this.moon.lookAt(this.earth.position);

        this.renderer.render(this.scene, this.camera);
    }
}`,
      artifactPreview: `<h1>🌙 달의 공전</h1>
<p>Three.js 3D 달 궤도 시뮬레이션입니다.</p>
<p>타원 궤도, 조석 고정, 월령 변화를 관찰할 수 있어요.</p>`,
    }),
  },
  {
    id: 'english-intro',
    title: '영어 자기소개',
    icon: '🌍',
    description: '영어 자기소개 작성',
    category: 'science',
    accentColor: '#34C759',
    prompt: '영어로 자기소개 작성해줘',
    response: (userName) => ({
      text: `영어 자기소개를 만들어볼게요! 😊

**기본 자기소개:**

Hello! My name is **${userName}**.
I am a student from Korea.
I like learning new things and having fun with technology.
It's nice to meet you!

**유용한 표현들:**
• "Nice to meet you" — 만나서 반가워요
• "I'm interested in..." — ~에 관심이 있어요
• "My hobby is..." — 제 취미는...
• "I want to learn..." — ~을 배우고 싶어요

자기소개를 수정하고 싶으면 말해주세요!`,
    }),
  },
  {
    id: 'space-story',
    title: '우주 고양이',
    icon: '✨',
    description: 'AI가 만드는 우주 동화',
    category: 'science',
    accentColor: '#AF52DE',
    prompt: '우주를 여행하는 고양이 이야기 만들어줘',
    response: () => ({
      text: `이야기를 하나 지어봤어요 — 별을 먹는 고양이 '나비' 이야기예요 ✨

오른쪽에서 천천히 읽어보세요. 다 읽고 나면, 그 다음 장면을 상상해서 이어 써보는 것도 재미있을 거예요!`,
      artifact: true,
      artifactTitle: '우주 고양이 이야기',
      artifactCode: `# 🐱🚀 별을 먹는 고양이, 나비

# ───────────────────────────
# 작성: Claude AI
# 장르: 판타지 동화
# ───────────────────────────

옛날 옛날, 바닷가 작은 마을에
'나비'라는 고양이가 살았어요.

나비는 매일 밤 지붕 위에 올라가
별을 바라보며 생각했어요.

"저 반짝이는 것들은 뭘까?
혹시... 맛있을까?"

어느 날 밤, 유난히 밝은 별똥별 하나가
나비의 코앞에 떨어졌어요.

나비가 조심스럽게 코를 갖다 대자...

  ✦ 슈우우우웅! ✦

나비의 몸이 둥둥 떠오르더니
순식간에 우주로 날아올랐어요!

달은 치즈로 만들어져 있었고,
화성에서는 로봇 친구를 만났어요.
토성의 고리에서는 미끄럼도 탔죠!

집으로 돌아온 나비는 말했답니다:

  "우주는 넓고,
   참치캔은 위대하다." 🐟

───── 끝 ─────`,
      artifactPreview: `<h1>🐱🚀 별을 먹는 고양이, 나비</h1>
<p>옛날 옛날, 바닷가 작은 마을에 '나비'라는 고양이가 살았어요.</p>
<p>별똥별을 만나 우주 여행을 떠난 나비는 달, 화성, 토성을 방문하고 돌아왔답니다.</p>
<p><em>"우주는 넓고, 참치캔은 위대하다." 🐟</em></p>`,
    }),
  },

  // ═══════════════ 시뮬레이션 ═══════════════
  {
    id: 'farm-garden',
    title: '마음의 텃밭',
    icon: '🌿',
    description: '3D 힐링 농장 시뮬레이션',
    category: 'simulation',
    accentColor: '#66BB6A',
    gameId: 'farm-garden',
    prompt: '힐링 농장 시뮬레이션 만들어줘',
    response: (userName) => ({
      text: `${userName}님만의 텃밭을 가꿔볼까요? 🌿

3D 농장에 씨앗을 심고, 물을 주고, 무럭무럭 자라는 걸 지켜보는 힐링 게임이에요. 작물마다 자라는 속도가 달라서 기다리는 재미가 있어요.

다 자란 작물을 수확하면 골드가 모이고, 그걸로 더 좋은 씨앗을 살 수 있죠.

비가 오면 물 주기가 편해져요 — "비 오게 해줘"라고 말해보세요 👉`,
      artifact: true,
      artifactTitle: 'farm_garden.js',
      artifactCode: `// 🌿 마음의 텃밭 — Three.js WebGL
// 힐링 농장 시뮬레이션

import * as THREE from 'three';

class FarmGarden {
    constructor() {
        this.time = 0;
        this.weather = 'clear';
        this.crops = [];
        this.gold = 100;
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);

        this.camera = new THREE.PerspectiveCamera(50,
            window.innerWidth / window.innerHeight);
        this.camera.position.set(0, 8, 12);
        this.camera.lookAt(0, 0, 0);

        // 땅
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);

        // 밭 (3x3 그리드)
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                const plot = new THREE.Mesh(
                    new THREE.PlaneGeometry(2.5, 2.5),
                    new THREE.MeshStandardMaterial({ color: 0x654321 })
                );
                plot.rotation.x = -Math.PI / 2;
                plot.position.set(x * 3, 0.01, z * 3);
                this.scene.add(plot);
            }
        }

        // 태양
        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(5, 10, 5);
        this.scene.add(sun);
        this.scene.add(new THREE.AmbientLight(0x444444));

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.animate();
    }

    plantCrop(x, z, type) {
        const crop = {
            x, z, type,
            growth: 0,
            watered: false,
            mesh: null
        };

        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.5),
            new THREE.MeshStandardMaterial({ color: 0x228B22 })
        );
        stem.position.set(x * 3, 0.25, z * 3);
        this.scene.add(stem);
        crop.mesh = stem;

        this.crops.push(crop);
    }

    water(x, z) {
        const crop = this.crops.find(c => c.x === x && c.z === z);
        if (crop) {
            crop.watered = true;
            crop.growth += 0.2;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.time += 0.01;

        // 낮밤 사이클
        const dayPhase = (Math.sin(this.time * 0.5) + 1) / 2;
        this.scene.background.setHSL(0.55, 0.6, 0.3 + dayPhase * 0.5);

        // 작물 성장
        for (const crop of this.crops) {
            if (crop.growth < 1 && crop.watered) {
                crop.growth += 0.001;
                const scale = 0.5 + crop.growth * 1.5;
                crop.mesh.scale.set(1, scale, 1);
                crop.mesh.position.y = scale * 0.25;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}`,
      artifactPreview: `<h1>🌿 마음의 텃밭</h1>
<p>3D 힐링 농장에서 작물을 심고 키워보세요.</p>
<p>물주기, 날씨 변화, 낮밤 사이클이 있어요.</p>`,
    }),
  },
  {
    id: 'wave-sim',
    title: '파도 시뮬레이션',
    icon: '🌊',
    description: '물리 기반 파도 시뮬',
    category: 'simulation',
    accentColor: '#0A84FF',
    prompt: '파도 시뮬레이션 만들어줘',
    response: (userName) => ({
      text: `파도를 만들게요! 🌊

바다의 파도는 사실 **사인파**라는 부드러운 수학 곡선 여러 개가 겹쳐진 거예요. 곡선이 겹치고 겹치면 진짜 바다처럼 출렁이게 되죠.

코드 속 숫자(높이·속도)를 바꾸면 잔잔한 호수도, 폭풍의 바다도 만들 수 있어요.

수학이 움직이는 모습, 직접 관찰해보세요 👉`,
      artifact: true,
      artifactTitle: 'wave_sim.js',
      artifactCode: `// 🌊 파도 시뮬레이션 — Canvas 2D
// 사인파 기반 물리 파도

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let time = 0;

function drawWave() {
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 여러 겹의 파도
    const layers = [
        { amp: 30, freq: 0.02, speed: 0.03, color: 'rgba(0,100,200,0.3)', y: 300 },
        { amp: 20, freq: 0.03, speed: 0.05, color: 'rgba(0,150,255,0.4)', y: 320 },
        { amp: 15, freq: 0.04, speed: 0.07, color: 'rgba(50,180,255,0.5)', y: 340 },
        { amp: 10, freq: 0.05, speed: 0.09, color: 'rgba(100,200,255,0.6)', y: 360 }
    ];

    for (const layer of layers) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);

        for (let x = 0; x <= canvas.width; x++) {
            const y = layer.y +
                layer.amp * Math.sin(x * layer.freq + time * layer.speed) +
                layer.amp * 0.5 * Math.sin(x * layer.freq * 2.3 + time * layer.speed * 1.5);
            ctx.lineTo(x, y);
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fillStyle = layer.color;
        ctx.fill();
    }

    time++;
    requestAnimationFrame(drawWave);
}

drawWave();`,
      artifactPreview: `<h1>🌊 파도 시뮬레이션</h1>
<p>사인파 기반의 물리 파도 시뮬레이션입니다.</p>
<p>여러 겹의 파도가 겹쳐 자연스러운 바다를 표현해요.</p>`,
    }),
  },
  {
    id: 'ecosystem',
    title: '생태계',
    icon: '🦊',
    description: '포식자-피식자 시뮬',
    category: 'simulation',
    accentColor: '#FF6B35',
    prompt: '생태계 시뮬레이션 만들어줘',
    response: (userName) => ({
      text: `자연의 균형을 실험해볼까요? 생태계 시뮬레이션이에요 🦊

여우(포식자)와 토끼(피식자)를 풀어놓으면 신기한 일이 벌어져요 — 토끼가 늘면 여우도 늘고, 여우가 너무 많아지면 토끼가 줄고… 자연은 시소처럼 끊임없이 **균형**을 찾아가요.

만약 여우가 전부 사라지면 토끼는 마냥 행복할까요? 직접 확인해보세요 👉`,
      artifact: true,
      artifactTitle: 'ecosystem.js',
      artifactCode: `// 🦊 생태계 시뮬레이션 — Canvas 2D
// 포식자-피식자 Lotka-Volterra 모델

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

class Creature {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'prey' or 'predator'
        this.energy = type === 'predator' ? 100 : 50;
        this.speed = type === 'predator' ? 2 : 1.5;
    }

    move() {
        this.x += (Math.random() - 0.5) * this.speed * 2;
        this.y += (Math.random() - 0.5) * this.speed * 2;
        this.x = Math.max(0, Math.min(canvas.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height, this.y));
        this.energy -= this.type === 'predator' ? 0.5 : 0.1;
    }

    draw() {
        ctx.font = '16px serif';
        ctx.fillText(
            this.type === 'prey' ? '🐰' : '🦊',
            this.x - 8, this.y + 8
        );
    }
}

let creatures = [];

// 초기 개체군
for (let i = 0; i < 30; i++) {
    creatures.push(new Creature(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        'prey'
    ));
}
for (let i = 0; i < 5; i++) {
    creatures.push(new Creature(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        'predator'
    ));
}

function simulate() {
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 풀 배경
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = 'rgba(0,100,0,0.3)';
        ctx.fillRect(
            Math.random() * canvas.width,
            Math.random() * canvas.height, 3, 8
        );
    }

    // 포식 & 번식
    for (const c of creatures) {
        c.move();
        c.draw();

        if (c.type === 'predator') {
            // 가까운 먹이 찾기
            for (let i = creatures.length - 1; i >= 0; i--) {
                const prey = creatures[i];
                if (prey.type === 'prey') {
                    const dist = Math.hypot(c.x - prey.x, c.y - prey.y);
                    if (dist < 15) {
                        creatures.splice(i, 1);
                        c.energy += 30;
                    }
                }
            }
        }

        // 번식
        if (c.energy > (c.type === 'predator' ? 150 : 80)) {
            creatures.push(new Creature(c.x, c.y, c.type));
            c.energy /= 2;
        }
    }

    // 에너지 소진 제거
    creatures = creatures.filter(c => c.energy > 0);

    // 피식자 자연 번식
    if (Math.random() < 0.05 && creatures.filter(c => c.type === 'prey').length < 50) {
        creatures.push(new Creature(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            'prey'
        ));
    }

    // 개체수 표시
    const prey = creatures.filter(c => c.type === 'prey').length;
    const pred = creatures.filter(c => c.type === 'predator').length;
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText('🐰 ' + prey + '  🦊 ' + pred, 10, 25);

    requestAnimationFrame(simulate);
}

simulate();`,
      artifactPreview: `<h1>🦊 생태계 시뮬레이션</h1>
<p>포식자(🦊)와 피식자(🐰)의 관계를 시뮬레이션합니다.</p>
<p>Lotka-Volterra 모델 기반의 개체군 역학을 관찰하세요.</p>`,
    }),
  },
  {
    id: 'weather-sim',
    title: '날씨 시뮬레이션',
    icon: '🌤',
    description: '날씨 변화 시뮬레이션',
    category: 'simulation',
    accentColor: '#5AC8FA',
    prompt: '날씨 시뮬레이션 만들어줘',
    response: (userName) => ({
      text: `날씨를 직접 만들어보는 기분, 어때요? 🌤

**기압·온도·습도** — 이 세 가지 숫자가 만나서 오늘의 날씨가 정해져요. 기압이 낮아지고 습도가 올라가면? 비구름이 모여들죠.

숫자를 조금씩 바꾸면서 맑음이 비로 변하는 순간을 찾아보세요. 기상청이 하는 일을 미니 버전으로 체험하는 거예요 👉`,
      artifact: true,
      artifactTitle: 'weather_sim.js',
      artifactCode: `// 🌤 날씨 시뮬레이션 — Canvas 2D
// 기압/온도/습도 기반 날씨 변화

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let weather = {
    temperature: 22,
    humidity: 50,
    pressure: 1013,
    wind: 5,
    condition: 'clear' // clear, cloudy, rain, storm
};

let particles = []; // 비/눈 파티클

function updateWeather() {
    // 자연 변동
    weather.temperature += (Math.random() - 0.5) * 0.5;
    weather.humidity += (Math.random() - 0.5) * 2;
    weather.pressure += (Math.random() - 0.5) * 0.5;

    weather.humidity = Math.max(0, Math.min(100, weather.humidity));
    weather.temperature = Math.max(-10, Math.min(40, weather.temperature));

    // 날씨 판정
    if (weather.humidity > 80 && weather.pressure < 1010) {
        weather.condition = 'rain';
    } else if (weather.humidity > 60) {
        weather.condition = 'cloudy';
    } else {
        weather.condition = 'clear';
    }

    if (weather.condition === 'rain' && weather.wind > 15) {
        weather.condition = 'storm';
    }
}

function drawSky() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (weather.condition === 'clear') {
        gradient.addColorStop(0, '#4488cc');
        gradient.addColorStop(1, '#88ccee');
    } else if (weather.condition === 'cloudy') {
        gradient.addColorStop(0, '#667788');
        gradient.addColorStop(1, '#8899aa');
    } else {
        gradient.addColorStop(0, '#334455');
        gradient.addColorStop(1, '#556677');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawRain() {
    if (weather.condition !== 'rain' && weather.condition !== 'storm') return;

    for (let i = 0; i < 5; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: -10,
            speed: 5 + Math.random() * 5
        });
    }

    ctx.strokeStyle = 'rgba(150,200,255,0.5)';
    ctx.lineWidth = 1;
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 1, p.y + 10);
        ctx.stroke();
        p.y += p.speed;
        if (p.y > canvas.height) particles.splice(i, 1);
    }
}

setInterval(updateWeather, 1000);`,
      artifactPreview: `<h1>🌤 날씨 시뮬레이션</h1>
<p>기압, 온도, 습도에 따라 날씨가 변화하는 시뮬레이션입니다.</p>
<p>맑음 → 흐림 → 비 → 폭풍 변화를 관찰하세요.</p>`,
    }),
  },
];

// ── 제안 칩 (하위 호환) ──
export const SUGGESTION_CHIPS = [
  { icon: '🤖', label: 'AI가 뭐야?', prompt: 'AI가 뭐야? 쉽게 설명해줘' },
  { icon: '💻', label: '코딩 체험', prompt: '파이썬으로 구구단 프로그램 만들어줘' },
  { icon: '✨', label: '이야기 만들기', prompt: '우주를 여행하는 고양이 이야기 만들어줘' },
  { icon: '📐', label: '수학 풀기', prompt: '이차방정식 x²-5x+6=0 풀어줘' },
  { icon: '🌍', label: '영어 도우미', prompt: '영어로 자기소개 작성해줘' },
] as const;

export const HINT_CHIPS = [
  { icon: '🤖', label: 'AI 설명', prompt: 'AI가 뭐야? 쉽게 설명해줘' },
  { icon: '💻', label: '코딩', prompt: '파이썬으로 구구단 프로그램 만들어줘' },
  { icon: '✨', label: '이야기', prompt: '우주를 여행하는 고양이 이야기 만들어줘' },
  { icon: '📐', label: '수학', prompt: '이차방정식 x²-5x+6=0 풀어줘' },
] as const;

// ── 시나리오 매칭 함수 ──
export function findResponse(text: string, userName: string): ScenarioResponse {
  const t = text.toLowerCase();

  // 시나리오 ID로 직접 매칭 (카드 클릭 시)
  const directMatch = SCENARIOS.find((s) => s.prompt === text);
  if (directMatch) return directMatch.response(userName);

  // 키워드 매칭
  const keywordMap: [string[], string][] = [
    [['ai', '인공지능', '뭐야'], 'ai-explain'],
    [['코드', '파이썬', '프로그램', '구구단', '코딩'], 'gugudan-code'],
    [['동화', '이야기', '고양이', '우주'], 'space-story'],
    [['수학', '방정식', '풀어'], 'equation'],
    [['영어', '자기소개', 'english'], 'english-intro'],
    [['슈팅', '슈터', '총'], 'neon-shooter'],
    [['러너', '달리기', '3d'], 'temple-runner'],
    [['테트리스', '블록', '퍼즐'], 'tetris'],
    [['고양이', '점프', '캣'], 'cat-jump'],
    [['풍선', '팝', '터뜨'], 'balloon-pop'],
    [['별', '모으기', '캐치'], 'star-catch'],
    [['달', '공전', '궤도', '천문'], 'moon-orbit'],
    [['농장', '텃밭', '힐링', '재배'], 'farm-garden'],
    [['파도', '물결', '바다'], 'wave-sim'],
    [['생태계', '포식', '동물'], 'ecosystem'],
    [['날씨', '기상', '비', '구름'], 'weather-sim'],
  ];

  for (const [keywords, id] of keywordMap) {
    if (keywords.some((kw) => t.includes(kw))) {
      const scenario = SCENARIOS.find((s) => s.id === id);
      if (scenario) return scenario.response(userName);
    }
  }

  return getDefaultResponse(userName);
}

function getDefaultResponse(userName: string): ScenarioResponse {
  return {
    text: `${userName}님, 좋아요 — 뭐든 말해보세요! 😊

이런 문장이면 바로 만들어드릴 수 있어요:

• 🎮 "우주 슈팅 게임 만들어줘" / "테트리스 만들어줘"
• 📐 "구구단 게임 만들어줘"
• 🔬 "달 시뮬레이션 보여줘"
• 🌍 "농장 게임 만들어줘"

게임 목록으로 돌아가려면 "다른 게임 보여줘"라고 하면 돼요!`,
  };
}

// ── 마크다운 포매팅 ──
export function formatMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n• /g, '<br>• ')
    .replace(/\n(\d+)\. /g, '<br>$1. ')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

// ── HTML 이스케이프 ──
export function escapeHtml(t: string): string {
  if (!t) return '';
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── 신택스 하이라이팅 (파이썬/JS) ──
export function syntaxHighlight(line: string): string {
  const escaped = esc(line);

  const commentIdx = findCommentStart(escaped);
  let codePart = commentIdx >= 0 ? escaped.substring(0, commentIdx) : escaped;
  const commentPart =
    commentIdx >= 0
      ? '<span class="syn-comment">' + escaped.substring(commentIdx) + '</span>'
      : '';

  const strings: string[] = [];
  codePart = codePart.replace(
    /("|')((?:(?!\1).)*)\1/g,
    (_match, q, content) => {
      const idx = strings.length;
      strings.push('<span class="syn-string">' + q + content + q + '</span>');
      return '\x00S' + idx + '\x00';
    }
  );

  codePart = codePart.replace(
    /\b(def|if|else|elif|while|for|return|import|from|try|except|print|input|break|continue|True|False|None|and|or|not|in|is|with|as|lambda|yield|class|const|let|var|function|new|this|async|await|export|default|extends|super|typeof|instanceof|null|undefined|true|false|constructor)\b/g,
    '<span class="syn-keyword">$1</span>'
  );

  codePart = codePart.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span class="syn-number">$1</span>'
  );

  codePart = codePart.replace(/\x00S(\d+)\x00/g, (_m, idx) => strings[Number(idx)]);

  return codePart + commentPart;
}

function esc(t: string): string {
  if (!t) return '';
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function findCommentStart(line: string): number {
  let inString: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inString) {
      if (ch === inString) inString = null;
    } else {
      if (ch === '"' || ch === "'") inString = ch;
      else if (ch === '#' || (ch === '/' && line[i + 1] === '/')) return i;
    }
  }
  return -1;
}

// ── 로그 시스템 ──
export interface LogEntry {
  timestamp: string;
  user: string;
  type: 'system' | 'user' | 'ai';
  content: string;
}

export function createLogEntry(
  userName: string,
  type: LogEntry['type'],
  content: string
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    user: userName,
    type,
    content,
  };
}
