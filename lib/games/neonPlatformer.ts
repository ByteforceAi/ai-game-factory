export const NEON_PLATFORMER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>Neon Runner</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#0a0a1a;touch-action:none;user-select:none;-webkit-user-select:none}
canvas{display:block}
#loading{position:fixed;top:0;left:0;width:100%;height:100%;background:#0a0a1a;display:flex;align-items:center;justify-content:center;z-index:999;font-family:'Courier New',monospace;color:#00ffff;font-size:24px;letter-spacing:4px}
#loading span{animation:pulse 1s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
</style>
</head>
<body>
<div id="loading"><span>LOADING...</span></div>
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"><\/script>
<script>
'use strict';
(function(){

const W = window.innerWidth;
const H = window.innerHeight;
const GRAVITY = 720;
const PLAYER_SPEED = 260;
const JUMP_VEL = -420;
const DOUBLE_JUMP_VEL = -380;
const WALL_SLIDE_VEL = 80;
const WALL_JUMP_VEL_X = 320;
const WALL_JUMP_VEL_Y = -400;
const COYOTE_TIME = 100;
const JUMP_BUFFER = 120;
const PLATFORM_SCROLL_SPEED = 160;
const ORB_SCORE = 10;

// Color palette
const C = {
  bg: 0x0a0a1a,
  player: 0x00ffff,
  playerTrail: 0x0088aa,
  platformStart: 0xaa00ff,
  platformEnd: 0xff0066,
  orb: 0xffff00,
  orbGlow: 0xffcc00,
  spike: 0xff2244,
  grid: 0x1a1a3a,
  particle1: 0x00ffff,
  particle2: 0xff00ff,
  particle3: 0xffff00,
  deathParticle: 0xff0044,
  speedLine: 0x00ffff,
};

class BootScene extends Phaser.Scene {
  constructor(){ super('Boot'); }

  preload(){
    // Generate all textures procedurally
    const g = this.make.graphics({add:false});

    // Player 24x32
    g.clear();
    g.fillStyle(C.player, 1);
    g.fillRect(0, 0, 24, 32);
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(4, 4, 6, 6);
    g.fillRect(14, 4, 6, 6);
    g.fillStyle(0x00dddd, 0.4);
    g.fillRect(2, 16, 20, 2);
    g.generateTexture('player', 24, 32);

    // Trail segment
    g.clear();
    g.fillStyle(C.playerTrail, 0.5);
    g.fillRect(0, 0, 24, 32);
    g.generateTexture('trail', 24, 32);

    // Platform tile 64x16
    g.clear();
    g.fillStyle(C.platformStart, 1);
    g.fillRect(0, 0, 64, 16);
    g.fillStyle(0xffffff, 0.15);
    g.fillRect(0, 0, 64, 2);
    g.fillStyle(0x000000, 0.3);
    g.fillRect(0, 14, 64, 2);
    g.generateTexture('platform', 64, 16);

    // Moving platform (brighter)
    g.clear();
    g.fillStyle(0xff00ff, 1);
    g.fillRect(0, 0, 64, 16);
    g.fillStyle(0xffffff, 0.25);
    g.fillRect(0, 0, 64, 3);
    g.fillStyle(0x000000, 0.3);
    g.fillRect(0, 13, 64, 3);
    g.generateTexture('movingPlatform', 64, 16);

    // Orb 16x16
    g.clear();
    g.fillStyle(C.orb, 1);
    g.fillCircle(8, 8, 7);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(6, 6, 3);
    g.generateTexture('orb', 16, 16);

    // Spike 16x16
    g.clear();
    g.fillStyle(C.spike, 1);
    g.fillTriangle(8, 0, 0, 16, 16, 16);
    g.generateTexture('spike', 16, 16);

    // Particle 6x6
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 6, 6);
    g.generateTexture('particle', 6, 6);

    // Small particle 3x3
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 3, 3);
    g.generateTexture('smallParticle', 3, 3);

    g.destroy();
  }

  create(){
    document.getElementById('loading').style.display = 'none';
    this.scene.start('Game');
  }
}

class GameScene extends Phaser.Scene {
  constructor(){ super('Game'); }

  create(){
    this.cameras.main.setBackgroundColor(C.bg);

    // State
    this.score = 0;
    this.distance = 0;
    this.orbsCollected = 0;
    this.alive = true;
    this.gameStarted = false;
    this.scrollSpeed = PLATFORM_SCROLL_SPEED;
    this.difficultyMult = 1;
    this.lastPlatformX = W;
    this.lastPlatformY = H * 0.65;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.isDoubleJumpAvailable = true;
    this.isOnWall = false;
    this.wallSide = 0; // -1 left, 1 right
    this.jumpHeld = false;
    this.jumpCount = 0;
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJump = false;
    this.trailPositions = [];
    this.speedLinePool = [];
    this.deathTriggered = false;

    // Grid background (scrolling)
    this.gridGraphics = this.add.graphics();
    this.gridOffset = 0;

    // Groups with object pooling
    this.platforms = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group({ allowGravity: false, immovable: true });
    this.orbs = this.physics.add.group({ allowGravity: false });
    this.spikes = this.physics.add.group({ allowGravity: false });

    // Trail container
    this.trailContainer = this.add.container(0, 0);

    // Player
    this.player = this.physics.add.sprite(W * 0.25, H * 0.5, 'player');
    this.player.setCollideWorldBounds(false);
    this.player.body.setGravityY(GRAVITY);
    this.player.body.setMaxVelocityY(600);
    this.player.body.setSize(20, 30);
    this.player.body.setOffset(2, 2);
    this.player.setDepth(10);

    // Particle emitter for jump
    this.jumpEmitter = this.add.particles(0, 0, 'particle', {
      speed: { min: 80, max: 200 },
      angle: { min: 60, max: 120 },
      scale: { start: 1, end: 0 },
      lifespan: 400,
      tint: [C.particle1, C.particle2],
      emitting: false,
      quantity: 8,
    });
    this.jumpEmitter.setDepth(9);

    // Landing particles
    this.landEmitter = this.add.particles(0, 0, 'smallParticle', {
      speed: { min: 40, max: 120 },
      angle: { min: -150, max: -30 },
      scale: { start: 1, end: 0 },
      lifespan: 300,
      tint: [C.particle1, 0xffffff],
      emitting: false,
      quantity: 6,
    });
    this.landEmitter.setDepth(9);

    // Death particles
    this.deathEmitter = this.add.particles(0, 0, 'particle', {
      speed: { min: 100, max: 400 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      lifespan: 800,
      tint: [C.deathParticle, C.particle2, C.player, 0xffffff],
      emitting: false,
      quantity: 30,
    });
    this.deathEmitter.setDepth(20);

    // Speed lines container
    this.speedLinesGfx = this.add.graphics();
    this.speedLinesGfx.setDepth(5);

    // Create initial platforms
    this.createStartPlatforms();

    // Colliders
    this.physics.add.collider(this.player, this.platforms, this.onLand, null, this);
    this.physics.add.collider(this.player, this.movingPlatforms, this.onLand, null, this);
    this.physics.add.overlap(this.player, this.orbs, this.collectOrb, null, this);
    this.physics.add.overlap(this.player, this.spikes, this.hitSpike, null, this);

    // UI
    this.scoreText = this.add.text(16, 16, 'SCORE: 0', {
      fontFamily: '"Courier New", monospace',
      fontSize: '20px',
      color: '#00ffff',
      stroke: '#003344',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(100);

    this.distText = this.add.text(16, 42, '0m', {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#8888aa',
    }).setScrollFactor(0).setDepth(100);

    // Start prompt
    this.startText = this.add.text(W/2, H * 0.35, 'TAP TO START', {
      fontFamily: '"Courier New", monospace',
      fontSize: '28px',
      color: '#00ffff',
      stroke: '#001122',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.tweens.add({
      targets: this.startText,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Controls prompt
    this.controlsText = this.add.text(W/2, H * 0.45, 'ARROWS/WASD or TOUCH\\nDOUBLE JUMP + WALL JUMP', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#666688',
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    // Keyboard
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    // Touch input
    this.input.on('pointerdown', (pointer) => {
      if (!this.gameStarted) {
        this.startGame();
        return;
      }
      if (!this.alive) return;
      const x = pointer.x;
      if (x < W * 0.5) this.touchLeft = true;
      else this.touchRight = true;
      this.touchJump = true;
      this.jumpBufferTimer = JUMP_BUFFER;
    });

    this.input.on('pointerup', (pointer) => {
      // Check remaining pointers
      const pointers = this.input.manager.pointers;
      let anyLeft = false, anyRight = false;
      for (let i = 0; i < pointers.length; i++) {
        if (pointers[i].isDown) {
          if (pointers[i].x < W * 0.5) anyLeft = true;
          else anyRight = true;
        }
      }
      this.touchLeft = anyLeft;
      this.touchRight = anyRight;
      this.touchJump = false;
      this.jumpHeld = false;
    });

    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      if (pointer.x < W * 0.5) { this.touchLeft = true; this.touchRight = false; }
      else { this.touchRight = true; this.touchLeft = false; }
    });

    // Keyboard jump release tracking
    this.input.keyboard.on('keyup-UP', () => { this.jumpHeld = false; });
    this.input.keyboard.on('keyup-W', () => { this.jumpHeld = false; });
    this.input.keyboard.on('keyup-SPACE', () => { this.jumpHeld = false; });

    // Was on ground last frame
    this.wasOnGround = false;

    // Camera
    this.cameras.main.startFollow(this.player, false, 0, 0.08, 0, H * 0.15);
    this.cameras.main.setFollowOffset(-(W * 0.25 - W/2), 0);
  }

  startGame(){
    this.gameStarted = true;
    if (this.startText) this.startText.destroy();
    if (this.controlsText) this.controlsText.destroy();
  }

  createStartPlatforms(){
    // Ground platform
    const groundY = H * 0.75;
    for (let x = -64; x < W + 128; x += 64) {
      this.spawnPlatform(x, groundY, false);
    }
    this.lastPlatformX = W + 64;
    this.lastPlatformY = groundY;

    // A few more ahead
    for (let i = 0; i < 5; i++) {
      this.generateNextPlatform();
    }
  }

  spawnPlatform(x, y, isMoving){
    if (isMoving) {
      const p = this.movingPlatforms.create(x, y, 'movingPlatform');
      p.setOrigin(0, 0);
      p.body.setSize(64, 16);
      p.body.setAllowGravity(false);
      p.body.setImmovable(true);
      p.originY = y;
      p.moveAmplitude = 30 + Math.random() * 40;
      p.moveSpeed = 1.5 + Math.random() * 1.5;
      p.movePhase = Math.random() * Math.PI * 2;
      p.body.checkCollision.down = false;
      p.body.checkCollision.left = false;
      p.body.checkCollision.right = false;
      return p;
    } else {
      const p = this.platforms.create(x, y, 'platform');
      p.setOrigin(0, 0);
      p.refreshBody();
      p.body.checkCollision.down = false;
      p.body.checkCollision.left = false;
      p.body.checkCollision.right = false;
      return p;
    }
  }

  generateNextPlatform(){
    const minGap = Math.max(80, 140 - this.difficultyMult * 8);
    const maxGap = Math.min(280, 160 + this.difficultyMult * 15);
    const gap = Phaser.Math.Between(minGap, maxGap);
    const platWidth = Phaser.Math.Between(2, Math.max(2, 5 - Math.floor(this.difficultyMult * 0.3))) * 64;
    const yDelta = Phaser.Math.Between(-80, 60);
    let newY = Phaser.Math.Clamp(this.lastPlatformY + yDelta, H * 0.2, H * 0.85);
    const newX = this.lastPlatformX + gap;

    const isMoving = Math.random() < Math.min(0.3, 0.05 + this.difficultyMult * 0.03);
    const tiles = platWidth / 64;

    for (let i = 0; i < tiles; i++) {
      this.spawnPlatform(newX + i * 64, newY, isMoving);
    }

    // Orbs above platform
    if (Math.random() < 0.5) {
      const orbCount = Phaser.Math.Between(1, 3);
      for (let i = 0; i < orbCount; i++) {
        const ox = newX + Phaser.Math.Between(8, platWidth - 8);
        const oy = newY - Phaser.Math.Between(40, 80);
        const orb = this.orbs.create(ox, oy, 'orb');
        orb.setOrigin(0.5);
        orb.body.setAllowGravity(false);
        orb.body.setSize(12, 12);
        orb.baseY = oy;
        orb.bobPhase = Math.random() * Math.PI * 2;
      }
    }

    // Spikes on platform
    if (Math.random() < Math.min(0.35, 0.05 + this.difficultyMult * 0.04) && tiles >= 2) {
      const spikeCount = Phaser.Math.Between(1, Math.min(3, tiles - 1));
      const usedPositions = new Set();
      for (let i = 0; i < spikeCount; i++) {
        let pos;
        do { pos = Phaser.Math.Between(0, tiles - 1); } while (usedPositions.has(pos));
        usedPositions.add(pos);
        const sx = newX + pos * 64 + 24;
        const sy = newY - 14;
        const spike = this.spikes.create(sx, sy, 'spike');
        spike.setOrigin(0.5, 1);
        spike.body.setSize(12, 12);
        spike.body.setAllowGravity(false);
      }
    }

    this.lastPlatformX = newX + platWidth;
    this.lastPlatformY = newY;
  }

  collectOrb(player, orb){
    orb.destroy();
    this.orbsCollected++;
    this.score += ORB_SCORE;
    this.updateScore();

    // Flash effect
    this.cameras.main.flash(80, 255, 255, 0, true);
  }

  hitSpike(player, spike){
    if (!this.alive) return;
    this.die();
  }

  onLand(player, platform){
    if (player.body.touching.down) {
      if (!this.wasOnGround && this.alive) {
        // Landing effect
        this.landEmitter.emitParticleAt(player.x, player.y + 16, 6);
      }
      this.jumpCount = 0;
      this.isDoubleJumpAvailable = true;
      this.coyoteTimer = COYOTE_TIME;
    }
  }

  die(){
    if (this.deathTriggered) return;
    this.deathTriggered = true;
    this.alive = false;

    this.deathEmitter.emitParticleAt(this.player.x, this.player.y, 30);
    this.player.setVisible(false);
    this.player.body.setVelocity(0, 0);
    this.player.body.setAllowGravity(false);

    this.cameras.main.shake(300, 0.015);
    this.cameras.main.flash(200, 255, 0, 50, true);

    const finalScore = this.score;

    this.time.delayedCall(600, () => {
      // Game over overlay
      const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.7)
        .setScrollFactor(0).setDepth(200);
      overlay.alpha = 0;
      this.tweens.add({ targets: overlay, alpha: 1, duration: 400 });

      const goText = this.add.text(W/2, H * 0.35, 'GAME OVER', {
        fontFamily: '"Courier New", monospace',
        fontSize: '36px',
        color: '#ff0066',
        stroke: '#330011',
        strokeThickness: 4,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

      this.add.text(W/2, H * 0.48, 'SCORE: ' + finalScore, {
        fontFamily: '"Courier New", monospace',
        fontSize: '24px',
        color: '#00ffff',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

      this.add.text(W/2, H * 0.56, Math.floor(this.distance) + 'm  |  ' + this.orbsCollected + ' orbs', {
        fontFamily: '"Courier New", monospace',
        fontSize: '14px',
        color: '#8888aa',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

      const retry = this.add.text(W/2, H * 0.68, '[ TAP TO RETRY ]', {
        fontFamily: '"Courier New", monospace',
        fontSize: '20px',
        color: '#ffff00',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setInteractive();

      this.tweens.add({
        targets: retry, alpha: { from: 1, to: 0.4 },
        duration: 600, yoyo: true, repeat: -1,
      });

      retry.on('pointerdown', () => { this.scene.restart(); });
      this.input.keyboard.once('keydown-SPACE', () => { this.scene.restart(); });
      this.input.keyboard.once('keydown-ENTER', () => { this.scene.restart(); });

      try {
        window.parent.postMessage({ type: 'gameOver', score: finalScore }, '*');
      } catch(e){}
    });
  }

  updateScore(){
    this.scoreText.setText('SCORE: ' + this.score);
    this.distText.setText(Math.floor(this.distance) + 'm  |  ' + this.orbsCollected + ' orbs');
  }

  drawGrid(dt){
    const g = this.gridGraphics;
    g.clear();
    g.lineStyle(1, C.grid, 0.3);

    this.gridOffset = (this.gridOffset + this.scrollSpeed * dt * 0.001) % 60;

    const camY = this.cameras.main.scrollY;
    const startY = Math.floor(camY / 60) * 60;

    for (let x = -this.gridOffset; x < W + 60; x += 60) {
      g.lineBetween(x, camY, x, camY + H);
    }
    for (let y = startY; y < camY + H + 60; y += 60) {
      g.lineBetween(0, y, W, y);
    }
    g.setDepth(0);
    g.setScrollFactor(0);

    // Re-position to camera
    g.setPosition(0, 0);
  }

  drawSpeedLines(dt){
    const g = this.speedLinesGfx;
    g.clear();
    if (!this.alive || !this.gameStarted) return;

    const speed = Math.abs(this.player.body.velocity.x) + this.scrollSpeed;
    if (speed < 200) return;

    const alpha = Math.min(0.4, (speed - 200) / 600);
    g.lineStyle(1, C.speedLine, alpha);

    for (let i = 0; i < 6; i++) {
      const ly = this.player.y + Phaser.Math.Between(-80, 80);
      const lx = this.player.x + Phaser.Math.Between(-40, -10);
      const len = Phaser.Math.Between(20, 60);
      g.lineBetween(lx - len, ly, lx, ly);
    }
  }

  updateTrail(){
    // Add current position
    if (this.alive && this.player.visible) {
      this.trailPositions.unshift({ x: this.player.x, y: this.player.y, a: 0.6 });
    }

    // Limit trail length
    if (this.trailPositions.length > 8) {
      this.trailPositions.length = 8;
    }

    // Remove old trail sprites
    this.trailContainer.removeAll(true);

    // Draw trail
    for (let i = 1; i < this.trailPositions.length; i++) {
      const t = this.trailPositions[i];
      t.a *= 0.75;
      if (t.a < 0.05) continue;
      const s = this.add.image(t.x, t.y, 'trail').setAlpha(t.a).setDepth(8);
      s.setTint(Phaser.Display.Color.GetColor(0, Math.floor(255 * t.a * 0.6), Math.floor(255 * t.a)));
      this.trailContainer.add(s);
    }
  }

  tryJump(){
    const onGround = this.player.body.blocked.down || this.player.body.touching.down;
    const canCoyote = !onGround && this.coyoteTimer > 0 && this.jumpCount === 0;

    if (this.isOnWall && !onGround) {
      // Wall jump
      this.player.body.setVelocityY(WALL_JUMP_VEL_Y);
      this.player.body.setVelocityX(-this.wallSide * WALL_JUMP_VEL_X);
      this.jumpCount = 1;
      this.isDoubleJumpAvailable = true;
      this.coyoteTimer = 0;
      this.jumpHeld = true;
      this.jumpEmitter.setParticleTint([0xff00ff, 0xaa00ff]);
      this.jumpEmitter.emitParticleAt(this.player.x + this.wallSide * 12, this.player.y, 8);
      return true;
    }

    if (onGround || canCoyote) {
      // Normal jump
      this.player.body.setVelocityY(JUMP_VEL);
      this.jumpCount = 1;
      this.coyoteTimer = 0;
      this.jumpHeld = true;
      this.jumpEmitter.setParticleTint([C.particle1, 0xffffff]);
      this.jumpEmitter.emitParticleAt(this.player.x, this.player.y + 16, 8);
      return true;
    }

    if (this.isDoubleJumpAvailable && this.jumpCount >= 1) {
      // Double jump
      this.player.body.setVelocityY(DOUBLE_JUMP_VEL);
      this.isDoubleJumpAvailable = false;
      this.jumpCount = 2;
      this.jumpHeld = true;
      this.jumpEmitter.setParticleTint([C.particle2, C.particle3]);
      this.jumpEmitter.emitParticleAt(this.player.x, this.player.y + 16, 12);
      return true;
    }

    return false;
  }

  update(time, delta){
    if (!this.alive && this.deathTriggered) return;

    const dt = Math.min(delta, 33.33); // Cap at ~30fps equivalent

    this.drawGrid(dt);

    if (!this.gameStarted) {
      // Idle bobbing
      this.player.y = H * 0.5 + Math.sin(time * 0.003) * 8;
      return;
    }

    if (!this.alive) return;

    const onGround = this.player.body.blocked.down || this.player.body.touching.down;

    // Coyote time
    if (onGround) {
      this.coyoteTimer = COYOTE_TIME;
    } else {
      this.coyoteTimer -= dt;
    }

    // Wall detection
    this.isOnWall = false;
    if (!onGround) {
      if (this.player.body.blocked.left) {
        this.isOnWall = true;
        this.wallSide = -1;
      } else if (this.player.body.blocked.right) {
        this.isOnWall = true;
        this.wallSide = 1;
      }
    }

    // Wall slide
    if (this.isOnWall && this.player.body.velocity.y > 0) {
      this.player.body.setVelocityY(WALL_SLIDE_VEL);
      // Wall slide particles
      if (Math.random() < 0.3) {
        this.landEmitter.emitParticleAt(
          this.player.x + this.wallSide * -12,
          this.player.y + Phaser.Math.Between(-10, 10), 1
        );
      }
    }

    // Jump buffer
    this.jumpBufferTimer -= dt;

    // Input
    const leftKey = this.cursors.left.isDown || this.wasd.left.isDown;
    const rightKey = this.cursors.right.isDown || this.wasd.right.isDown;
    const jumpKey = this.cursors.up.isDown || this.wasd.up.isDown || this.wasd.space.isDown;
    const jumpJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.wasd.up)
      || Phaser.Input.Keyboard.JustDown(this.wasd.space);

    let moveDir = 0;
    if (leftKey || this.touchLeft) moveDir = -1;
    if (rightKey || this.touchRight) moveDir = 1;

    // Horizontal movement with acceleration
    const targetVx = moveDir * PLAYER_SPEED;
    const currentVx = this.player.body.velocity.x;
    const accel = onGround ? 0.2 : 0.12;
    this.player.body.setVelocityX(Phaser.Math.Linear(currentVx, targetVx, accel));

    // Jump
    if (jumpJustPressed || this.touchJump) {
      this.jumpBufferTimer = JUMP_BUFFER;
      this.touchJump = false;
    }

    if (this.jumpBufferTimer > 0) {
      if (this.tryJump()) {
        this.jumpBufferTimer = 0;
      }
    }

    // Variable jump height
    if (this.jumpHeld && (jumpKey || this.touchJump)) {
      // Holding jump - do nothing, let full jump happen
    } else if (this.player.body.velocity.y < JUMP_VEL * 0.4) {
      // Released jump early - cut velocity
      if (!jumpKey && !this.touchJump && this.jumpHeld === false) {
        // Already released
      }
    }
    if (!jumpKey && !this.touchJump && this.player.body.velocity.y < 0) {
      // Short hop: increase gravity when jump released early
      this.player.body.setVelocityY(this.player.body.velocity.y * 0.92);
    }

    // Scroll everything left
    const scrollDelta = this.scrollSpeed * dt * 0.001;
    this.distance += scrollDelta * 0.1;
    this.score = Math.floor(this.distance) + this.orbsCollected * ORB_SCORE;
    this.updateScore();

    // Difficulty scaling
    this.difficultyMult = 1 + this.distance * 0.008;
    this.scrollSpeed = PLATFORM_SCROLL_SPEED + this.distance * 0.5;

    // Move platforms left
    this.platforms.children.each((p) => {
      p.x -= scrollDelta;
      p.refreshBody();
      if (p.x < -128) p.destroy();
    });

    this.movingPlatforms.children.each((p) => {
      p.x -= scrollDelta;
      // Sine wave vertical movement
      p.y = p.originY + Math.sin(time * 0.001 * p.moveSpeed + p.movePhase) * p.moveAmplitude;
      p.body.updateFromGameObject();
      if (p.x < -128) p.destroy();
    });

    // Move orbs
    this.orbs.children.each((o) => {
      o.x -= scrollDelta;
      o.y = o.baseY + Math.sin(time * 0.004 + o.bobPhase) * 8;
      // Pulsing scale
      o.setScale(0.9 + Math.sin(time * 0.006 + o.bobPhase) * 0.2);
      o.setAlpha(0.7 + Math.sin(time * 0.005) * 0.3);
      if (o.x < -32) o.destroy();
    });

    // Move spikes
    this.spikes.children.each((s) => {
      s.x -= scrollDelta;
      if (s.x < -32) s.destroy();
    });

    // Generate new platforms as needed
    const camRight = this.cameras.main.scrollX + W + 200;
    while (this.lastPlatformX < camRight + W) {
      this.generateNextPlatform();
    }
    // Also shift lastPlatformX with scroll
    this.lastPlatformX -= scrollDelta;

    // Player tint based on state
    if (this.isOnWall) {
      this.player.setTint(0xff00ff);
    } else if (!onGround && this.jumpCount >= 2) {
      this.player.setTint(0xffff00);
    } else {
      this.player.setTint(C.player);
    }

    // Trail
    this.updateTrail();

    // Speed lines
    this.drawSpeedLines(dt);

    // Death check: fell off bottom
    if (this.player.y > this.cameras.main.scrollY + H + 50) {
      this.die();
    }

    // Death check: scrolled off left
    if (this.player.x < this.cameras.main.scrollX - 50) {
      this.die();
    }

    // Track ground state for landing detection
    this.wasOnGround = onGround;

    // Player glow effect (simple scale pulse)
    if (onGround) {
      this.player.setScale(1);
    } else {
      this.player.setScale(1 + Math.sin(time * 0.01) * 0.03);
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: document.body,
  backgroundColor: '#0a0a1a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  input: {
    activePointers: 3,
  },
  scene: [BootScene, GameScene],
  render: {
    pixelArt: false,
    antialias: true,
  },
  audio: { noAudio: true },
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

})();
<\/script>
</body>
</html>`;
