export const NEON_SHOOTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,maximum-scale=1.0">
<title>Neon Space Shooter</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#000;touch-action:none}
canvas{display:block}
</style>
</head>
<body>
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
<script>
'use strict';
(function(){

/* ───────── constants ───────── */
var W = window.innerWidth;
var H = window.innerHeight;
var CYAN    = 0x00ffff;
var MAGENTA = 0xff00ff;
var YELLOW  = 0xffff00;
var GREEN   = 0x00ff88;
var WHITE   = 0xffffff;
var RED     = 0xff3333;

/* ───────── helper: create neon textures at runtime ───────── */
function hexColor(c){ return '#'+c.toString(16).padStart(6,'0'); }

function makeTriangleTex(scene, key, w, h, color){
  var g = scene.add.graphics();
  g.lineStyle(2, color, 1);
  g.fillStyle(color, 0.35);
  g.beginPath();
  g.moveTo(w/2, 0);
  g.lineTo(w, h);
  g.lineTo(0, h);
  g.closePath();
  g.fillPath();
  g.strokePath();
  // inner glow line
  g.lineStyle(1, WHITE, 0.5);
  g.beginPath();
  g.moveTo(w/2, 4);
  g.lineTo(w-6, h-4);
  g.lineTo(6, h-4);
  g.closePath();
  g.strokePath();
  g.generateTexture(key, w, h);
  g.destroy();
}

function makeDiamondTex(scene, key, s, color){
  var g = scene.add.graphics();
  g.lineStyle(2, color, 1);
  g.fillStyle(color, 0.3);
  g.beginPath();
  g.moveTo(s/2,0);
  g.lineTo(s,s/2);
  g.lineTo(s/2,s);
  g.lineTo(0,s/2);
  g.closePath();
  g.fillPath();
  g.strokePath();
  g.generateTexture(key, s, s);
  g.destroy();
}

function makeHexTex(scene, key, r, color){
  var g = scene.add.graphics();
  g.lineStyle(2, color, 1);
  g.fillStyle(color, 0.25);
  var pts = [];
  for(var i=0;i<6;i++){
    var a = Math.PI/3*i - Math.PI/2;
    pts.push({x: r + Math.cos(a)*r, y: r + Math.sin(a)*r});
  }
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for(var i=1;i<6;i++) g.lineTo(pts[i].x, pts[i].y);
  g.closePath();
  g.fillPath();
  g.strokePath();
  g.generateTexture(key, r*2, r*2);
  g.destroy();
}

function makeCircleTex(scene, key, r, color){
  var g = scene.add.graphics();
  g.lineStyle(2, color, 1);
  g.fillStyle(color, 0.2);
  g.fillCircle(r, r, r-1);
  g.strokeCircle(r, r, r-1);
  g.generateTexture(key, r*2, r*2);
  g.destroy();
}

function makeBulletTex(scene, key, w, h, color){
  var g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(WHITE, 0.7);
  g.fillRect(1, 1, w-2, h/2);
  g.generateTexture(key, w, h);
  g.destroy();
}

function makeGlowDotTex(scene, key, r, color){
  var g = scene.add.graphics();
  g.fillStyle(color, 0.6);
  g.fillCircle(r,r,r);
  g.fillStyle(WHITE, 0.8);
  g.fillCircle(r,r,r*0.4);
  g.generateTexture(key, r*2, r*2);
  g.destroy();
}

function makeStarTex(scene, key, r){
  var g = scene.add.graphics();
  g.fillStyle(WHITE, 1);
  g.fillCircle(r,r,r);
  g.generateTexture(key, r*2, r*2);
  g.destroy();
}

function makePowerUpTex(scene, key, s, color){
  var g = scene.add.graphics();
  g.lineStyle(2, color, 1);
  g.fillStyle(color, 0.4);
  g.fillCircle(s/2, s/2, s/2-2);
  g.strokeCircle(s/2, s/2, s/2-2);
  g.lineStyle(2, WHITE, 0.8);
  g.strokeCircle(s/2, s/2, s/2-6);
  g.generateTexture(key, s, s);
  g.destroy();
}

function makeShieldTex(scene, key, r, color){
  var g = scene.add.graphics();
  g.lineStyle(2, color, 0.6);
  g.strokeCircle(r,r,r-2);
  g.lineStyle(1, WHITE, 0.3);
  g.strokeCircle(r,r,r-5);
  g.generateTexture(key, r*2, r*2);
  g.destroy();
}

/* ───────── BOOT scene (preload textures) ───────── */
var BootScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function(){ Phaser.Scene.call(this, {key:'Boot'}); },
  create: function(){
    var sc = this;
    // player ship 32x40
    makeTriangleTex(sc, 'ship', 32, 40, CYAN);
    // enemies
    makeDiamondTex(sc, 'enemy1', 28, MAGENTA);
    makeHexTex(sc, 'enemy2', 16, 0xff44cc);
    makeCircleTex(sc, 'enemy3', 14, 0xcc00ff);
    // boss
    makeHexTex(sc, 'boss', 36, 0xff0066);
    // bullets
    makeBulletTex(sc, 'pbullet', 4, 12, YELLOW);
    makeBulletTex(sc, 'ebullet', 4, 10, MAGENTA);
    // particles
    makeGlowDotTex(sc, 'glow_cyan', 4, CYAN);
    makeGlowDotTex(sc, 'glow_mag', 4, MAGENTA);
    makeGlowDotTex(sc, 'glow_yel', 4, YELLOW);
    makeGlowDotTex(sc, 'glow_white', 3, WHITE);
    makeGlowDotTex(sc, 'glow_green', 4, GREEN);
    makeGlowDotTex(sc, 'glow_red', 4, RED);
    // star layers
    makeStarTex(sc, 'star1', 1);
    makeStarTex(sc, 'star2', 1);
    // powerup
    makePowerUpTex(sc, 'pu_spread', 20, GREEN);
    makePowerUpTex(sc, 'pu_shield', 20, 0x00ccff);
    makePowerUpTex(sc, 'pu_speed', 20, YELLOW);
    // shield visual
    makeShieldTex(sc, 'shield_vis', 28, 0x00ccff);
    // health bar pieces
    var gb = sc.add.graphics();
    gb.fillStyle(RED, 1); gb.fillRect(0,0,1,6);
    gb.generateTexture('hpbar',1,6); gb.destroy();

    sc.scene.start('Game');
  }
});

/* ───────── GAME scene ───────── */
var GameScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function(){ Phaser.Scene.call(this, {key:'Game'}); },

  create: function(){
    var sc = this;
    sc.gameW = sc.scale.width;
    sc.gameH = sc.scale.height;

    /* --- starfield (3 parallax layers) --- */
    sc.stars = [[],[],[]];
    var speeds = [0.3, 0.7, 1.4];
    var counts = [80, 50, 30];
    var alphas = [0.3, 0.55, 0.9];
    for(var layer=0; layer<3; layer++){
      for(var i=0; i<counts[layer]; i++){
        var s = sc.add.image(
          Phaser.Math.Between(0, sc.gameW),
          Phaser.Math.Between(0, sc.gameH),
          'star1'
        );
        s.setAlpha(alphas[layer]);
        s.setScale(0.5 + layer*0.4);
        s.setDepth(-10 + layer);
        s.speedY = speeds[layer];
        sc.stars[layer].push(s);
      }
    }

    /* --- physics groups (object pooling) --- */
    sc.playerBullets = sc.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 120,
      runChildUpdate: false
    });
    sc.enemyBullets = sc.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 80,
      runChildUpdate: false
    });
    sc.enemies = sc.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 40,
      runChildUpdate: false
    });
    sc.powerUps = sc.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 10,
      runChildUpdate: false
    });

    /* --- player --- */
    sc.player = sc.physics.add.image(sc.gameW/2, sc.gameH - 80, 'ship');
    sc.player.setDepth(10);
    sc.player.setCollideWorldBounds(true);
    sc.player.body.setSize(20, 30);

    /* --- shield visual --- */
    sc.shieldSprite = sc.add.image(sc.player.x, sc.player.y, 'shield_vis');
    sc.shieldSprite.setDepth(11);
    sc.shieldSprite.setVisible(false);
    sc.shieldSprite.setScale(1.8);

    /* --- engine trail particle --- */
    sc.engineEmitter = sc.add.particles(0,0,'glow_cyan',{
      speed: {min:20, max:60},
      angle: {min:80, max:100},
      scale: {start:1.0, end:0},
      alpha: {start:0.8, end:0},
      lifespan: 300,
      frequency: 30,
      blendMode: 'ADD',
      follow: sc.player,
      followOffset: {x:0, y:18}
    });
    sc.engineEmitter.setDepth(9);

    /* --- game state --- */
    sc.score = 0;
    sc.lives = 3;
    sc.wave = 0;
    sc.waveTimer = 0;
    sc.waveDelay = 2500;
    sc.fireTimer = 0;
    sc.fireRate = 180; // ms between shots
    sc.spreadShot = false;
    sc.spreadTimer = 0;
    sc.shieldActive = false;
    sc.shieldTimer = 0;
    sc.speedBoost = false;
    sc.speedTimer = 0;
    sc.comboCount = 0;
    sc.comboTimer = 0;
    sc.multiplier = 1;
    sc.isGameOver = false;
    sc.invincible = false;
    sc.invTimer = 0;
    sc.bossAlive = false;
    sc.bossRef = null;
    sc.playerSpeed = 320;
    sc.enemiesKilledThisWave = 0;
    sc.totalEnemiesInWave = 0;
    sc.waveActive = false;
    sc.nextWaveCountdown = 1500;

    /* --- HUD --- */
    var fontSize = Math.max(16, Math.min(24, sc.gameW * 0.04));
    sc.scoreText = sc.add.text(12, 10, 'SCORE: 0', {
      fontFamily: 'monospace', fontSize: fontSize+'px', color: '#00ffff',
      stroke: '#003333', strokeThickness: 2
    }).setDepth(100);
    sc.livesText = sc.add.text(sc.gameW - 12, 10, 'LIVES: 3', {
      fontFamily: 'monospace', fontSize: fontSize+'px', color: '#ff4444',
      stroke: '#330000', strokeThickness: 2
    }).setDepth(100).setOrigin(1, 0);
    sc.waveText = sc.add.text(sc.gameW/2, 10, 'WAVE 0', {
      fontFamily: 'monospace', fontSize: fontSize+'px', color: '#ffff00',
      stroke: '#333300', strokeThickness: 2
    }).setDepth(100).setOrigin(0.5, 0);
    sc.multiText = sc.add.text(12, 10+fontSize+4, '', {
      fontFamily: 'monospace', fontSize: (fontSize*0.75)+'px', color: '#00ff88'
    }).setDepth(100);

    /* --- boss health bar (hidden initially) --- */
    sc.bossHpBg = sc.add.rectangle(sc.gameW/2, 50, sc.gameW*0.6, 10, 0x333333).setDepth(100).setVisible(false);
    sc.bossHpBar = sc.add.rectangle(sc.gameW/2, 50, sc.gameW*0.6, 8, 0xff0044).setDepth(101).setVisible(false);
    sc.bossLabel = sc.add.text(sc.gameW/2, 36, 'BOSS', {
      fontFamily:'monospace', fontSize:'14px', color:'#ff0066'
    }).setOrigin(0.5,1).setDepth(100).setVisible(false);

    /* --- input --- */
    sc.cursors = sc.input.keyboard.createCursorKeys();
    sc.touchX = null;
    sc.touchStartX = null;
    sc.touchPlayerStartX = null;

    sc.input.on('pointerdown', function(p){
      sc.touchX = p.x;
      sc.touchStartX = p.x;
      sc.touchPlayerStartX = sc.player.x;
    });
    sc.input.on('pointermove', function(p){
      if(p.isDown){
        sc.touchX = p.x;
      }
    });
    sc.input.on('pointerup', function(){
      sc.touchX = null;
      sc.touchStartX = null;
    });

    /* --- collisions --- */
    sc.physics.add.overlap(sc.playerBullets, sc.enemies, sc.hitEnemy, null, sc);
    sc.physics.add.overlap(sc.enemyBullets, sc.player, sc.hitPlayer, null, sc);
    sc.physics.add.overlap(sc.enemies, sc.player, sc.enemyCollide, null, sc);
    sc.physics.add.overlap(sc.powerUps, sc.player, sc.collectPowerUp, null, sc);

    /* --- kick off first wave --- */
    sc.time.delayedCall(1000, function(){ sc.spawnWave(); });
  },

  /* ═══════════ WAVE SPAWNING ═══════════ */
  spawnWave: function(){
    var sc = this;
    if(sc.isGameOver) return;
    sc.wave++;
    sc.waveText.setText('WAVE ' + sc.wave);
    sc.enemiesKilledThisWave = 0;
    sc.waveActive = true;

    // flash wave text
    sc.tweens.add({
      targets: sc.waveText, alpha: 0.2, yoyo: true, repeat: 3, duration: 150,
      onComplete: function(){ sc.waveText.setAlpha(1); }
    });

    // boss wave every 5
    if(sc.wave % 5 === 0){
      sc.spawnBoss();
      return;
    }

    var patterns = ['v','zigzag','line','diamond','swarm'];
    var pat = patterns[(sc.wave - 1) % patterns.length];
    var count = Math.min(6 + Math.floor(sc.wave * 0.8), 18);
    sc.totalEnemiesInWave = count;
    var textures = ['enemy1','enemy2','enemy3'];

    var positions = [];
    var spacing = sc.gameW / (count + 1);

    if(pat === 'v'){
      var mid = count / 2;
      for(var i=0;i<count;i++){
        positions.push({
          x: spacing * (i+1),
          y: -30 - Math.abs(i - mid) * 30,
          tex: textures[i % 3]
        });
      }
    } else if(pat === 'zigzag'){
      for(var i=0;i<count;i++){
        positions.push({
          x: spacing * (i+1),
          y: -30 - (i % 2) * 40,
          tex: textures[i % 3]
        });
      }
    } else if(pat === 'line'){
      for(var i=0;i<count;i++){
        positions.push({
          x: spacing * (i+1),
          y: -30 - Math.floor(i/6)*35,
          tex: textures[i % 3]
        });
      }
    } else if(pat === 'diamond'){
      var cx = sc.gameW/2;
      for(var i=0;i<count;i++){
        var angle = (Math.PI*2/count)*i;
        positions.push({
          x: cx + Math.cos(angle)*100,
          y: -80 + Math.sin(angle)*60,
          tex: textures[i % 3]
        });
      }
    } else {
      for(var i=0;i<count;i++){
        positions.push({
          x: Phaser.Math.Between(40, sc.gameW-40),
          y: -Phaser.Math.Between(30, 200),
          tex: textures[i % 3]
        });
      }
    }

    var hp = 1 + Math.floor(sc.wave / 3);
    var speed = 30 + Math.min(sc.wave * 4, 80);

    for(var i=0; i<positions.length; i++){
      (function(pos, idx){
        sc.time.delayedCall(idx * 80, function(){
          sc.spawnEnemy(pos.x, pos.y, pos.tex, hp, speed);
        });
      })(positions[i], i);
    }
  },

  spawnEnemy: function(x, y, tex, hp, speed){
    var sc = this;
    var e = sc.enemies.get(x, y, tex);
    if(!e) return;
    e.setActive(true).setVisible(true).setDepth(5);
    e.body.enable = true;
    e.setScale(1);
    e.setAlpha(1);
    e.hp = hp;
    e.maxHp = hp;
    e.speed = speed;
    e.shootTimer = Phaser.Math.Between(500, 2000);
    e.shootInterval = Math.max(800, 2000 - sc.wave * 50);
    e.movePattern = Phaser.Math.Between(0, 2);
    e.baseX = x;
    e.time = 0;
    e.body.setVelocityY(speed);
    e.body.setSize(e.width * 0.8, e.height * 0.8);
    e.isBoss = false;
  },

  spawnBoss: function(){
    var sc = this;
    sc.totalEnemiesInWave = 1;
    sc.bossAlive = true;
    var e = sc.enemies.get(sc.gameW/2, -60, 'boss');
    if(!e) return;
    e.setActive(true).setVisible(true).setDepth(5);
    e.body.enable = true;
    e.setScale(2.2);
    var bossHp = 20 + sc.wave * 5;
    e.hp = bossHp;
    e.maxHp = bossHp;
    e.speed = 20;
    e.shootTimer = 0;
    e.shootInterval = 400;
    e.movePattern = 3; // boss pattern
    e.baseX = sc.gameW / 2;
    e.time = 0;
    e.isBoss = true;
    e.body.setVelocityY(30);
    e.body.setSize(e.width*1.5, e.height*1.5);
    sc.bossRef = e;

    // show boss HP bar
    sc.bossHpBg.setVisible(true);
    sc.bossHpBar.setVisible(true);
    sc.bossLabel.setVisible(true);

    // boss stops at y=100
    sc.time.delayedCall(2000, function(){
      if(e.active) e.body.setVelocityY(0);
    });
  },

  /* ═══════════ SHOOTING ═══════════ */
  firePlayerBullet: function(){
    var sc = this;
    if(sc.isGameOver) return;

    var angles = [0];
    if(sc.spreadShot){
      angles = [-12, -4, 4, 12];
    }

    for(var i=0; i<angles.length; i++){
      var b = sc.playerBullets.get(sc.player.x, sc.player.y - 22, 'pbullet');
      if(!b) continue;
      b.setActive(true).setVisible(true).setDepth(8);
      b.body.enable = true;
      b.setScale(1);
      b.setAlpha(1);
      var rad = Phaser.Math.DegToRad(-90 + angles[i]);
      var spd = 500;
      b.body.setVelocity(Math.cos(rad)*spd, Math.sin(rad)*spd);
      b.body.setSize(4, 12);
    }
  },

  fireEnemyBullet: function(ex, ey){
    var sc = this;
    var b = sc.enemyBullets.get(ex, ey, 'ebullet');
    if(!b) return;
    b.setActive(true).setVisible(true).setDepth(4);
    b.body.enable = true;
    b.setScale(1);
    b.setAlpha(1);
    // aim toward player with some randomness
    var angle = Phaser.Math.Angle.Between(ex, ey, sc.player.x, sc.player.y);
    angle += Phaser.Math.FloatBetween(-0.2, 0.2);
    var spd = 180 + Math.min(sc.wave * 6, 120);
    b.body.setVelocity(Math.cos(angle)*spd, Math.sin(angle)*spd);
    b.body.setSize(4, 10);
  },

  /* ═══════════ COLLISIONS ═══════════ */
  hitEnemy: function(bullet, enemy){
    var sc = this;
    if(!bullet.active || !enemy.active) return;
    bullet.setActive(false).setVisible(false);
    bullet.body.enable = false;

    enemy.hp--;

    // flash white
    enemy.setTint(0xffffff);
    sc.time.delayedCall(60, function(){
      if(enemy.active) enemy.clearTint();
    });

    if(enemy.hp <= 0){
      sc.destroyEnemy(enemy);
    } else if(enemy.isBoss){
      // update boss HP bar
      var pct = enemy.hp / enemy.maxHp;
      sc.bossHpBar.setScale(pct, 1);
    }
  },

  destroyEnemy: function(enemy){
    var sc = this;
    var ex = enemy.x, ey = enemy.y;
    var isBoss = enemy.isBoss;

    enemy.setActive(false).setVisible(false);
    enemy.body.enable = false;

    // explosion particles (30+)
    var color = isBoss ? 'glow_red' : 'glow_mag';
    var count = isBoss ? 60 : 35;
    var em = sc.add.particles(ex, ey, color, {
      speed: {min: 60, max: isBoss ? 250 : 180},
      angle: {min: 0, max: 360},
      scale: {start: isBoss ? 1.5 : 1.0, end: 0},
      alpha: {start: 1, end: 0},
      lifespan: isBoss ? 800 : 500,
      quantity: count,
      blendMode: 'ADD',
      emitting: false
    });
    em.setDepth(20);
    em.explode(count);
    sc.time.delayedCall(isBoss ? 900 : 600, function(){ em.destroy(); });

    // screen shake
    sc.cameras.main.shake(isBoss ? 400 : 150, isBoss ? 0.015 : 0.006);

    // scoring with combo multiplier
    sc.comboCount++;
    sc.comboTimer = 1500; // ms to keep combo
    sc.multiplier = 1 + Math.floor(sc.comboCount / 5) * 0.5;
    if(sc.multiplier > 5) sc.multiplier = 5;

    var baseScore = isBoss ? 500 : (10 + sc.wave * 2);
    var pts = Math.floor(baseScore * sc.multiplier);
    sc.score += pts;
    sc.scoreText.setText('SCORE: ' + sc.score);

    // floating score text
    var ft = sc.add.text(ex, ey, '+' + pts, {
      fontFamily:'monospace', fontSize:'16px', color: isBoss ? '#ff4444' : '#ffff00'
    }).setOrigin(0.5).setDepth(50);
    sc.tweens.add({
      targets: ft, y: ey - 50, alpha: 0, duration: 700,
      onComplete: function(){ ft.destroy(); }
    });

    // power-up drop chance
    if(Math.random() < (isBoss ? 1.0 : 0.12)){
      sc.dropPowerUp(ex, ey);
    }

    // wave tracking
    sc.enemiesKilledThisWave++;

    if(isBoss){
      sc.bossAlive = false;
      sc.bossRef = null;
      sc.bossHpBg.setVisible(false);
      sc.bossHpBar.setVisible(false);
      sc.bossLabel.setVisible(false);
    }

    if(sc.enemiesKilledThisWave >= sc.totalEnemiesInWave){
      sc.waveActive = false;
      sc.nextWaveCountdown = 2000;
    }
  },

  hitPlayer: function(player, bullet){
    var sc = this;
    if(!bullet.active) return;
    bullet.setActive(false).setVisible(false);
    bullet.body.enable = false;
    sc.damagePlayer();
  },

  enemyCollide: function(player, enemy){
    var sc = this;
    if(!enemy.active) return;
    sc.destroyEnemy(enemy);
    sc.damagePlayer();
  },

  damagePlayer: function(){
    var sc = this;
    if(sc.isGameOver || sc.invincible) return;
    if(sc.shieldActive){
      sc.shieldActive = false;
      sc.shieldSprite.setVisible(false);
      sc.shieldTimer = 0;
      // shield break effect
      var em = sc.add.particles(sc.player.x, sc.player.y, 'glow_cyan', {
        speed: {min:40,max:120}, angle:{min:0,max:360},
        scale:{start:0.8,end:0}, lifespan:400, quantity:15,
        blendMode:'ADD', emitting:false
      });
      em.setDepth(20); em.explode(15);
      sc.time.delayedCall(500, function(){ em.destroy(); });
      return;
    }

    sc.lives--;
    sc.livesText.setText('LIVES: ' + sc.lives);

    // death explosion
    var em = sc.add.particles(sc.player.x, sc.player.y, 'glow_cyan', {
      speed: {min:80,max:200}, angle:{min:0,max:360},
      scale:{start:1.2,end:0}, alpha:{start:1,end:0},
      lifespan:600, quantity:40, blendMode:'ADD', emitting:false
    });
    em.setDepth(20); em.explode(40);
    sc.time.delayedCall(700, function(){ em.destroy(); });

    sc.cameras.main.shake(300, 0.02);

    if(sc.lives <= 0){
      sc.gameOverSequence();
      return;
    }

    // brief invincibility
    sc.invincible = true;
    sc.invTimer = 2000;
    sc.player.setAlpha(0.4);

    // reset combo
    sc.comboCount = 0;
    sc.multiplier = 1;
  },

  gameOverSequence: function(){
    var sc = this;
    sc.isGameOver = true;
    sc.player.setVisible(false);
    sc.player.body.enable = false;
    sc.engineEmitter.stop();

    // big explosion
    var em = sc.add.particles(sc.player.x, sc.player.y, 'glow_white', {
      speed:{min:50,max:300}, angle:{min:0,max:360},
      scale:{start:1.5,end:0}, lifespan:1200, quantity:60,
      blendMode:'ADD', emitting:false
    });
    em.setDepth(20); em.explode(60);

    sc.cameras.main.shake(500, 0.03);

    // game over text
    sc.time.delayedCall(800, function(){
      var goText = sc.add.text(sc.gameW/2, sc.gameH/2 - 40, 'GAME OVER', {
        fontFamily:'monospace', fontSize:'36px', color:'#ff0044',
        stroke:'#000', strokeThickness:4
      }).setOrigin(0.5).setDepth(200);

      sc.add.text(sc.gameW/2, sc.gameH/2 + 10, 'SCORE: ' + sc.score, {
        fontFamily:'monospace', fontSize:'24px', color:'#00ffff',
        stroke:'#000', strokeThickness:3
      }).setOrigin(0.5).setDepth(200);

      sc.add.text(sc.gameW/2, sc.gameH/2 + 50, 'TAP TO RESTART', {
        fontFamily:'monospace', fontSize:'18px', color:'#888888'
      }).setOrigin(0.5).setDepth(200);

      sc.tweens.add({
        targets: goText, scaleX:1.1, scaleY:1.1, yoyo:true,
        repeat:-1, duration:600, ease:'Sine.easeInOut'
      });

      // send score to parent
      try{
        window.parent.postMessage({ type: 'gameOver', score: sc.score }, '*');
      }catch(e){}

      // restart on tap
      sc.input.once('pointerdown', function(){
        sc.scene.restart();
      });
      sc.input.keyboard.once('keydown', function(){
        sc.scene.restart();
      });
    });
  },

  /* ═══════════ POWER-UPS ═══════════ */
  dropPowerUp: function(x, y){
    var sc = this;
    var types = ['spread','shield','speed'];
    var texes = ['pu_spread','pu_shield','pu_speed'];
    var idx = Phaser.Math.Between(0, 2);
    var pu = sc.powerUps.get(x, y, texes[idx]);
    if(!pu) return;
    pu.setActive(true).setVisible(true).setDepth(6);
    pu.body.enable = true;
    pu.setScale(1);
    pu.setAlpha(1);
    pu.body.setVelocityY(80);
    pu.puType = types[idx];

    // gentle pulse
    sc.tweens.add({
      targets: pu, scaleX:1.2, scaleY:1.2, yoyo:true,
      repeat:-1, duration:400, ease:'Sine.easeInOut'
    });
  },

  collectPowerUp: function(player, pu){
    var sc = this;
    if(!pu.active) return;
    var type = pu.puType;
    pu.setActive(false).setVisible(false);
    pu.body.enable = false;
    sc.tweens.killTweensOf(pu);

    // collect flash
    var em = sc.add.particles(pu.x, pu.y, 'glow_green', {
      speed:{min:30,max:80}, angle:{min:0,max:360},
      scale:{start:0.8,end:0}, lifespan:300, quantity:12,
      blendMode:'ADD', emitting:false
    });
    em.setDepth(20); em.explode(12);
    sc.time.delayedCall(400, function(){ em.destroy(); });

    if(type === 'spread'){
      sc.spreadShot = true;
      sc.spreadTimer = 8000;
    } else if(type === 'shield'){
      sc.shieldActive = true;
      sc.shieldTimer = 10000;
      sc.shieldSprite.setVisible(true);
    } else if(type === 'speed'){
      sc.speedBoost = true;
      sc.speedTimer = 6000;
      sc.playerSpeed = 500;
    }

    // HUD flash
    var label = type === 'spread' ? 'SPREAD SHOT!' : type === 'shield' ? 'SHIELD!' : 'SPEED BOOST!';
    var ft = sc.add.text(sc.gameW/2, sc.gameH/2, label, {
      fontFamily:'monospace', fontSize:'20px', color:'#00ff88',
      stroke:'#003311', strokeThickness:3
    }).setOrigin(0.5).setDepth(150);
    sc.tweens.add({
      targets:ft, y: sc.gameH/2 - 60, alpha:0, duration:1000,
      onComplete: function(){ ft.destroy(); }
    });
  },

  /* ═══════════ UPDATE LOOP ═══════════ */
  update: function(time, delta){
    var sc = this;
    if(sc.isGameOver) return;

    /* --- starfield scroll --- */
    var speeds = [0.3, 0.7, 1.4];
    for(var layer=0; layer<3; layer++){
      var arr = sc.stars[layer];
      for(var i=0; i<arr.length; i++){
        arr[i].y += speeds[layer] * (delta/16);
        if(arr[i].y > sc.gameH + 5){
          arr[i].y = -5;
          arr[i].x = Phaser.Math.Between(0, sc.gameW);
        }
      }
    }

    /* --- player movement --- */
    var moveX = 0;
    var spd = sc.playerSpeed;
    if(sc.cursors.left.isDown) moveX = -spd;
    else if(sc.cursors.right.isDown) moveX = spd;

    if(sc.touchStartX !== null && sc.touchX !== null){
      var dx = sc.touchX - sc.touchStartX;
      var targetX = sc.touchPlayerStartX + dx;
      targetX = Phaser.Math.Clamp(targetX, 20, sc.gameW - 20);
      var diff = targetX - sc.player.x;
      moveX = Phaser.Math.Clamp(diff * 8, -spd, spd);
    }

    sc.player.body.setVelocityX(moveX);

    // shield follows player
    if(sc.shieldActive){
      sc.shieldSprite.setPosition(sc.player.x, sc.player.y);
      sc.shieldSprite.rotation += 0.02;
    }

    /* --- auto-fire --- */
    sc.fireTimer -= delta;
    if(sc.fireTimer <= 0){
      sc.firePlayerBullet();
      sc.fireTimer = sc.fireRate;
    }

    /* --- recycle off-screen player bullets --- */
    sc.playerBullets.getChildren().forEach(function(b){
      if(b.active && (b.y < -20 || b.x < -20 || b.x > sc.gameW+20)){
        b.setActive(false).setVisible(false);
        b.body.enable = false;
      }
    });

    /* --- recycle off-screen enemy bullets --- */
    sc.enemyBullets.getChildren().forEach(function(b){
      if(b.active && (b.y > sc.gameH+20 || b.y < -20 || b.x < -30 || b.x > sc.gameW+30)){
        b.setActive(false).setVisible(false);
        b.body.enable = false;
      }
    });

    /* --- enemy AI --- */
    sc.enemies.getChildren().forEach(function(e){
      if(!e.active) return;

      e.time += delta;

      // movement patterns
      if(e.movePattern === 0){
        // sine wave
        e.x = e.baseX + Math.sin(e.time * 0.002) * 50;
      } else if(e.movePattern === 1){
        // drift toward player
        var dx = sc.player.x - e.x;
        e.x += Math.sign(dx) * 0.3 * (delta/16);
      } else if(e.movePattern === 3){
        // boss: wide sine
        e.x = sc.gameW/2 + Math.sin(e.time * 0.001) * (sc.gameW * 0.3);
        e.baseX = e.x;
      }
      // pattern 2: just drifts down

      // enemy shooting
      e.shootTimer -= delta;
      if(e.shootTimer <= 0 && e.y > 0 && e.y < sc.gameH * 0.7){
        sc.fireEnemyBullet(e.x, e.y + 10);
        if(e.isBoss){
          // boss fires spread
          sc.fireEnemyBullet(e.x - 25, e.y + 10);
          sc.fireEnemyBullet(e.x + 25, e.y + 10);
        }
        e.shootTimer = e.shootInterval;
      }

      // recycle off-screen enemies
      if(e.y > sc.gameH + 40){
        e.setActive(false).setVisible(false);
        e.body.enable = false;
        sc.enemiesKilledThisWave++;
        if(sc.enemiesKilledThisWave >= sc.totalEnemiesInWave){
          sc.waveActive = false;
          sc.nextWaveCountdown = 1500;
        }
      }
    });

    /* --- recycle off-screen power-ups --- */
    sc.powerUps.getChildren().forEach(function(p){
      if(p.active && p.y > sc.gameH + 30){
        p.setActive(false).setVisible(false);
        p.body.enable = false;
        sc.tweens.killTweensOf(p);
      }
    });

    /* --- combo timer --- */
    if(sc.comboTimer > 0){
      sc.comboTimer -= delta;
      if(sc.comboTimer <= 0){
        sc.comboCount = 0;
        sc.multiplier = 1;
      }
    }
    if(sc.multiplier > 1){
      sc.multiText.setText('x' + sc.multiplier.toFixed(1) + ' COMBO');
    } else {
      sc.multiText.setText('');
    }

    /* --- power-up timers --- */
    if(sc.spreadShot){
      sc.spreadTimer -= delta;
      if(sc.spreadTimer <= 0){ sc.spreadShot = false; }
    }
    if(sc.shieldActive){
      sc.shieldTimer -= delta;
      if(sc.shieldTimer <= 0){
        sc.shieldActive = false;
        sc.shieldSprite.setVisible(false);
      }
    }
    if(sc.speedBoost){
      sc.speedTimer -= delta;
      if(sc.speedTimer <= 0){
        sc.speedBoost = false;
        sc.playerSpeed = 320;
      }
    }

    /* --- invincibility timer --- */
    if(sc.invincible){
      sc.invTimer -= delta;
      sc.player.setAlpha(Math.sin(time * 0.01) > 0 ? 0.8 : 0.2);
      if(sc.invTimer <= 0){
        sc.invincible = false;
        sc.player.setAlpha(1);
      }
    }

    /* --- wave progression --- */
    if(!sc.waveActive && !sc.bossAlive){
      sc.nextWaveCountdown -= delta;
      if(sc.nextWaveCountdown <= 0){
        sc.spawnWave();
      }
    }

    /* --- boss HP bar update --- */
    if(sc.bossAlive && sc.bossRef && sc.bossRef.active){
      var pct = sc.bossRef.hp / sc.bossRef.maxHp;
      sc.bossHpBar.setScale(pct, 1);
    }
  }
});

/* ───────── Phaser config & launch ───────── */
var config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  backgroundColor: '#000000',
  parent: document.body,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, GameScene],
  input: {
    activePointers: 2
  },
  audio: { noAudio: true }
};

var game = new Phaser.Game(config);

/* handle resize */
window.addEventListener('resize', function(){
  game.scale.resize(window.innerWidth, window.innerHeight);
});

})();
</script>
</body>
</html>`;
